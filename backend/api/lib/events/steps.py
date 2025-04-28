"""Event steps utilities."""

from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from api.schemas.events import SchemaStepCreate, SchemaStepOut, SchemaSubStepOut
from db.models import Event, EventParticipant, Step, SubStep, User


def get_event_steps(db: Session, event_id: str, current_user: User) -> List[SchemaStepOut]:
    """Get all steps for an event."""
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Get steps with sub-steps
    steps = db.query(Step).options(joinedload(Step.sub_steps)).filter(
        Step.event_id == event_id).order_by(Step.order).all()

    # Debug: Check if substeps are loaded
    print(f"Event {event_id} has {len(steps)} steps")

    # If no steps found, return default steps for better UX
    if not steps:
        # Create default steps based on event type
        from api.lib.events.helpers import generate_substeps_for_step

        # Create a default step list
        default_steps = []
        default_titles = [
            "Preparation",
            "Execution",
            "Follow-up"
        ]

        # Generate default steps with UUIDs
        for i, title in enumerate(default_titles):
            step_out = SchemaStepOut(
                id=f"step-default-{i}",
                content=title,
                completed=False,
                order=i + 1,
                dueDate=None,
                eventId=str(event_id),
                processId=None,
                createdAt=None,
                updatedAt=None,
                completedAt=None,
                subSteps=[],
            )

            # Generate substeps for this default step
            substeps = generate_substeps_for_step(title)
            step_substeps = []

            for j, substep_content in enumerate(substeps):  # No longer limiting substeps
                substep_out = SchemaSubStepOut(
                    id=f"substep-default-{i}-{j}",
                    content=substep_content,
                    completed=False,
                    order=j + 1,
                    stepId=step_out.id,
                    createdAt=None,
                    updatedAt=None,
                    completedAt=None,
                )
                step_substeps.append(substep_out)

            step_out.subSteps = step_substeps
            default_steps.append(step_out)

        print(f"Returning {len(default_steps)} default steps for empty event {event_id}")
        return default_steps

    # Use the well-tested formatting helper function from api.lib.events.helpers
    from api.lib.events.helpers import format_steps_with_substeps
    formatted_steps = format_steps_with_substeps(steps)

    if not formatted_steps:
        print(f"Warning: Event {event_id} has {len(steps)} steps but no formatted steps were returned")

    return formatted_steps


def create_event_step(db: Session, event_id: UUID, step: SchemaStepCreate, current_user: User) -> SchemaStepOut:
    """Create a new step for an event."""
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Check permissions
    if event.created_by_id != current_user.id:
        # Check if they're a participant with the right role
        is_organizer = (
            db.query(EventParticipant)
            .filter(
                EventParticipant.event_id == event_id,
                EventParticipant.user_id == current_user.id,
                EventParticipant.role.in_(["organizer", "editor"]),
            )
            .first()
        )

        if not is_organizer:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You don't have permission to add steps to this event")

    # Create the step
    new_step = Step(content=step.content, completed=step.completed,
                    order=step.order, due_date=step.dueDate, event_id=event_id)
    db.add(new_step)
    db.commit()
    db.refresh(new_step)

    # Add sub-steps if provided
    sub_steps = []
    if step.subSteps:
        for sub_step_data in step.subSteps:
            sub_step = SubStep(
                content=sub_step_data.content,
                completed=sub_step_data.completed,
                order=sub_step_data.order,
                step_id=new_step.id,
            )
            db.add(sub_step)
            sub_steps.append(sub_step)

        db.commit()
        for sub_step in sub_steps:
            db.refresh(sub_step)

    # Refresh step with sub-steps
    db.refresh(new_step)

    # Use camelCase in Pydantic schema field names
    return SchemaStepOut(
        id=str(new_step.id),
        content=new_step.content,
        completed=new_step.completed,
        order=new_step.order,
        dueDate=new_step.due_date,
        eventId=str(new_step.event_id),
        processId=None,
        createdAt=new_step.created_at,
        updatedAt=new_step.updated_at,
        completedAt=new_step.completed_at,
        subSteps=[
            SchemaSubStepOut(
                id=str(ss.id),
                content=ss.content,
                completed=ss.completed,
                order=ss.order,
                stepId=str(ss.step_id),
                createdAt=ss.created_at,
                updatedAt=ss.updated_at,
                completedAt=ss.completed_at,
            )
            for ss in new_step.sub_steps
        ],
    )
