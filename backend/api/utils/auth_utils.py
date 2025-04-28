"""Authentication and permission utilities for the API."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from db.models import Event, EventParticipant, Process, User


def verify_process_ownership(db: Session, process_id: UUID, user_id: UUID):
    """
    Verify the user has ownership rights for the process.

    Args:
        db: Database session
        process_id: ID of the process to check
        user_id: ID of the user to verify

    Returns:
        Process: The process object if authorized

    Raises:
        HTTPException: If not authorized or process not found
    """
    process = db.query(Process).filter(Process.id == process_id).first()
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Process not found")

    # Check if user is the creator
    if process.created_by_id == user_id:
        return process

    # For now, only the creator can modify processes
    # Additional roles could be added here in the future
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                        detail="You don't have permission to modify this process")


def verify_event_ownership(db: Session, event_id: UUID, user_id: UUID, allow_participant: bool = False):
    """
    Verify the user has ownership rights for the event.

    Args:
        db: Database session
        event_id: ID of the event to check
        user_id: ID of the user to verify
        allow_participant: If True, allow any participant (not just creator/organizer)

    Returns:
        Event: The event object if authorized

    Raises:
        HTTPException: If not authorized or event not found
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Check if user is the creator
    if event.created_by_id == user_id:
        return event

    # Check participant status based on the role required
    if allow_participant:
        # Any participant role is sufficient
        is_participant = db.query(EventParticipant).filter(
            EventParticipant.event_id == event_id, EventParticipant.user_id == user_id).first()

        if is_participant:
            return event
    else:
        # Only organizer or editor roles can modify
        is_authorized = (
            db.query(EventParticipant)
            .filter(EventParticipant.event_id == event_id, EventParticipant.user_id == user_id, EventParticipant.role.in_(["organizer", "editor"]))
            .first()
        )

        if is_authorized:
            return event

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                        detail="You don't have permission to access this event")


def verify_user_admin(current_user: User):
    """
    Verify the user has admin privileges.

    Args:
        current_user: The user to check

    Raises:
        HTTPException: If the user is not an admin
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="This operation requires administrator privileges")

    return True
