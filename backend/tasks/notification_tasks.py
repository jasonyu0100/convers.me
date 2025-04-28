"""
Background tasks for processing notifications.
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional

from db.database import get_db_session
from db.models import Notification, NotificationTypeEnum
from worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.notification_tasks.send_notification")
def send_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    link: Optional[str] = None,
    sender_id: Optional[str] = None,
    reference_id: Optional[str] = None,
    reference_type: Optional[str] = None,
    metadata: Optional[Dict] = None,
) -> str:
    """
    Create and send a notification to a user.

    Args:
        user_id: ID of the user to notify
        notification_type: Type of notification (from NotificationTypeEnum)
        title: Notification title
        message: Notification message
        link: Optional link to related content
        sender_id: Optional ID of the user who triggered the notification
        reference_id: Optional ID of the related entity
        reference_type: Optional type of the related entity
        metadata: Optional additional metadata

    Returns:
        str: ID of the created notification
    """
    logger.info("Creating notification for user %s: %s", user_id, title)

    with get_db_session() as db:
        # Validate notification type
        try:
            notification_type_enum = NotificationTypeEnum(notification_type)
        except ValueError:
            logger.error("Invalid notification type: %s", notification_type)
            return None

        # Create notification
        notification = Notification(
            type=notification_type_enum,
            title=title,
            message=message,
            link=link,
            user_id=user_id,
            sender_id=sender_id,
            reference_id=reference_id,
            reference_type=reference_type,
            notification_metadata=metadata or {},
            read=False,
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        logger.info("Notification created with ID: %s", notification.id)
        return str(notification.id)


@celery_app.task(name="tasks.notification_tasks.send_bulk_notifications")
def send_bulk_notifications(
    user_ids: List[str],
    notification_type: str,
    title: str,
    message: str,
    link: Optional[str] = None,
    sender_id: Optional[str] = None,
    reference_id: Optional[str] = None,
    reference_type: Optional[str] = None,
    metadata: Optional[Dict] = None,
) -> List[str]:
    """
    Send the same notification to multiple users.

    Args:
        user_ids: List of user IDs to notify
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        link: Optional link to related content
        sender_id: Optional ID of the user who triggered the notification
        reference_id: Optional ID of the related entity
        reference_type: Optional type of the related entity
        metadata: Optional additional metadata

    Returns:
        List[str]: List of created notification IDs
    """
    logger.info("Sending bulk notifications to %d users", len(user_ids))

    notification_ids = []
    for user_id in user_ids:
        notification_id = send_notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            link=link,
            sender_id=sender_id,
            reference_id=reference_id,
            reference_type=reference_type,
            metadata=metadata,
        )
        if notification_id:
            notification_ids.append(notification_id)

    logger.info("Created %d notifications in bulk", len(notification_ids))
    return notification_ids


@celery_app.task(name="tasks.notification_tasks.mark_notifications_as_read")
def mark_notifications_as_read(
    user_id: str,
    notification_ids: Optional[List[str]] = None,
    all_notifications: bool = False,
) -> int:
    """
    Mark notifications as read for a user.

    Args:
        user_id: ID of the user
        notification_ids: Optional list of notification IDs to mark as read
        all_notifications: If True, mark all user's notifications as read

    Returns:
        int: Number of notifications marked as read
    """
    logger.info("Marking notifications as read for user %s", user_id)

    with get_db_session() as db:
        query = db.query(Notification).filter(Notification.user_id == user_id, Notification.read == False)

        if not all_notifications and notification_ids:
            query = query.filter(Notification.id.in_(notification_ids))

        # Count notifications to be updated
        count = query.count()

        # Update notifications
        query.update({"read": True, "updated_at": datetime.utcnow()}, synchronize_session=False)

        db.commit()
        logger.info("Marked %d notifications as read for user %s", count, user_id)
        return count
