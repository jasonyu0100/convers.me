"""Plan routes for the API."""

import uuid
from datetime import datetime, timedelta
from typing import Annotated, Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.schemas.plan import (
    SchemaPlanDirectory,
    SchemaPlanDirectoryTemplate,
    SchemaPlanEvent,
    SchemaPlanGenerateRequest,
    SchemaPlanGenerateResponse,
    SchemaPlanSaveRequest,
    SchemaPlanSaveResponse,
)
from api.security import get_current_user
from db.database import get_db
from db.models import Directory, Event, EventParticipant, EventStatusEnum, Process, Step, SubStep, User

router = APIRouter(prefix="/plan", tags=["plan"])


@router.get("/health", include_in_schema=True, response_model=Dict[str, Any])
async def health_check_plan():
    """Health check for the plan router."""
    from api.utils import check_router_health

    health_data = check_router_health("plan")
    return health_data


@router.get("/directories", response_model=List[SchemaPlanDirectory])
async def get_directories_with_templates(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """
    Get directories containing templates that can be used for planning.

    Returns:
        List of directories with their available templates.
    """
    # Get all directories that have processes with is_template=True
    # Filter by current user's directories only
    directories = (
        db.query(Directory)
        .join(Process, Directory.id == Process.directory_id)
        .filter(
            Process.is_template == True,
            Directory.created_by_id == current_user.id  # Only show user's own directories
        )
        .distinct()
        .all()
    )

    result = []

    for directory in directories:
        # Get templates in this directory
        templates = (
            db.query(Process)
            .filter(
                Process.directory_id == directory.id,
                Process.is_template == True
            )
            .all()
        )

        template_list = []
        for template in templates:
            # Count number of steps to estimate event count
            step_count = db.query(Step).filter(Step.process_id == template.id).count()

            template_list.append(
                SchemaPlanDirectoryTemplate(
                    id=str(template.id),
                    name=template.title,
                    templateCount=max(1, step_count)  # At least 1 event per template
                )
            )

        if template_list:
            result.append(
                SchemaPlanDirectory(
                    id=str(directory.id),
                    name=directory.name,
                    description=directory.description,
                    color=directory.color or "blue",
                    templates=template_list
                )
            )

    return result


@router.post("/generate", response_model=SchemaPlanGenerateResponse)
async def generate_plan(
    request: SchemaPlanGenerateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """
    Generate a weekly plan based on the provided parameters.

    Args:
        request: Plan generation parameters
        current_user: Authenticated user
        db: Database session

    Returns:
        Generated events for the plan
    """
    # Validate request parameters
    if request.hoursAllocation < 1 or request.hoursAllocation > 40:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hours allocation must be between 1 and 40"
        )

    if not request.description or not request.goals:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description and goals are required"
        )

    # Get processes from selected directories
    templates = []

    if request.directoryIds:
        for directory_id in request.directoryIds:
            dir_templates = (
                db.query(Process)
                .filter(
                    Process.directory_id == directory_id,
                    Process.is_template == True
                )
                .all()
            )
            templates.extend(dir_templates)

    # Also include specifically requested templates
    if request.templateIds:
        specific_templates = (
            db.query(Process)
            .filter(
                Process.id.in_(request.templateIds),
                Process.is_template == True
            )
            .all()
        )

        # Add only if not already in the list
        for template in specific_templates:
            if template not in templates:
                templates.append(template)

    # Start generating plan
    generated_events = []

    # Set up time allocation based on request
    today = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)

    # Start on next Monday for a weekly plan
    days_to_monday = (7 - today.weekday()) % 7
    if days_to_monday == 0:
        days_to_monday = 7  # If today is Monday, start next Monday

    start_date = today + timedelta(days=days_to_monday)
    total_minutes = request.hoursAllocation * 60

    # Allocate minutes per day based on effort level
    if request.effort == "low":
        days = [1, 2, 3]  # Monday, Tuesday, Wednesday
        minutes_per_day = total_minutes / len(days)
    elif request.effort == "medium":
        days = [0, 1, 2, 3, 4]  # Monday to Friday
        minutes_per_day = total_minutes / len(days)
    else:  # high
        days = [0, 1, 2, 3, 4, 6]  # Monday to Friday + Sunday
        minutes_per_day = total_minutes / len(days)

    # Distribute templates across days
    if templates:
        templates_per_day = max(1, len(templates) // len(days))

        for day_index, weekday in enumerate(days):
            day_date = start_date + timedelta(days=weekday)
            minutes_remaining = minutes_per_day

            # Get templates for this day
            day_templates = templates[day_index * templates_per_day:
                                     (day_index + 1) * templates_per_day]

            # If it's the last day, include any remaining templates
            if day_index == len(days) - 1:
                day_templates = templates[day_index * templates_per_day:]

            current_time = day_date

            for template in day_templates:
                if minutes_remaining <= 0:
                    break

                # Get template steps to estimate event duration
                steps = db.query(Step).filter(Step.process_id == template.id).all()

                # Calculate event duration based on template complexity
                event_duration = max(30, min(120, 30 * (len(steps) if steps else 1)))
                if event_duration > minutes_remaining:
                    event_duration = minutes_remaining

                event_end_time = current_time + timedelta(minutes=event_duration)

                # Generate event
                event = SchemaPlanEvent(
                    id=f"plan-event-{uuid.uuid4()}",
                    title=template.title,
                    description=template.description or f"Based on template: {template.title}",
                    processId=str(template.id),
                    startTime=current_time,
                    endTime=event_end_time,
                    effort=request.effort,
                    status=EventStatusEnum.PENDING
                )

                generated_events.append(event)

                # Update remaining time
                minutes_remaining -= event_duration

                # Add 15-minute break between events
                current_time = event_end_time + timedelta(minutes=15)

    # If we don't have enough events, generate generic ones based on goals
    if len(generated_events) < 3:
        # Generate 3-5 events based on goals and description
        goal_keywords = request.goals.split()

        # Use the first few keywords as event themes
        keywords = goal_keywords[:min(5, len(goal_keywords))]

        for i, keyword in enumerate(keywords[:3]):  # Max 3 generic events
            day_index = i % len(days)
            weekday = days[day_index]
            day_date = start_date + timedelta(days=weekday)

            # Set start time at 10 AM + i hours
            event_time = day_date.replace(hour=10 + i)

            # Default 60-minute event
            event = SchemaPlanEvent(
                id=f"plan-event-{uuid.uuid4()}",
                title=f"{keyword.capitalize()} Session",
                description=f"Work on your goal: {request.goals}",
                processId="process-generic",  # Generic process ID
                startTime=event_time,
                endTime=event_time + timedelta(minutes=60),
                effort=request.effort,
                status=EventStatusEnum.PENDING
            )

            generated_events.append(event)

    # Sort events by start time
    generated_events.sort(key=lambda e: e.startTime)

    # Generate a summary
    summary = f"Weekly plan generated with {len(generated_events)} events based on your {request.effort} effort preference with {request.hoursAllocation} hours allocation."

    return SchemaPlanGenerateResponse(
        events=generated_events,
        summary=summary
    )


@router.post("/save", response_model=SchemaPlanSaveResponse)
async def save_plan(
    request: SchemaPlanSaveRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """
    Save a generated plan to the user's calendar.

    Args:
        request: Plan save request with events
        current_user: Authenticated user
        db: Database session

    Returns:
        Information about saved events
    """
    if not request.events:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No events provided to save"
        )

    saved_event_ids = []

    for plan_event in request.events:
        # Create a new event from the plan event
        event = Event(
            id=uuid.uuid4(),  # Generate a new UUID for the actual event
            title=plan_event.title,
            description=plan_event.description,
            start_time=plan_event.startTime,
            end_time=plan_event.endTime,
            status=EventStatusEnum.PENDING,
            created_by_id=current_user.id,
            process_id=plan_event.processId if plan_event.processId != "process-generic" else None,
            event_metadata={
                "effort": plan_event.effort,
                "generated_by_plan": True,
                "plan_event_id": plan_event.id
            }
        )

        db.add(event)
        db.flush()  # Get the ID without committing yet

        # Add the user as a participant
        participant = EventParticipant(
            event_id=event.id,
            user_id=current_user.id,
            role="organizer",
            status="confirmed"
        )
        db.add(participant)

        # If event has a process, create steps if needed
        if event.process_id:
            # Check if the process is a template
            process = db.query(Process).filter(Process.id == event.process_id).first()

            if process and process.is_template:
                # Copy steps from template
                template_steps = db.query(Step).filter(Step.process_id == process.id).all()

                for template_step in template_steps:
                    step = Step(
                        content=template_step.content,
                        completed=False,
                        order=template_step.order,
                        due_date=None,
                        event_id=event.id
                    )
                    db.add(step)
                    db.flush()

                    # Copy substeps if any
                    substeps = db.query(SubStep).filter(SubStep.step_id == template_step.id).all()

                    for substep in substeps:
                        new_substep = SubStep(
                            content=substep.content,
                            completed=False,
                            order=substep.order,
                            step_id=step.id
                        )
                        db.add(new_substep)

        saved_event_ids.append(str(event.id))

    db.commit()

    return SchemaPlanSaveResponse(
        success=True,
        savedEvents=saved_event_ids
    )
