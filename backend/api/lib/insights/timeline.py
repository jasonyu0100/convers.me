"""Timeline utilities for insights."""

from typing import Dict

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from db.models import Event, EventParticipant, Process, Step


def get_user_timeline_data(db: Session, user_id: str) -> Dict:
    """Get timeline data for the user profile."""
    # Format for timeline data model
    timeline_data = {
        "userId": user_id,
        "events": [],
        "processes": [],
    }

    # Get user's events (both created and participating)
    events_query = (
        db.query(Event)
        .options(joinedload(Event.topics))
        .distinct()
        .outerjoin(EventParticipant, Event.id == EventParticipant.event_id)
        .filter(
            or_(
                Event.created_by_id == user_id,
                EventParticipant.user_id == user_id
            )
        )
        .order_by(Event.date, Event.time)
    )

    events = events_query.all()

    # Format events for timeline
    for event in events:
        topic_names = [topic.name for topic in event.topics] if hasattr(event, 'topics') else []

        event_data = {
            "id": str(event.id),
            "title": event.title,
            "date": event.date,
            "time": event.time,
            "status": event.status.value if event.status else None,
            "color": event.color,
            "tags": topic_names,
            "isCreator": str(event.created_by_id) == user_id
        }

        timeline_data["events"].append(event_data)

    # Get user's processes
    processes_query = (
        db.query(Process)
        .filter(Process.created_by_id == user_id)
        .order_by(Process.created_at)
    )

    processes = processes_query.all()

    # Format processes for timeline
    for process in processes:
        # Count steps and completed steps
        step_count = db.query(func.count(Step.id)).filter(Step.process_id == process.id).scalar() or 0
        completed_steps = db.query(func.count(Step.id)).filter(
            Step.process_id == process.id, Step.completed == True
        ).scalar() or 0

        # Calculate progress percentage
        progress = int((completed_steps / step_count) * 100) if step_count > 0 else 0

        process_data = {
            "id": str(process.id),
            "title": process.title,
            "created_at": process.created_at.isoformat() if process.created_at else None,
            "updated_at": process.updated_at.isoformat() if process.updated_at else None,
            "color": process.color,
            "category": process.category,
            "progress": progress,
            "step_count": step_count,
            "completed_steps": completed_steps
        }

        timeline_data["processes"].append(process_data)

    return timeline_data
