"""Notification routes for the API."""

from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from api.schemas.notifications import SchemaNotificationCreate as NotificationCreate
from api.schemas.notifications import SchemaNotificationListResponse as NotificationListResponse
from api.schemas.notifications import SchemaNotificationOut as NotificationOut
from api.schemas.notifications import SchemaNotificationType
from api.schemas.notifications import SchemaNotificationUpdate as NotificationUpdate
from api.security import get_current_user
from db.database import get_db
from db.models import Notification, NotificationTypeEnum, User

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    unread_only: bool = Query(False, description="Filter to only unread notifications"),
    limit: int = Query(50, ge=1, le=100, description="Number of notifications to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    type: Optional[SchemaNotificationType] = Query(None, description="Filter by notification type"),
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """
    Get user notifications with pagination and filtering options.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    # Base query
    query = db.query(Notification).filter(Notification.user_id == current_user.id)

    # Add filters
    if unread_only:
        query = query.filter(Notification.read == False)
    if type:
        # Convert schema enum to database enum
        db_type = NotificationTypeEnum(type.value)
        query = query.filter(Notification.type == db_type)

    # Get total count and unread count
    total_count = query.count()
    unread_count = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.read == False).count()

    # Get notifications with pagination
    notifications = query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()

    # Convert notifications to dictionaries and ensure proper field formats
    notification_dicts = [n.to_dict() for n in notifications]
    return NotificationListResponse(items=[NotificationOut.model_validate(item) for item in notification_dicts], total=total_count, unread=unread_count)


@router.get("/unread-count", response_model=int)
async def get_unread_count(db: Session = Depends(get_db), current_user: Annotated[User, Depends(get_current_user)] = None):
    """
    Get count of unread notifications for the current user.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    return db.query(Notification).filter(Notification.user_id == current_user.id, Notification.read == False).count()


@router.get("/{notification_id}", response_model=NotificationOut)
async def get_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """
    Get a specific notification by ID.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()

    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    # Convert notification to dictionary first, then validate with Pydantic
    notification_dict = notification.to_dict()
    return NotificationOut.model_validate(notification_dict)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=NotificationOut)
async def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """
    Create a new notification.

    This endpoint is primarily for internal use, but can be used
    by admins to send system notifications to users.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    # Check if user exists
    user = db.query(User).filter(User.id == notification.userId).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")

    # Only allow SYSTEM type for direct creation unless sending to self
    if notification.type != SchemaNotificationType.SYSTEM and notification.userId != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only SYSTEM notifications can be created for other users")

    # Create the notification - map schema enum to model enum
    db_notification = Notification(
        type=NotificationTypeEnum(notification.type.value),
        title=notification.title,
        message=notification.message,
        link=notification.link,
        read=notification.read,
        reference_id=notification.referenceId,
        reference_type=notification.referenceType,
        notification_metadata=notification.metadata,
        user_id=notification.userId,
        sender_id=notification.senderId or str(current_user.id),
    )

    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)

    return db_notification.to_dict()


@router.put("/{notification_id}", response_model=NotificationOut)
async def update_notification(
    notification_id: UUID,
    update_data: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """
    Update a notification (mark as read/unread).
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()

    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    # Update fields
    if update_data.read is not None:
        notification.read = update_data.read

    db.commit()
    db.refresh(notification)

    return notification.to_dict()


@router.post("/mark-all-read", response_model=int)
async def mark_all_read(db: Session = Depends(get_db), current_user: Annotated[User, Depends(get_current_user)] = None):
    """
    Mark all notifications as read.
    Returns the number of notifications updated.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    # Count notifications to be marked as read
    unread_count = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.read == False).count()

    # If there are many notifications, process in the background
    if unread_count > 10:
        # Import here to avoid circular imports
        from tasks.notification_tasks import mark_notifications_as_read

        # Schedule task and return count immediately
        mark_notifications_as_read.delay(user_id=str(current_user.id), all_notifications=True)
        return unread_count

    # If few notifications, process immediately
    result = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.read == False).update({Notification.read: True})

    db.commit()
    return result


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """
    Delete a notification.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()

    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    db.delete(notification)
    db.commit()

    return None
