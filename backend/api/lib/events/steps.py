"""Event steps utilities."""

from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from api.schemas.events import SchemaStepCreate, SchemaStepOut, SchemaSubStepOut
from db.models import Event, EventParticipant, Step, SubStep, User


def get_event_steps(db: Session, event_id: str, current_user: User) -> List[SchemaStepOut]:
    """Get all steps for an event.

    This function redirects to the process steps endpoint since all event steps
    should now be stored in the linked process.
    """
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # If event has no linked process, create one to ensure proper architecture
    if not event.process_id:
        import uuid
        from datetime import datetime

        from db.models import Process

        print(f"Event {event_id} has no linked process - creating one for it")

        # Create a new process linked to this event
        new_process = Process(
            id=str(uuid.uuid4()),
            title=event.title,
            description=event.description or f"Process for event: {event.title}",
            color=event.color or "blue",
            last_updated=datetime.utcnow().isoformat(),
            favorite=False,
            category="event",
            created_by_id=event.created_by_id,
            process_metadata={"created_from_event": True, "event_id": str(event_id)},
        )
        db.add(new_process)
        db.flush()  # Get ID without committing yet

        # Link process to the event
        event.process_id = new_process.id

        # Note: Step.event_id has been removed from the schema
        # Legacy step migration is no longer needed as steps can only be associated with processes

        # Commit all changes
        db.commit()

    # Use the process steps helper
    from api.routes.processes import get_process_steps_internal

    # Call the process steps function with the process ID from the event
    steps = get_process_steps_internal(db, event.process_id, current_user)

    print(f"Retrieved {len(steps)} steps from process {event.process_id} for event {event_id}")

    return steps


def create_event_step(db: Session, event_id: UUID, step: SchemaStepCreate, current_user: User) -> SchemaStepOut:
    """Create a new step for an event.

    This function ensures the event has a linked process and then creates the step in that process.
    """
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

    # If event has no linked process, create one
    if not event.process_id:
        # Similar process creation logic as in get_event_steps
        import uuid
        from datetime import datetime

        from db.models import Process

        print(f"Event {event_id} has no linked process - creating one for it")

        new_process = Process(
            id=str(uuid.uuid4()),
            title=event.title,
            description=event.description or f"Process for event: {event.title}",
            color=event.color or "blue",
            last_updated=datetime.utcnow().isoformat(),
            favorite=False,
            category="event",
            created_by_id=event.created_by_id,
            process_metadata={"created_from_event": True, "event_id": str(event_id)},
        )
        db.add(new_process)
        db.commit()
        db.refresh(new_process)

        # Link process to the event
        event.process_id = new_process.id
        db.commit()

    print(f"Creating step in process {event.process_id} for event {event_id}")

    # Create the step in the process
    new_step = Step(
        content=step.content,
        completed=step.completed,
        order=step.order,
        due_date=step.dueDate,
        process_id=event.process_id
    )

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
        processId=str(event.process_id),
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
