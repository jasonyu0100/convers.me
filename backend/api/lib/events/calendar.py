"""Calendar event utilities."""

from datetime import datetime, timedelta
from typing import Dict, List

from fastapi import HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from db.models import Event, EventParticipant, User


def get_calendar_events(db: Session, current_user: User, start_date: str, end_date: str) -> List[Dict]:
    """Get events for calendar view within a specific date range."""
    try:
        # Validate date range - limit to 2 months maximum
        try:
            start_date_obj = datetime.fromisoformat(
                start_date.replace("Z", "+00:00"))
            end_date_obj = datetime.fromisoformat(end_date.replace("Z", "+00:00"))

            # Calculate the date difference
            date_diff = (end_date_obj - start_date_obj).days

            # If more than 62 days requested (approximately 2 months), limit to that
            if date_diff > 62:
                end_date_obj = start_date_obj + timedelta(days=62)
                end_date = end_date_obj.strftime("%Y-%m-%d")
                # Silently limit the date range
        except ValueError:
            # If dates can't be parsed, proceed with original values
            pass

        # Get events where user is creator or participant - only select essential fields
        events_query = db.query(Event).distinct().outerjoin(
            EventParticipant, Event.id == EventParticipant.event_id)

        # Apply user filter first - either for all users or conditionally for non-guests
        if not current_user.is_guest:
            # Regular users only see their own events (created or participating)
            events_query = events_query.filter(or_(
                Event.created_by_id == current_user.id, EventParticipant.user_id == current_user.id))

        # Then apply date filter to all queries
        # Create date objects for comparison
        start_date_obj = datetime.fromisoformat(start_date).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date_obj = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, microsecond=999999)

        # Filter by start_time if available, otherwise fall back to date field for backwards compatibility
        events_query = events_query.filter(
            or_(
                and_(Event.start_time >= start_date_obj, Event.start_time <= end_date_obj),  # Using start_time
                and_(Event.date >= start_date, Event.date <= end_date)  # Legacy fallback using date string
            )
        ).order_by(Event.start_time, Event.date, Event.time)

        events_data = events_query.all()

        # Convert to lightweight dictionaries with only necessary fields for calendar
        result = []
        for event in events_data:
            # Create a dictionary with the event data
            event_dict = {
                # Always explicitly convert UUID to string
                "id": str(event.id),
                "title": event.title,
                "description": event.description,
                "start_time": event.start_time.isoformat() if event.start_time else None,
                "end_time": event.end_time.isoformat() if event.end_time else None,
                # Keep legacy fields for backwards compatibility
                "date": event.date,
                "time": event.time if event.time else "",
                "duration": event.duration,
                "status": event.status.value if event.status else None,
                "color": event.color,
                "location": event.location,
                "created_by_id": (str(event.created_by_id) if event.created_by_id else None),
                "created_at": (event.created_at.isoformat() if event.created_at else datetime.now().isoformat()),
                "updated_at": (event.updated_at.isoformat() if event.updated_at else None),
                "process_id": str(event.process_id) if event.process_id else None,
                # is_recurring field has been removed from the database model
                "topics": [],
            }
            result.append(event_dict)

        return result

    except Exception as e:
        # Re-raise as HTTPException for API handling
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Error retrieving calendar events: {str(e)}")
