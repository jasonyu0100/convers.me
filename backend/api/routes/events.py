"""Event routes for the API."""

import uuid
from datetime import datetime
from typing import Annotated, Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from api.schemas.events import (
    SchemaEventCreate,
    SchemaEventDetailOut,
    SchemaEventListItem,
    SchemaEventParticipantCreate,
    SchemaEventParticipantOut,
    SchemaEventUpdate,
    SchemaParticipantsGroup,
    SchemaParticipantUser,
    SchemaStepCreate,
    SchemaStepOut,
    SchemaStepUpdate,
    SchemaSubStepCreate,
    SchemaSubStepOut,
    SchemaSubStepUpdate,
)
from api.security import get_current_user
from db.database import get_db
from db.models import Event, EventParticipant, Step, SubStep, Topic, User, event_topics

router = APIRouter(prefix="/events", tags=["events"])
# Health check endpoint


@router.get("/health", include_in_schema=True, response_model=Dict[str, Any])
async def health_check_events():
    """Health check for the events router."""
    from api.utils import check_router_health

    health_data = check_router_health("events")
    return health_data


@router.post("")
async def create_event(event: SchemaEventCreate, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Create a new event."""
    # If template_process_id is provided, create a process instance from the template
    process_id = event.processId

    # Check if we need to create a process instance from a template
    if event.templateProcessId and not process_id:
        from db.models import Process

        # Find the template process
        template_process = db.query(Process).filter(
            Process.id == event.templateProcessId, Process.is_template == True).first()

        if template_process:
            # Create a process instance based on the template
            process_instance = Process(
                title=template_process.title,
                description=template_process.description,
                color=template_process.color,
                category=template_process.category,
                favorite=False,  # Instances aren't favorites by default
                created_by_id=current_user.id,
                directory_id=template_process.directory_id,
                is_template=False,  # This is an instance
                template_id=template_process.id,  # Link to the template
                process_metadata=(template_process.process_metadata.copy(
                ) if template_process.process_metadata else {}),
                last_updated=datetime.utcnow().isoformat(),
            )
            db.add(process_instance)
            db.flush()  # Get ID without committing

            # Copy steps and substeps from template to instance
            if template_process.steps:
                for step_template in sorted(template_process.steps, key=lambda s: s.order if hasattr(s, 'order') else 0):
                    # Create step
                    step = Step(
                        content=step_template.content,
                        completed=False,  # New instances start with uncompleted steps
                        order=step_template.order if hasattr(step_template, 'order') else 0,
                        due_date=step_template.due_date if hasattr(step_template, 'due_date') else None,
                        process_id=process_instance.id,
                    )
                    db.add(step)
                    db.flush()  # Get step ID

                    # Create substeps using a more direct approach
                    try:
                        # Reload the template with substeps properly joined
                        step_with_substeps = db.query(Step).options(
                            joinedload(Step.sub_steps)
                        ).filter(Step.id == step_template.id).first()

                        # Check for substeps - using snake_case for SQLAlchemy model attributes
                        if step_with_substeps and step_with_substeps.sub_steps:
                            try:
                                # Convert to list and sort by order
                                substeps_list = list(step_with_substeps.sub_steps)
                                print(f"Found {len(substeps_list)} substeps for template step {step_template.id}")

                                for i, substep_template in enumerate(sorted(substeps_list, key=lambda ss: getattr(ss, 'order', i))):
                                    # Extract content safely with default
                                    content = getattr(substep_template, 'content', "Subtask")
                                    order = getattr(substep_template, 'order', i+1)

                                    # Create the substep
                                    substep = SubStep(
                                        id=str(uuid.uuid4()),
                                        content=content,
                                        completed=False,  # Always start uncompleted
                                        order=order,
                                        step_id=step.id,
                                    )
                                    db.add(substep)
                                    print(f"Created substep: {content[:30]}...")
                            except Exception as e:
                                print(f"Error processing substeps list for step template {step_template.id}: {e}")
                        else:
                            # If no substeps found, see if we should generate default ones
                            from api.lib.events.helpers import generate_substeps_for_step, should_have_substeps

                            if should_have_substeps(step.content):
                                print(f"Generating default substeps for step {step.id}")
                                substep_contents = generate_substeps_for_step(step.content)

                                # Create default substeps
                                for i, content in enumerate(substep_contents):
                                    substep = SubStep(
                                        id=str(uuid.uuid4()),
                                        content=content,
                                        completed=False,
                                        order=i + 1,
                                        step_id=step.id,
                                    )
                                    db.add(substep)
                                    print(f"Created default substep: {content[:30]}...")
                    except Exception as e:
                        print(f"Error creating substeps for step template {step_template.id}: {e}")

            # Set process_id to the new instance
            process_id = process_instance.id

    # Create the event
    new_event = Event(
        title=event.title,
        description=event.description,
        start_time=event.startTime,
        end_time=event.endTime,
        # Keep legacy fields for backwards compatibility
        date=event.date,
        time=event.time,
        duration=event.duration,
        status=event.status,
        complexity=event.complexity,
        color=event.color,
        location=event.location,
        # Removed is_recurring field - recurring events are no longer supported
        created_by_id=current_user.id,
        process_id=process_id,
        event_metadata=event.eventMetadata or {},
    )

    # If we used a template, store that information in the metadata
    if event.templateProcessId:
        if not new_event.event_metadata:
            new_event.event_metadata = {}
        new_event.event_metadata["template_process_id"] = str(
            event.templateProcessId)

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    # Add the creator as a participant
    participant = EventParticipant(
        event_id=new_event.id, user_id=current_user.id, role="organizer", status="confirmed")
    db.add(participant)

    # Add topics if provided
    if event.topics:
        for topic_id in event.topics:
            db_topic = db.query(Topic).filter(Topic.id == topic_id).first()
            if db_topic:
                db.execute(event_topics.insert().values(
                    event_id=new_event.id, topic_id=topic_id))

    # Add participants if provided
    if event.participantIds:
        for user_id in event.participantIds:
            # Check if user exists
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                new_participant = EventParticipant(
                    event_id=new_event.id, user_id=user_id, role="participant", status="invited")
                db.add(new_participant)

    db.commit()
    db.refresh(new_event)

    # Format response
    topics = [topic for topic in new_event.topics]
    tags = [topic.name for topic in topics]

    # Create participants group
    participants_list = [
        SchemaParticipantUser(id=str(p.user.id), name=p.user.name, handle=p.user.handle,
                        profileImage=p.user.profile_image)  # Convert UUID to string explicitly
        for p in new_event.participants
        if p.user
    ]

    participants_group = SchemaParticipantsGroup(
        name="Participants",
        count=len(
            # Limit to avoid large response
            participants_list
        ),
        avatars=participants_list[:5],
    )

    return SchemaEventDetailOut(
        **new_event.__dict__,
        topics=topics,
        tags=tags,
        participants=new_event.participants,
        participantsGroup=participants_group,
        steps=[],
    )


@router.get("/calendar", response_model=List[Dict[str, Any]])  # Moved up before the /{event_id} route
async def get_calendar_events(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    start_date: str = Query(...,
                            description="Start date in ISO format (YYYY-MM-DD)"),
    end_date: str = Query(...,
                          description="End date in ISO format (YYYY-MM-DD)"),
):
    """
    Get events for calendar view.
    Returns events within a specific date range with participant and topic information.

    OPTIMIZATION: This endpoint is optimized to return only essential data needed for
    calendar display. For detailed event information, use the individual event endpoint.
    """
    # Use the calendar helper from lib
    from api.lib.events.calendar import get_calendar_events as get_events

    return get_events(db, current_user, start_date, end_date)


@router.get("/calendar/debug", response_model=Dict[str, Any])
async def debug_calendar_events(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    start_date: str = Query(...,
                            description="Start date in ISO format (YYYY-MM-DD)"),
    end_date: str = Query(...,
                          description="End date in ISO format (YYYY-MM-DD)"),
):
    """
    Debug endpoint for calendar events.
    Returns detailed information about events and query parameters.
    """
    # Get all events in the date range (regardless of user)
    # Create date objects for comparison
    from datetime import datetime
    start_date_obj = datetime.fromisoformat(start_date).replace(hour=0, minute=0, second=0, microsecond=0)
    end_date_obj = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, microsecond=999999)

    # Count all events in range - check both start_time and legacy date field
    all_events_in_range = db.query(Event).filter(
        or_(
            and_(Event.start_time >= start_date_obj, Event.start_time <= end_date_obj),  # Using start_time
            and_(Event.date >= start_date, Event.date <= end_date)  # Legacy fallback
        )
    ).count()

    # Use the is_guest property from the User model
    is_guest = current_user.is_guest

    # Count events where user is creator
    user_created_events = db.query(Event).filter(
        Event.created_by_id == current_user.id,
        or_(
            and_(Event.start_time >= start_date_obj, Event.start_time <= end_date_obj),  # Using start_time
            and_(Event.date >= start_date, Event.date <= end_date)  # Legacy fallback
        )
    ).count()

    # Count events where user is participant
    user_participant_events = (
        db.query(Event)
        .join(EventParticipant, Event.id == EventParticipant.event_id)
        .filter(
            EventParticipant.user_id == current_user.id,
            or_(
                and_(Event.start_time >= start_date_obj, Event.start_time <= end_date_obj),  # Using start_time
                and_(Event.date >= start_date, Event.date <= end_date)  # Legacy fallback
            )
        )
        .count()
    )

    # Count events with any status
    status_counts = {}
    # Map frontend status names to actual EventStatusEnum values
    status_mapping = {
        "pending": "PENDING",
        "ongoing": "EXECUTION",
        "upcoming": "PLANNING",
        "completed": "DONE",
        "recurring": "ADMINISTRATIVE"  # Best match for recurring in the enum
    }

    for frontend_status, enum_status in status_mapping.items():
        if is_guest:
            # For guest users, count all events in the date range
            count = db.query(Event).filter(
                Event.status == enum_status,
                or_(
                    and_(Event.start_time >= start_date_obj, Event.start_time <= end_date_obj),  # Using start_time
                    and_(Event.date >= start_date, Event.date <= end_date)  # Legacy fallback
                )
            ).count()
        else:
            # For regular users, only count events they created or participate in
            count = (
                db.query(Event)
                .filter(
                    or_(
                        Event.created_by_id == current_user.id,
                        Event.id.in_(db.query(EventParticipant.event_id).filter(
                            EventParticipant.user_id == current_user.id).subquery()),
                    ),
                    Event.status == enum_status,
                    or_(
                        and_(Event.start_time >= start_date_obj, Event.start_time <= end_date_obj),  # Using start_time
                        and_(Event.date >= start_date, Event.date <= end_date)  # Legacy fallback
                    ),
                )
                .count()
            )
        status_counts[frontend_status] = count

    # Get the actual events - for guest users, show all events in the date range
    if is_guest:
        user_events = db.query(Event).distinct().filter(
            or_(
                and_(Event.start_time >= start_date_obj, Event.start_time <= end_date_obj),  # Using start_time
                and_(Event.date >= start_date, Event.date <= end_date)  # Legacy fallback
            )
        ).all()
    else:
        # For regular users, only show events they created or participate in
        user_events = (
            db.query(Event)
            .distinct()
            .outerjoin(EventParticipant, Event.id == EventParticipant.event_id)
            .filter(
                or_(Event.created_by_id == current_user.id,
                    EventParticipant.user_id == current_user.id),
                or_(
                    and_(Event.start_time >= start_date_obj, Event.start_time <= end_date_obj),  # Using start_time
                    and_(Event.date >= start_date, Event.date <= end_date)  # Legacy fallback
                ),
            )
            .all()
        )

    # Format event summaries
    event_summaries = []
    for event in user_events[:10]:  # Limit to first 10 for brevity
        event_summaries.append(
            {
                "id": str(event.id),
                "title": event.title,
                "start_time": event.start_time.isoformat() if event.start_time else None,
                "end_time": event.end_time.isoformat() if event.end_time else None,
                "date": event.date,  # Keep for backwards compatibility
                "time": event.time,  # Keep for backwards compatibility
                "status": event.status,
                "created_by": str(event.created_by_id),
                "is_user_creator": event.created_by_id == current_user.id,
            }
        )

    result = {
        "user_id": str(current_user.id),
        "user_handle": current_user.handle,
        "user_metadata": current_user.user_metadata,
        "is_guest": current_user.is_guest,
        "guest_role": current_user.guest_role,
        "date_range": {"start_date": start_date, "end_date": end_date},
        "counts": {
            "all_events_in_range": all_events_in_range,
            "user_created_events": user_created_events,
            "user_participant_events": user_participant_events,
            "total_user_events": len(user_events),
            "by_status": status_counts,
        },
        "event_samples": event_summaries,
    }

    return result


@router.get("", response_model=List[SchemaEventListItem])
async def get_events(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    process_id: Optional[str] = None,
    # Added to find events with processes that use this template
    template_process_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
):
    """Get events with optional filtering."""
    query = db.query(Event).options(
        joinedload(Event.topics),
        joinedload(Event.participants),
        # Add eager loading for the process relationship
        joinedload(Event.process),
    )

    # Apply filters
    if process_id:
        query = query.filter(Event.process_id == process_id)

    # If template_process_id is provided, join with Process table and filter
    if template_process_id:
        from db.models import Process

        query = query.join(Process, Event.process_id == Process.id)
        query = query.filter(Process.template_id == template_process_id)

    if status:
        query = query.filter(Event.status == status)

    # Apply date filters if provided
    if start_date and end_date:
        # Convert to datetime objects for start_time/end_time comparison
        from datetime import datetime
        start_date_obj = datetime.fromisoformat(start_date).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date_obj = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, microsecond=999999)

        # Filter using both new fields and legacy fields for backwards compatibility
        query = query.filter(
            or_(
                and_(Event.start_time >= start_date_obj, Event.start_time <= end_date_obj),  # Using start_time
                and_(Event.date >= start_date, Event.date <= end_date)  # Legacy fallback
            )
        )
    elif start_date:
        # Filter events after start date
        start_date_obj = datetime.fromisoformat(start_date).replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(
            or_(
                Event.start_time >= start_date_obj,  # Using start_time
                Event.date >= start_date  # Legacy fallback
            )
        )
    elif end_date:
        # Filter events before end date
        end_date_obj = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, microsecond=999999)
        query = query.filter(
            or_(
                Event.start_time <= end_date_obj,  # Using start_time
                Event.date <= end_date  # Legacy fallback
            )
        )

    # Order by start_time or date (soonest first) with handling for NULL values
    # Use NULLS LAST to handle NULL start_time values
    from sqlalchemy import nullslast

    query = query.order_by(nullslast(Event.start_time), Event.date, Event.time)

    events = query.offset(skip).limit(limit).all()

    # Format for the list view
    result = []
    for event in events:
        topic_names = [topic.name for topic in event.topics]
        participant_count = len(
            event.participants) if event.participants else 0

        # For all requests, including template_process_id, use standard EventListItem
        # Create datetime objects for events with missing start_time or end_time
        # For events with missing start_time, create from date+time fields if available
        event_start_time = event.start_time
        event_end_time = event.end_time

        if not event_start_time and event.date:
            try:
                from datetime import datetime

                # Try to construct start_time from date and time if possible
                date_str = event.date
                time_str = event.time or "00:00"
                event_start_time = datetime.fromisoformat(f"{date_str}T{time_str}:00")

                # If we created start_time but no end_time, create end_time based on duration
                if not event_end_time and event_start_time:
                    duration_minutes = 60  # Default
                    if event.duration:
                        if event.duration == "30min":
                            duration_minutes = 30
                        elif event.duration == "45min":
                            duration_minutes = 45
                        elif event.duration == "60min" or event.duration == "1h":
                            duration_minutes = 60
                        elif event.duration == "90min":
                            duration_minutes = 90
                        elif event.duration == "120min" or event.duration == "2h":
                            duration_minutes = 120

                    from datetime import timedelta
                    event_end_time = event_start_time + timedelta(minutes=duration_minutes)
            except Exception as e:
                # Log the error but continue processing - we'll return what we have
                print(f"Error creating datetime for event {event.id}: {e}")

        result.append(
            SchemaEventListItem(
                id=str(event.id),
                title=event.title,
                startTime=event_start_time,
                endTime=event_end_time,
                date=event.date,  # Keep for backwards compatibility
                time=event.time,  # Keep for backwards compatibility
                color=event.color,
                status=event.status,
                participantCount=participant_count,
                topics=topic_names,
            )
        )

    # Convert to camelCase for the response using process_db_results
    # Use APIBaseModel.process_response for camelCase conversion

    return result


@router.get("/{event_id:uuid}", response_model=SchemaEventDetailOut)
async def get_event(event_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get a specific event by ID with all related information."""
    event = (
        db.query(Event)
        .options(
            joinedload(Event.topics),
            joinedload(Event.participants).joinedload(EventParticipant.user),
            joinedload(Event.steps).joinedload(Step.sub_steps),
        )
        .filter(Event.id == event_id)
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Build the detailed event response
    topics = []
    for topic in event.topics:
        # Use camelCase keys to match SchemaTopicOut
        topic_dict = {
            "id": str(topic.id),
            "name": topic.name,
            "color": topic.color,
            "category": topic.category,
            "createdAt": topic.created_at,  # Changed from snake_case to camelCase
            "updatedAt": topic.updated_at,  # Changed from snake_case to camelCase
            "topicMetadata": topic.topic_metadata if hasattr(topic, 'topic_metadata') else None
        }
        topics.append(topic_dict)

    tags = [topic["name"] for topic in topics]

    # Get steps with substeps properly loaded
    from api.lib.events.steps import get_event_steps

    # Instead of processing steps here, use the specialized function
    steps = get_event_steps(db, str(event_id), current_user)

    # Create participants group
    participants_list = []
    for p in event.participants:
        if p.user:
            participants_list.append(
                SchemaParticipantUser(id=str(p.user.id), name=p.user.name, handle=p.user.handle,
                                profileImage=p.user.profile_image)  # Ensure ID is a string
            )

    participants_group = SchemaParticipantsGroup(
        name="Participants",
        count=len(
            # Limit to avoid large response
            participants_list
        ),
        avatars=participants_list[:5],
    )

    # Get related events if any
    related_events = []
    if event.event_metadata and "related_events" in event.event_metadata:
        related_event_ids = event.event_metadata["related_events"]
        if related_event_ids:
            # Fetch related events
            related_events_data = db.query(Event).filter(
                Event.id.in_(related_event_ids)).all()

            for related_event in related_events_data:
                related_events.append(
                    {
                        "id": str(related_event.id),
                        "title": related_event.title,
                        "start_time": related_event.start_time.isoformat() if related_event.start_time else None,
                        "end_time": related_event.end_time.isoformat() if related_event.end_time else None,
                        "date": related_event.date,  # Keep for backwards compatibility
                        "color": related_event.color,
                    }
                )

    # Process event into dictionary with string IDs using camelCase for schema compatibility
    event_dict = {
        "id": str(event.id),
        "title": event.title,
        "description": event.description,
        "startTime": event.start_time,
        "endTime": event.end_time,
        # Keep legacy fields for backwards compatibility
        "date": event.date,
        "time": event.time,
        "duration": event.duration,
        "status": event.status.value if event.status else None,
        "complexity": event.complexity,
        "color": event.color,
        "location": event.location,
        # is_recurring field has been removed from the database model
        "recordingUrl": event.recording_url,
        "eventMetadata": event.event_metadata,
        "createdById": str(event.created_by_id) if event.created_by_id else None,
        "processId": str(event.process_id) if event.process_id else None,
        "createdAt": event.created_at,
        "updatedAt": event.updated_at,
        "topics": topics,
        "tags": tags,
        "steps": steps,
        "participantsGroup": participants_group,
        "relatedEvents": related_events,
    }

    # Convert participants to proper format with string IDs using camelCase for schema compatibility
    formatted_participants = []
    for p in event.participants:
        user_data = None
        if p.user:
            user_data = {
                "id": str(p.user.id),
                "name": p.user.name,
                "handle": p.user.handle,
                "profileImage": p.user.profile_image,
            }

        formatted_participants.append(
            {
                "eventId": str(p.event_id),
                "userId": str(p.user_id),
                "role": p.role,
                "status": p.status.value if p.status else None,
                "joinedAt": p.joined_at,
                "user": user_data,
            }
        )

    event_dict["participants"] = formatted_participants

    return SchemaEventDetailOut(**event_dict)


# These helper functions are imported but not used - we'll comment them out
# from api.lib.events.helpers import generate_substeps_for_step as _generate_substeps_for_step
# from api.lib.events.helpers import should_have_substeps as _should_have_substeps


@router.put("/{event_id:uuid}", response_model=SchemaEventDetailOut)
async def update_event(
    event_id: UUID,
    event_update: SchemaEventUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update an event."""
    # Try to avoid loading status_logs if table doesn't exist
    db_event = (
        db.query(Event)
        .options(
            joinedload(Event.topics),
            joinedload(Event.participants).joinedload(EventParticipant.user),
            joinedload(Event.steps).joinedload(Step.sub_steps),
        )
        .filter(Event.id == event_id)
        .first()
    )

    if not db_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Check if the user is the creator or has permission
    if db_event.created_by_id != current_user.id:
        # Check if they're a participant with the right role
        participant = (
            db.query(EventParticipant)
            .filter(
                EventParticipant.event_id == event_id,
                EventParticipant.user_id == current_user.id,
                EventParticipant.role == "organizer",
            )
            .first()
        )

        if not participant:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="You don't have permission to update this event")

    # Track changes to notify participants
    significant_changes = {}

    # Fields we consider significant enough to notify participants about
    significant_fields = ["title", "date",
                          "time", "duration", "location", "status"]

    for field in significant_fields:
        if field in event_update.model_dump(exclude_unset=True):
            new_value = getattr(event_update, field)
            old_value = getattr(db_event, field)
            if new_value != old_value:
                significant_changes[field] = {
                    "old": old_value, "new": new_value}

    # Handle metadata field separately due to alias
    update_data = event_update.model_dump(exclude_unset=True)
    if "metadata" in update_data:
        update_data["event_metadata"] = update_data.pop("metadata")

    # Update topics if provided
    if "topics" in update_data:
        topic_ids = update_data.pop("topics")

        # Remove existing topic associations
        db.execute(event_topics.delete().where(
            event_topics.c.event_id == event_id))

        # Add new topic associations
        for topic_id in topic_ids:
            db.execute(event_topics.insert().values(
                event_id=event_id, topic_id=topic_id))

    # Check if status is changing and log it if possible
    if "status" in update_data:
        new_status = update_data["status"]
        old_status = db_event.status

        if new_status != old_status:
            try:
                # Create a status log entry if the table exists
                from db.models import StatusLog

                # Try to create a status log
                status_log = StatusLog(
                    previous_status=old_status, new_status=new_status, event_id=event_id, user_id=current_user.id)
                db.add(status_log)
            except Exception:
                # If the status_log table doesn't exist, skip it
                pass

    # Update the event fields
    for key, value in update_data.items():
        setattr(db_event, key, value)

    db.commit()
    db.refresh(db_event)

    # If there were significant changes, notify participants
    if significant_changes:
        # Import here to avoid circular imports
        from tasks.event_tasks import notify_event_updates

        # Trigger background task to notify participants
        notify_event_updates.delay(event_id=str(event_id), updated_by_id=str(
            current_user.id), changes=significant_changes)

    # Build the detailed event response
    topics = [topic for topic in db_event.topics]
    tags = [topic.name for topic in topics]

    steps = []
    if db_event.steps:
        for step in sorted(db_event.steps, key=lambda s: s.order):
            sub_steps = []
            if step.sub_steps:
                sub_steps = sorted(step.sub_steps, key=lambda ss: ss.order)

            steps.append(
                SchemaStepOut(
                    id=str(step.id),
                    content=step.content,
                    completed=step.completed,
                    order=step.order,
                    dueDate=step.due_date,
                    eventId=str(step.event_id) if step.event_id else None,
                    processId=str(step.process_id) if step.process_id else None,
                    createdAt=step.created_at,
                    updatedAt=step.updated_at,
                    subSteps=sub_steps,
                )
            )

    # Create participants group
    participants_list = [
        SchemaParticipantUser(id=str(p.user.id), name=p.user.name, handle=p.user.handle,
                        profileImage=p.user.profile_image)  # Convert UUID to string explicitly
        for p in db_event.participants
        if p.user
    ]

    participants_group = SchemaParticipantsGroup(
        name="Participants",
        count=len(
            # Limit to avoid large response
            participants_list
        ),
        avatars=participants_list[:5],
    )

    # Check if status_logs is available
    status_logs = []
    try:
        status_logs = db_event.status_logs if hasattr(
            db_event, "status_logs") else []
    except Exception:
        # If status_logs isn't accessible, ignore it
        pass

    return SchemaEventDetailOut(
        **db_event.__dict__,
        topics=topics,
        tags=tags,
        steps=steps,
        participants=db_event.participants,
        participantsGroup=participants_group,
        statusLogs=status_logs,
    )


@router.delete("/{event_id:uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(event_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Delete an event."""
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Check if the user is the creator
    if db_event.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only the creator can delete this event")

    # Delete all related records first to avoid foreign key issues
    db.query(EventParticipant).filter(
        EventParticipant.event_id == event_id).delete()

    # Delete steps and substeps
    for step in db_event.steps:
        # Delete substeps
        db.query(SubStep).filter(SubStep.step_id == step.id).delete()

    # Now delete steps
    db.query(Step).filter(Step.event_id == event_id).delete()

    # Delete event topic associations
    db.execute(event_topics.delete().where(
        event_topics.c.event_id == event_id))

    # Finally delete the event
    db.delete(db_event)
    db.commit()

    return None


@router.post("/{event_id:uuid}/participants", response_model=SchemaEventParticipantOut)
async def add_participant(
    event_id: UUID,
    participant: SchemaEventParticipantCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Add a participant to an event."""
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Check if the user has permission to add participants
    if event.created_by_id != current_user.id:
        # Check if they're a participant with the right role
        is_organizer = (
            db.query(EventParticipant)
            .filter(
                EventParticipant.event_id == event_id,
                EventParticipant.user_id == current_user.id,
                EventParticipant.role == "organizer",
            )
            .first()
        )

        if not is_organizer:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to add participants to this event",
            )

    # Check if the user to be added exists
    user = db.query(User).filter(User.id == participant.userId).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Check if the participant already exists
    existing_participant = db.query(EventParticipant).filter(
        EventParticipant.event_id == event_id, EventParticipant.user_id == participant.userId).first()

    if existing_participant:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Participant already added to this event")

    # Add the new participant
    new_participant = EventParticipant(
        event_id=event_id, user_id=participant.userId, role=participant.role, status=participant.status)
    db.add(new_participant)
    db.commit()
    db.refresh(new_participant)

    # Send invitation notification in the background
    # Import here to avoid circular imports
    from db.models import NotificationTypeEnum
    from tasks.notification_tasks import send_notification

    send_notification.delay(
        user_id=str(participant.userId),
        notification_type=NotificationTypeEnum.EVENT_INVITE.value,
        title=f"New Event Invitation: {event.title}",
        message=f"{current_user.name} invited you to '{event.title}'.",
        link=f"/events/{event_id}",
        sender_id=str(current_user.id),
        reference_id=str(event_id),
        reference_type="event",
    )

    # Include user data in response
    participant_with_user = SchemaEventParticipantOut(
        eventId=new_participant.event_id,
        userId=new_participant.user_id,
        role=new_participant.role,
        status=new_participant.status,
        joinedAt=new_participant.joined_at,
        user=SchemaParticipantUser(id=str(user.id), name=user.name, handle=user.handle,
                             profileImage=user.profile_image),  # Convert UUID to string explicitly
    )

    return participant_with_user


@router.get("/{event_id}/participants", response_model=List[SchemaEventParticipantOut])
async def get_participants(event_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get all participants of an event with user details."""
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    participants = db.query(EventParticipant).options(joinedload(
        EventParticipant.user)).filter(EventParticipant.event_id == event_id).all()

    # Format response with user details
    result = []
    for p in participants:
        user_data = None
        if p.user:
            user_data = SchemaParticipantUser(
                # Convert UUID to string explicitly
                id=str(p.user.id),
                name=p.user.name,
                handle=p.user.handle,
                profileImage=p.user.profile_image,
            )

        result.append(
            SchemaEventParticipantOut(
                eventId=str(p.event_id),
                userId=str(p.user_id),
                role=p.role,
                status=p.status,
                joinedAt=p.joined_at,
                user=user_data,
            )
        )

    # Convert to camelCase for the response using process_db_results
    # Use APIBaseModel.process_response for camelCase conversion

    return result


@router.post("/{event_id}/steps", response_model=SchemaStepOut)
async def create_event_step(
    event_id: UUID,
    step: SchemaStepCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Create a new step for an event."""
    # Use the steps helper from lib
    from api.lib.events.steps import create_event_step as create_step

    return create_step(db, event_id, step, current_user)


@router.put("/{event_id}/steps/{step_id}", response_model=SchemaStepOut)
async def update_event_step(
    event_id: str,
    step_id: str,
    step_update: SchemaStepUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update a step for an event."""
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Check if the step exists and belongs to the event
    step = db.query(Step).filter(Step.id == step_id,
                                 Step.event_id == event_id).first()

    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Step not found or does not belong to this event")

    # Check permissions - more permissive to allow any participant to update steps
    if event.created_by_id != current_user.id:
        # Check if they're a participant (any role)
        is_participant = (
            db.query(EventParticipant)
            .filter(
                EventParticipant.event_id == event_id,
                EventParticipant.user_id == current_user.id,
            )
            .first()
        )

        if not is_participant:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="You don't have permission to update steps for this event")

    # Update the step
    for key, value in step_update.model_dump(exclude_unset=True).items():
        setattr(step, key, value)

    # Set the completed_at timestamp if completed status is being updated to True
    if "completed" in step_update.model_dump(exclude_unset=True) and step_update.completed:
        from datetime import datetime

        step.completed_at = datetime.utcnow()
    # Clear the completed_at timestamp if step is being marked as incomplete
    elif "completed" in step_update.model_dump(exclude_unset=True) and not step_update.completed:
        step.completed_at = None

    db.commit()
    db.refresh(step)

    return SchemaStepOut(
        id=str(step.id),
        content=step.content,
        completed=step.completed,
        order=step.order,
        dueDate=step.due_date,
        eventId=str(step.event_id),
        processId=None,
        createdAt=step.created_at,
        updatedAt=step.updated_at,
        completedAt=step.completed_at,
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
            for ss in step.sub_steps
        ],
    )


@router.delete("/{event_id}/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event_step(event_id: str, step_id: str, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Delete a step from an event."""
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Check if the step exists and belongs to the event
    step = db.query(Step).filter(Step.id == step_id,
                                 Step.event_id == event_id).first()

    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Step not found or does not belong to this event")

    # Check permissions
    if event.created_by_id != current_user.id:
        # Check if they're a participant with the right role
        is_authorized = (
            db.query(EventParticipant)
            .filter(
                EventParticipant.event_id == event_id,
                EventParticipant.user_id == current_user.id,
                EventParticipant.role.in_(["organizer", "editor"]),
            )
            .first()
        )

        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete steps from this event",
            )

    # Delete all substeps first
    db.query(SubStep).filter(SubStep.step_id == step_id).delete()

    # Delete the step
    db.delete(step)
    db.commit()

    return None


@router.post("/{event_id}/steps/{step_id}/sub-steps", response_model=SchemaSubStepOut)
async def create_sub_step(
    event_id: str,
    step_id: str,
    sub_step: SchemaSubStepCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Create a new sub-step for a step."""
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Check if the step exists and belongs to the event
    step = db.query(Step).filter(Step.id == step_id,
                                 Step.event_id == event_id).first()

    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Step not found or does not belong to this event")

    # Check permissions
    if event.created_by_id != current_user.id:
        # Check if they're a participant with the right role
        is_authorized = (
            db.query(EventParticipant)
            .filter(
                EventParticipant.event_id == event_id,
                EventParticipant.user_id == current_user.id,
                EventParticipant.role.in_(["organizer", "editor"]),
            )
            .first()
        )

        if not is_authorized:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="You don't have permission to add sub-steps to this event")

    # Create the sub-step
    new_sub_step = SubStep(content=sub_step.content,
                           completed=sub_step.completed, order=sub_step.order, step_id=step_id)
    db.add(new_sub_step)
    db.commit()
    db.refresh(new_sub_step)

    return SchemaSubStepOut(
        id=str(new_sub_step.id),
        content=new_sub_step.content,
        completed=new_sub_step.completed,
        order=new_sub_step.order,
        stepId=str(new_sub_step.step_id),
        createdAt=new_sub_step.created_at,
        updatedAt=new_sub_step.updated_at,
        completedAt=new_sub_step.completed_at,
    )


@router.put("/{event_id}/steps/{step_id}/sub-steps/{sub_step_id}", response_model=SchemaSubStepOut)
async def update_sub_step(
    event_id: str,
    step_id: str,
    sub_step_id: str,
    sub_step_update: SchemaSubStepUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update a sub-step."""
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Check if the step exists and belongs to the event
    step = db.query(Step).filter(Step.id == step_id,
                                 Step.event_id == event_id).first()

    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Step not found or does not belong to this event")

    # Check if the sub-step exists and belongs to the step
    sub_step = db.query(SubStep).filter(
        SubStep.id == sub_step_id, SubStep.step_id == step_id).first()

    if not sub_step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Sub-step not found or does not belong to this step")

    # Check permissions
    if event.created_by_id != current_user.id:
        # Check if they're a participant with the right role
        is_authorized = (
            db.query(EventParticipant)
            .filter(
                EventParticipant.event_id == event_id,
                EventParticipant.user_id == current_user.id,
                EventParticipant.role.in_(["organizer", "editor"]),
            )
            .first()
        )

        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update sub-steps for this event",
            )

    # Update the sub-step
    for key, value in sub_step_update.model_dump(exclude_unset=True).items():
        setattr(sub_step, key, value)

    # Set the completed_at timestamp if completed status is being updated to True
    if "completed" in sub_step_update.model_dump(exclude_unset=True) and sub_step_update.completed:
        from datetime import datetime

        sub_step.completed_at = datetime.utcnow()
    # Clear the completed_at timestamp if substep is being marked as incomplete
    elif "completed" in sub_step_update.model_dump(exclude_unset=True) and not sub_step_update.completed:
        sub_step.completed_at = None

    db.commit()
    db.refresh(sub_step)

    return SchemaSubStepOut(
        id=str(sub_step.id),
        content=sub_step.content,
        completed=sub_step.completed,
        order=sub_step.order,
        stepId=str(sub_step.step_id),
        createdAt=sub_step.created_at,
        updatedAt=sub_step.updated_at,
        completedAt=sub_step.completed_at,
    )


@router.post("/{event_id}/batch/substeps/update", response_model=List[SchemaSubStepOut])
async def batch_update_event_substeps(
    event_id: str,
    substep_updates: List[Dict[str, Any]],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """
    Batch update multiple substeps for an event at once.
    Each update should contain: id, step_id, completed (and any other fields to update)
    """
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Check permissions
    if event.created_by_id != current_user.id:
        # Check if they're a participant with the right role
        is_authorized = (
            db.query(EventParticipant)
            .filter(
                EventParticipant.event_id == event_id,
                EventParticipant.user_id == current_user.id,
                EventParticipant.role.in_(["organizer", "editor"]),
            )
            .first()
        )

        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update sub-steps for this event",
            )

    updated_substeps = []

    for update in substep_updates:
        substep_id = update.get("id")
        step_id = update.get("step_id")

        if not substep_id or not step_id:
            continue

        # Verify the step belongs to this event
        step = db.query(Step).filter(Step.id == step_id,
                                     Step.event_id == event_id).first()
        if not step:
            continue

        # Find the substep
        substep = db.query(SubStep).filter(
            SubStep.id == substep_id, SubStep.step_id == step_id).first()
        if not substep:
            continue

        # Update the fields that are provided
        for key, value in update.items():
            if key not in ["id", "step_id"] and hasattr(substep, key):
                setattr(substep, key, value)

        # Set the completed_at timestamp if completed status is being updated to True
        if "completed" in update and update["completed"]:
            from datetime import datetime

            substep.completed_at = datetime.utcnow()
        # Clear the completed_at timestamp if substep is being marked as incomplete
        elif "completed" in update and not update["completed"]:
            substep.completed_at = None

        updated_substeps.append(substep)

    # Commit the changes
    if updated_substeps:
        db.commit()
        for substep in updated_substeps:
            db.refresh(substep)

    # Return the updated substeps
    return [
        SchemaSubStepOut(
            id=str(substep.id),
            content=substep.content,
            completed=substep.completed,
            order=substep.order,
            stepId=str(substep.step_id),
            createdAt=substep.created_at,
            updatedAt=substep.updated_at,
            completedAt=substep.completed_at,
        )
        for substep in updated_substeps
    ]


@router.delete("/{event_id}/steps/{step_id}/sub-steps/{sub_step_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sub_step(
    event_id: str,
    step_id: str,
    sub_step_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Delete a sub-step."""
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Check if the step exists and belongs to the event
    step = db.query(Step).filter(Step.id == step_id,
                                 Step.event_id == event_id).first()

    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Step not found or does not belong to this event")

    # Check if the sub-step exists and belongs to the step
    sub_step = db.query(SubStep).filter(
        SubStep.id == sub_step_id, SubStep.step_id == step_id).first()

    if not sub_step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Sub-step not found or does not belong to this step")

    # Check permissions
    if event.created_by_id != current_user.id:
        # Check if they're a participant with the right role
        is_authorized = (
            db.query(EventParticipant)
            .filter(
                EventParticipant.event_id == event_id,
                EventParticipant.user_id == current_user.id,
                EventParticipant.role.in_(["organizer", "editor"]),
            )
            .first()
        )

        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete sub-steps from this event",
            )

    # Delete the sub-step
    db.delete(sub_step)
    db.commit()

    return None


@router.get("/me", response_model=List[SchemaEventListItem])
async def get_user_events(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
):
    """Get events created by or where the current user is a participant."""
    query = db.query(Event).options(
        joinedload(Event.topics),
        joinedload(Event.participants),
    )

    # First filter for events where user is creator or participant
    query = query.distinct().outerjoin(
        EventParticipant, Event.id == EventParticipant.event_id
    ).filter(
        or_(
            Event.created_by_id == current_user.id,
            and_(
                EventParticipant.user_id == current_user.id,
                EventParticipant.status != "declined"
            )
        )
    )

    if status:
        query = query.filter(Event.status == status)

    # Apply date filters if provided
    if start_date and end_date:
        # Convert to datetime objects for start_time/end_time comparison
        from datetime import datetime
        start_date_obj = datetime.fromisoformat(start_date).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date_obj = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, microsecond=999999)

        # Filter using both new fields and legacy fields for backwards compatibility
        query = query.filter(
            or_(
                and_(Event.start_time >= start_date_obj, Event.start_time <= end_date_obj),  # Using start_time
                and_(Event.date >= start_date, Event.date <= end_date)  # Legacy fallback
            )
        )
    elif start_date:
        # Filter events after start date
        start_date_obj = datetime.fromisoformat(start_date).replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(
            or_(
                Event.start_time >= start_date_obj,  # Using start_time
                Event.date >= start_date  # Legacy fallback
            )
        )
    elif end_date:
        # Filter events before end date
        end_date_obj = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, microsecond=999999)
        query = query.filter(
            or_(
                Event.start_time <= end_date_obj,  # Using start_time
                Event.date <= end_date  # Legacy fallback
            )
        )

    # Order by start_time (soonest first)
    query = query.order_by(Event.start_time, Event.date, Event.time)

    events = query.offset(skip).limit(limit).all()

    # Format for the list view
    result = []
    for event in events:
        topic_names = [topic.name for topic in event.topics]
        participant_count = len(event.participants) if event.participants else 0

        # Create datetime objects for events with missing start_time or end_time
        event_start_time = event.start_time
        event_end_time = event.end_time

        if not event_start_time and event.date:
            try:
                # Try to construct start_time from date and time if possible
                date_str = event.date
                time_str = event.time or "00:00"
                event_start_time = datetime.fromisoformat(f"{date_str}T{time_str}:00")

                # If we created start_time but no end_time, create end_time based on duration
                if not event_end_time and event_start_time:
                    duration_minutes = 60  # Default
                    if event.duration:
                        if event.duration == "30min":
                            duration_minutes = 30
                        elif event.duration == "45min":
                            duration_minutes = 45
                        elif event.duration == "60min" or event.duration == "1h":
                            duration_minutes = 60
                        elif event.duration == "90min":
                            duration_minutes = 90
                        elif event.duration == "120min" or event.duration == "2h":
                            duration_minutes = 120

                    from datetime import timedelta
                    event_end_time = event_start_time + timedelta(minutes=duration_minutes)
            except Exception as e:
                print(f"Error creating datetime for event {event.id}: {e}")

        result.append(
            SchemaEventListItem(
                id=str(event.id),
                title=event.title,
                startTime=event_start_time,
                endTime=event_end_time,
                date=event.date,  # Keep for backwards compatibility
                time=event.time,  # Keep for backwards compatibility
                color=event.color,
                status=event.status,
                participantCount=participant_count,
                topics=topic_names,
            )
        )

    return result

@router.get("/{event_id}/steps", response_model=List[SchemaStepOut])
async def get_event_steps(
    event_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    generate_missing: bool = Query(False, description="Generate example substeps if none exist")
):
    """Get all steps for an event.

    Args:
        event_id: The event ID to get steps for
        current_user: The authenticated user
        db: Database session
        generate_missing: If True, will call service to generate missing substeps

    Returns:
        List of steps with their substeps
    """
    # Use the steps helper from lib
    from api.lib.events.steps import get_event_steps as get_steps

    # If generate_missing is requested, call the service layer to handle it
    if generate_missing:
        # Import the process service for generating missing substeps
        from services.process.process_service import ProcessService

        # Generate missing substeps for the event
        ProcessService.generate_missing_substeps_for_event(db, event_id)

    # Get steps with substeps
    return get_steps(db, event_id, current_user)
