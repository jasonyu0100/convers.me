"""
Utility functions for event-related operations.
These functions are used across the events router to reduce code duplication.
"""

import logging
from typing import Any, Dict, List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# Import directly from the source module to avoid circular dependency with api.utils.__init__
from api.utils.api_utils import ensure_uuid_as_string
from db.models import Event, EventParticipant, Step, SubStep

# NOTE: Schema classes are imported within functions to avoid circular imports
# with api.schemas.events ↔ api.schemas.base ↔ api.utils.api_utils ↔ api.utils.__init__ ↔ api.utils.event_utils


def verify_event_ownership(db: Session, event_id: UUID, user_id: UUID):
    """Verify the user has ownership rights (creator or organizer) for the event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Check if user is the creator
    if event.created_by_id == user_id:
        return event

    # Check if user is an organizer
    is_organizer = (
        db.query(EventParticipant)
        .filter(
            EventParticipant.event_id == event_id,
            EventParticipant.user_id == user_id,
            EventParticipant.role == "organizer",
        )
        .first()
    )

    if not is_organizer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to modify this event")

    return event


def create_participants_group(participants: List[EventParticipant]):
    """Create a participants group from a list of participants."""
    # Import here to avoid circular import chain
    from api.schemas.events import ParticipantsGroup, ParticipantUser

    participants_list = [
        ParticipantUser(id=str(p.user.id), name=p.user.name, handle=p.user.handle, profile_image=p.user.profile_image) for p in participants if p.user
    ]

    return ParticipantsGroup(
        name="Participants",
        count=len(participants_list),
        avatars=participants_list[:5],
    )


def format_steps_with_substeps(steps: List[Step]):
    """Format steps with their substeps for API responses."""
    # Import here to avoid circular import chain
    from api.schemas.events import StepOut, SubStepOut

    formatted_steps = []

    for step in sorted(steps, key=lambda s: s.order):
        sub_steps = []
        if step.sub_steps:
            sub_steps = sorted(step.sub_steps, key=lambda ss: ss.order)

        # Convert substeps to a properly processed list with UUID as strings
        processed_substeps = []
        for substep in sub_steps:
            # Ensure all UUIDs are converted to strings before creating the model
            substep_dict = ensure_uuid_as_string(
                {
                    "id": substep.id,
                    "content": substep.content,
                    "completed": substep.completed,
                    "order": substep.order,
                    "step_id": substep.step_id,
                    "created_at": substep.created_at,
                    "updated_at": substep.updated_at,
                    "completed_at": substep.completed_at,
                }
            )
            processed_substeps.append(SubStepOut.model_validate(substep_dict))

        # Create the step output object
        formatted_steps.append(
            StepOut(
                id=str(step.id),
                content=step.content,
                completed=step.completed,
                order=step.order,
                due_date=step.due_date,
                event_id=str(step.event_id) if step.event_id else None,
                process_id=str(step.process_id) if step.process_id else None,
                created_at=step.created_at,
                updated_at=step.updated_at,
                completed_at=step.completed_at,
                sub_steps=processed_substeps,
            )
        )

    return formatted_steps


def should_have_substeps(step_content: str) -> bool:
    """Check if a step should have substeps based on its content."""
    # Check for common software development steps that should have substeps
    common_steps = [
        "Requirements analysis",
        "Technical design",
        "Implementation",
        "Unit tests",
        "Code review",
        "Integration testing",
        "Planning",
        "Development",
        "Testing",
        "Documentation",
        "Deployment",
    ]

    for common_step in common_steps:
        if common_step.lower() in step_content.lower():
            return True

    return False


def generate_substeps_for_step(step: Step) -> List[str]:
    """Generate substep content for a step based on its content."""
    # Generate appropriate substeps based on the step content
    substeps = []

    if "Requirements analysis" in step.content:
        substeps = [
            "Identify stakeholders",
            "Gather requirements",
            "Document functional requirements",
            "Document non-functional requirements",
            "Validate requirements with stakeholders",
        ]
    elif "Technical design" in step.content:
        substeps = [
            "Define system architecture",
            "Create component diagrams",
            "Design database schema",
            "Define API interfaces",
            "Review design with team",
        ]
    elif "Implementation" in step.content:
        substeps = [
            "Set up development environment",
            "Implement core functionality",
            "Implement error handling",
            "Add logging and monitoring",
            "Optimize performance",
        ]
    elif "Unit tests" in step.content:
        substeps = [
            "Create test plan",
            "Write test cases",
            "Implement unit tests",
            "Run tests and fix issues",
            "Document test results",
        ]
    elif "Code review" in step.content:
        substeps = [
            "Review code for quality",
            "Check for security issues",
            "Verify adherence to coding standards",
            "Address review comments",
            "Final approval",
        ]
    elif "Integration testing" in step.content:
        substeps = [
            "Set up integration test environment",
            "Create integration test cases",
            "Execute integration tests",
            "Document and fix issues",
            "Verify integration points",
        ]
    elif "Planning" in step.content:
        substeps = [
            "Define project scope",
            "Identify resources needed",
            "Create timeline",
            "Assign responsibilities",
            "Risk assessment",
        ]
    elif "Development" in step.content:
        substeps = [
            "Set up development environment",
            "Code implementation",
            "Unit testing",
            "Code review",
            "Documentation",
        ]
    elif "Testing" in step.content:
        substeps = ["Create test plan", "Develop test cases", "Execute tests", "Document issues", "Verify fixes"]
    elif "Documentation" in step.content:
        substeps = [
            "Create user documentation",
            "Write technical documentation",
            "Document API references",
            "Create maintenance guides",
            "Review and finalize",
        ]
    elif "Deployment" in step.content:
        substeps = [
            "Prepare deployment environment",
            "Create deployment plan",
            "Perform deployment",
            "Verify deployment",
            "Monitor for issues",
        ]
    else:
        # Default substeps for other steps
        substeps = ["Plan", "Execute", "Review", "Document", "Follow up"]

    return substeps


def create_auto_substeps(db: Session, step: Step) -> List[SubStep]:
    """Automatically create substeps for a step if needed and return them."""
    if not step.sub_steps and should_have_substeps(step.content):
        substep_contents = generate_substeps_for_step(step)
        added_substeps = []

        for i, content in enumerate(substep_contents):
            # Create new substep in the database
            new_substep = SubStep(content=content, completed=False, order=i + 1, step_id=step.id)
            db.add(new_substep)
            added_substeps.append(new_substep)

        # Commit the new substeps
        db.commit()

        # Refresh the step to get the new substeps
        db.refresh(step)

        return added_substeps

    return []


def format_participants(participants: List[EventParticipant]) -> List[Dict[str, Any]]:
    """Format participants for API responses."""
    formatted_participants = []

    for p in participants:
        user_data = None
        if p.user:
            user_data = {
                "id": str(p.user.id),
                "name": p.user.name,
                "handle": p.user.handle,
                "profile_image": p.user.profile_image,
            }

        formatted_participants.append(
            {
                "event_id": str(p.event_id),
                "user_id": str(p.user_id),
                "role": p.role,
                "status": p.status.value if p.status else None,
                "joined_at": p.joined_at,
                "user": user_data,
            }
        )

    return formatted_participants


def log_status_change(db: Session, event_id: UUID, user_id: UUID, old_status: str, new_status: str) -> None:
    """Log a status change for an event."""
    try:
        # Create a status log entry if the model exists
        from db.models import StatusLog

        # Create a status log
        status_log = StatusLog(previous_status=old_status, new_status=new_status, event_id=event_id, user_id=user_id)
        db.add(status_log)
        logging.info(f"Status log created for event {event_id}: {old_status} -> {new_status}")
    except ImportError:
        # If the StatusLog model doesn't exist, log a warning and continue
        logging.warning("StatusLog model not available, skipping status log creation")
    except Exception as e:
        # Handle any other errors
        logging.error(f"Error creating status log: {str(e)}")
        # Continue without status logging
