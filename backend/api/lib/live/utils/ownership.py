"""
Utility functions for checking ownership and permissions in live sessions.
"""

import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from db.models import Event, Process

logger = logging.getLogger(__name__)


def verify_process_ownership(db: Session, process_id: UUID, user_id: UUID) -> Process:
    """
    Verify that a process exists and belongs to the specified user.

    Args:
        db: Database session
        process_id: UUID of the process to verify
        user_id: UUID of the user to check ownership against

    Returns:
        The Process object if ownership is verified

    Raises:
        HTTPException: If process doesn't exist or user doesn't own it
    """
    if not process_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Process ID is required",
        )

    process = db.query(Process).filter(Process.id == process_id).first()
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Process not found",
        )

    # Check if user owns the process
    if process.created_by_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this process",
        )

    return process


def verify_event_access(db: Session, event_id: UUID, user_id: UUID) -> Event:
    """
    Verify that an event exists and the user has access to it.

    Args:
        db: Database session
        event_id: UUID of the event to verify
        user_id: UUID of the user to check access against

    Returns:
        The Event object if access is verified

    Raises:
        HTTPException: If event doesn't exist or user doesn't have access
    """
    if not event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event ID is required",
        )

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # Check if user owns or participates in the event
    if event.created_by_id != user_id and not any(p.user_id == user_id for p in event.participants):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this event",
        )

    return event


def verify_template_ownership(db: Session, template_id: UUID, user_id: UUID) -> Process:
    """
    Verify that a template exists and belongs to the specified user.

    Args:
        db: Database session
        template_id: UUID of the template to verify
        user_id: UUID of the user to check ownership against

    Returns:
        The Process object if ownership is verified

    Raises:
        HTTPException: If template doesn't exist or user doesn't own it
    """
    if not template_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template ID is required",
        )

    template = db.query(Process).filter(
        Process.id == template_id,
        Process.is_template == True
    ).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    # Check if user owns the template
    if template.created_by_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this template",
        )

    return template
