"""Calendar-specific routes for the API."""

from datetime import datetime, timedelta
from typing import Annotated, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from api.schemas.events import SchemaEventOut
from api.security import get_current_user
from db.database import get_db
from db.models import Event, EventParticipant, User

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.get("/events", response_model=List[SchemaEventOut])
async def get_calendar_events(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    start_date: str = Query(..., description="Start date in ISO format (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date in ISO format (YYYY-MM-DD)"),
    include_participants: bool = Query(True, description="Include event participants in response"),
):
    """
    Get all events in a date range for the current user.
    This endpoint supports calendar views by retrieving events within a specified time period.
    """
    # Convert date strings to datetime objects for start_time/end_time filtering
    start_date_obj = datetime.fromisoformat(start_date).replace(hour=0, minute=0, second=0, microsecond=0)
    end_date_obj = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, microsecond=999999)

    # Get events where user is creator or participant
    events_query = (
        db.query(Event)
        .distinct()
        .outerjoin(EventParticipant, Event.id == EventParticipant.event_id)
        .filter(
            or_(Event.created_by_id == current_user.id, EventParticipant.user_id == current_user.id),
            or_(
                # Using new start_time field
                and_(Event.start_time >= start_date_obj, Event.start_time <= end_date_obj),
                # Fallback to legacy date field for backwards compatibility
                and_(Event.date >= start_date, Event.date <= end_date)
            )
        )
        .order_by(Event.start_time, Event.date, Event.time)
    )

    events = events_query.all()

    # Convert the events to dictionaries with explicit UUID conversion
    result = []
    for event in events:
        # Create event dict with string IDs and camelCase keys
        event_dict = {
            "id": str(event.id),  # Explicitly convert UUID to string
            "title": event.title,
            "description": event.description,
            "startTime": event.start_time.isoformat() if event.start_time else None,
            "endTime": event.end_time.isoformat() if event.end_time else None,
            # Keep legacy fields for backwards compatibility
            "date": event.date,
            "time": event.time,
            "duration": event.duration,
            "status": event.status.value if event.status else None,
            "color": event.color,
            "location": event.location,
            "createdById": str(event.created_by_id) if event.created_by_id else None,
            "processId": str(event.process_id) if event.process_id else None,
            "createdAt": event.created_at.isoformat() if event.created_at else None,
            "updatedAt": event.updated_at.isoformat() if event.updated_at else None,
            "recordingUrl": event.recording_url,
            "eventMetadata": event.event_metadata or {},
        }

        # Add topics if available with camelCase field names
        if hasattr(event, "topics"):
            event_dict["topics"] = [
                {
                    "id": str(topic.id),
                    "name": topic.name,
                    "category": topic.category,
                    "color": topic.color,
                    "createdAt": topic.created_at.isoformat() if topic.created_at else None
                }
                for topic in event.topics
            ]
        else:
            event_dict["topics"] = []

        # Add participants if requested with camelCase field names
        if include_participants and hasattr(event, "participants"):
            event_dict["participants"] = [
                {
                    "eventId": str(p.event_id),
                    "userId": str(p.user_id),
                    "role": p.role,
                    "status": p.status.value if p.status else None,
                    "joinedAt": p.joined_at.isoformat() if p.joined_at else None,
                    "user": ({"id": str(p.user.id), "name": p.user.name, "handle": p.user.handle, "profileImage": p.user.profile_image} if p.user else None),
                }
                for p in event.participants
            ]
        else:
            event_dict["participants"] = []

        result.append(event_dict)

    # Already converted to camelCase
    return result

@router.get("/today", response_model=List[SchemaEventOut])
async def get_today_events(current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get events for today (convenience endpoint)."""
    today = datetime.now().strftime("%Y-%m-%d")
    today_obj = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_obj = (today_obj + timedelta(days=1))

    # Get events where user is creator or participant
    events_query = (
        db.query(Event)
        .distinct()
        .outerjoin(EventParticipant, Event.id == EventParticipant.event_id)
        .filter(
            or_(Event.created_by_id == current_user.id, EventParticipant.user_id == current_user.id),
            or_(
                # Using new start_time field
                and_(Event.start_time >= today_obj, Event.start_time < tomorrow_obj),
                # Fallback to legacy date field for backwards compatibility
                Event.date == today
            )
        )
        .order_by(Event.start_time, Event.time)
    )

    events = events_query.all()

    # Convert the events to dictionaries with explicit UUID conversion
    result = []
    for event in events:
        # Create event dict with string IDs and camelCase keys
        event_dict = {
            "id": str(event.id),  # Explicitly convert UUID to string
            "title": event.title,
            "description": event.description,
            "startTime": event.start_time.isoformat() if event.start_time else None,
            "endTime": event.end_time.isoformat() if event.end_time else None,
            # Keep legacy fields for backwards compatibility
            "date": event.date,
            "time": event.time,
            "duration": event.duration,
            "status": event.status.value if event.status else None,
            "color": event.color,
            "location": event.location,
            "createdById": str(event.created_by_id) if event.created_by_id else None,
            "processId": str(event.process_id) if event.process_id else None,
            "createdAt": event.created_at.isoformat() if event.created_at else None,
            "updatedAt": event.updated_at.isoformat() if event.updated_at else None,
            "recordingUrl": event.recording_url,
            "eventMetadata": event.event_metadata or {},
        }

        # Add topics if available with camelCase field names
        if hasattr(event, "topics"):
            event_dict["topics"] = [
                {
                    "id": str(topic.id),
                    "name": topic.name,
                    "category": topic.category,
                    "color": topic.color,
                    "createdAt": topic.created_at.isoformat() if topic.created_at else None
                }
                for topic in event.topics
            ]
        else:
            event_dict["topics"] = []

        # Add participants with camelCase field names
        if hasattr(event, "participants"):
            event_dict["participants"] = [
                {
                    "eventId": str(p.event_id),
                    "userId": str(p.user_id),
                    "role": p.role,
                    "status": p.status.value if p.status else None,
                    "joinedAt": p.joined_at.isoformat() if p.joined_at else None,
                    "user": ({"id": str(p.user.id), "name": p.user.name, "handle": p.user.handle, "profileImage": p.user.profile_image} if p.user else None),
                }
                for p in event.participants
            ]
        else:
            event_dict["participants"] = []

        result.append(event_dict)

    # Already converted to camelCase
    return result

@router.get("/upcoming", response_model=List[SchemaEventOut])
async def get_upcoming_events(
    current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db), days: int = Query(7, description="Number of days to look ahead")
):
    """Get upcoming events for the next X days."""
    today = datetime.now().strftime("%Y-%m-%d")
    end_date = (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")

    # Create datetime objects for start_time/end_time filtering
    today_obj = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date_obj = (today_obj + timedelta(days=days)).replace(hour=23, minute=59, second=59, microsecond=999999)

    # Get events where user is creator or participant
    events_query = (
        db.query(Event)
        .distinct()
        .outerjoin(EventParticipant, Event.id == EventParticipant.event_id)
        .filter(
            or_(Event.created_by_id == current_user.id, EventParticipant.user_id == current_user.id),
            or_(
                # Using new start_time field
                and_(Event.start_time >= today_obj, Event.start_time <= end_date_obj),
                # Fallback to legacy date field for backwards compatibility
                and_(Event.date >= today, Event.date <= end_date)
            )
        )
        .order_by(Event.start_time, Event.date, Event.time)
    )

    events = events_query.all()

    # Convert the events to dictionaries with explicit UUID conversion
    result = []
    for event in events:
        # Create event dict with string IDs and camelCase keys
        event_dict = {
            "id": str(event.id),  # Explicitly convert UUID to string
            "title": event.title,
            "description": event.description,
            "startTime": event.start_time.isoformat() if event.start_time else None,
            "endTime": event.end_time.isoformat() if event.end_time else None,
            # Keep legacy fields for backwards compatibility
            "date": event.date,
            "time": event.time,
            "duration": event.duration,
            "status": event.status.value if event.status else None,
            "color": event.color,
            "location": event.location,
            "createdById": str(event.created_by_id) if event.created_by_id else None,
            "processId": str(event.process_id) if event.process_id else None,
            "createdAt": event.created_at.isoformat() if event.created_at else None,
            "updatedAt": event.updated_at.isoformat() if event.updated_at else None,
            "recordingUrl": event.recording_url,
            "eventMetadata": event.event_metadata or {},
        }

        # Add topics if available with camelCase field names
        if hasattr(event, "topics"):
            event_dict["topics"] = [
                {
                    "id": str(topic.id),
                    "name": topic.name,
                    "category": topic.category,
                    "color": topic.color,
                    "createdAt": topic.created_at.isoformat() if topic.created_at else None
                }
                for topic in event.topics
            ]
        else:
            event_dict["topics"] = []

        # Add participants with camelCase field names
        if hasattr(event, "participants"):
            event_dict["participants"] = [
                {
                    "eventId": str(p.event_id),
                    "userId": str(p.user_id),
                    "role": p.role,
                    "status": p.status.value if p.status else None,
                    "joinedAt": p.joined_at.isoformat() if p.joined_at else None,
                    "user": ({"id": str(p.user.id), "name": p.user.name, "handle": p.user.handle, "profileImage": p.user.profile_image} if p.user else None),
                }
                for p in event.participants
            ]
        else:
            event_dict["participants"] = []

        result.append(event_dict)

    # Already converted to camelCase
    return result

@router.get("/month", response_model=List[SchemaEventOut])
async def get_month_events(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    year: int = Query(..., description="Year"),
    month: int = Query(..., description="Month (1-12)"),
):
    """Get all events for a specific month."""
    # Calculate start and end dates for the month
    start_date = f"{year}-{month:02d}-01"

    # Calculate the last day of the month
    if month == 12:
        next_month_year = year + 1
        next_month = 1
    else:
        next_month_year = year
        next_month = month + 1

    next_month_start = f"{next_month_year}-{next_month:02d}-01"
    end_date_dt = datetime.fromisoformat(next_month_start) - timedelta(days=1)
    end_date = end_date_dt.strftime("%Y-%m-%d")

    # Create datetime objects for start_time/end_time filtering
    start_date_obj = datetime.fromisoformat(start_date).replace(hour=0, minute=0, second=0, microsecond=0)
    end_date_obj = end_date_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

    # Get events where user is creator or participant
    events_query = (
        db.query(Event)
        .distinct()
        .outerjoin(EventParticipant, Event.id == EventParticipant.event_id)
        .filter(
            or_(Event.created_by_id == current_user.id, EventParticipant.user_id == current_user.id),
            or_(
                # Using new start_time field
                and_(Event.start_time >= start_date_obj, Event.start_time <= end_date_obj),
                # Fallback to legacy date field for backwards compatibility
                and_(Event.date >= start_date, Event.date <= end_date)
            )
        )
        .order_by(Event.start_time, Event.date, Event.time)
    )

    events = events_query.all()

    # Convert the events to dictionaries with explicit UUID conversion
    result = []
    for event in events:
        # Create event dict with string IDs and camelCase keys
        event_dict = {
            "id": str(event.id),  # Explicitly convert UUID to string
            "title": event.title,
            "description": event.description,
            "startTime": event.start_time.isoformat() if event.start_time else None,
            "endTime": event.end_time.isoformat() if event.end_time else None,
            # Keep legacy fields for backwards compatibility
            "date": event.date,
            "time": event.time,
            "duration": event.duration,
            "status": event.status.value if event.status else None,
            "color": event.color,
            "location": event.location,
            "createdById": str(event.created_by_id) if event.created_by_id else None,
            "processId": str(event.process_id) if event.process_id else None,
            "createdAt": event.created_at.isoformat() if event.created_at else None,
            "updatedAt": event.updated_at.isoformat() if event.updated_at else None,
            "recordingUrl": event.recording_url,
            "eventMetadata": event.event_metadata or {},
        }

        # Add topics if available with camelCase field names
        if hasattr(event, "topics"):
            event_dict["topics"] = [
                {
                    "id": str(topic.id),
                    "name": topic.name,
                    "category": topic.category,
                    "color": topic.color,
                    "createdAt": topic.created_at.isoformat() if topic.created_at else None
                }
                for topic in event.topics
            ]
        else:
            event_dict["topics"] = []

        # Add participants with camelCase field names
        if hasattr(event, "participants"):
            event_dict["participants"] = [
                {
                    "eventId": str(p.event_id),
                    "userId": str(p.user_id),
                    "role": p.role,
                    "status": p.status.value if p.status else None,
                    "joinedAt": p.joined_at.isoformat() if p.joined_at else None,
                    "user": ({"id": str(p.user.id), "name": p.user.name, "handle": p.user.handle, "profileImage": p.user.profile_image} if p.user else None),
                }
                for p in event.participants
            ]
        else:
            event_dict["participants"] = []

        result.append(event_dict)

    # Already converted to camelCase
    return result
