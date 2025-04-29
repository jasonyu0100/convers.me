"""Live session routes for the API."""

import logging
from datetime import datetime
from typing import Annotated, Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from api.lib.live.ai_service import live_ai_service
from api.lib.live.utils import verify_event_access, verify_process_ownership, verify_template_ownership
from api.schemas.live import (
    SchemaLiveContextCreate,
    SchemaLiveContextOut,
    SchemaLiveContextUpdate,
    SchemaLiveMessage,
    SchemaLiveOperation,
    SchemaLiveProcessContext,
    SchemaLiveResponse,
)
from api.security import get_current_user
from api.utils import check_router_health
from db.database import get_db
from db.models import Event, LiveContext, Process, Step, SubStep, User, UserPreferences

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/live", tags=["live"])


@router.get("/health", include_in_schema=True, response_model=Dict[str, Any])
async def health_check_live():
    """Health check for the live router."""
    return check_router_health("live")


@router.post("/contexts", response_model=SchemaLiveContextOut)
async def create_live_context(
    context: SchemaLiveContextCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Create a new live context for the current user."""
    # Validate process, event, or template IDs if provided
    if context.processId:
        verify_process_ownership(db, context.processId, current_user.id)

    if context.eventId:
        verify_event_access(db, context.eventId, current_user.id)

    if context.templateId:
        verify_template_ownership(db, context.templateId, current_user.id)

    # Create a new live context
    new_context = LiveContext(
        user_id=current_user.id,
        process_id=context.processId if context.processId else None,
        event_id=context.eventId if context.eventId else None,
        template_id=context.templateId if context.templateId else None,
        messages=context.messages,
        live_context_metadata=context.metadata,
    )

    # Add system message if not present
    if not any(msg.get("role") == "system" for msg in new_context.messages):
        system_message = {
            "role": "system",
            "content": live_ai_service.get_system_prompt(),
            "timestamp": datetime.utcnow().isoformat(),
        }
        new_context.messages = [system_message] + new_context.messages

    db.add(new_context)
    db.commit()
    db.refresh(new_context)

    return new_context.to_dict()


@router.get("/contexts/{context_id}", response_model=SchemaLiveContextOut)
async def get_live_context(
    context_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Get a specific live context by ID."""
    context = db.query(LiveContext).filter(
        LiveContext.id == context_id,
        LiveContext.user_id == current_user.id
    ).first()

    if not context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Live context not found",
        )

    return context.to_dict()


@router.put("/contexts/{context_id}", response_model=SchemaLiveContextOut)
async def update_live_context(
    context_id: UUID,
    update: SchemaLiveContextUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update a specific live context."""
    context = db.query(LiveContext).filter(
        LiveContext.id == context_id,
        LiveContext.user_id == current_user.id
    ).first()

    if not context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Live context not found",
        )

    # Update the fields if provided
    if update.processId is not None:
        if update.processId:  # Not empty string
            verify_process_ownership(db, update.processId, current_user.id)
            context.process_id = update.processId
        else:
            context.process_id = None

    if update.eventId is not None:
        if update.eventId:  # Not empty string
            verify_event_access(db, update.eventId, current_user.id)
            context.event_id = update.eventId
        else:
            context.event_id = None

    if update.templateId is not None:
        if update.templateId:  # Not empty string
            verify_template_ownership(db, update.templateId, current_user.id)
            context.template_id = update.templateId
        else:
            context.template_id = None

    if update.messages is not None:
        context.messages = update.messages

    if update.metadata is not None:
        context.live_context_metadata = update.metadata

    db.commit()
    db.refresh(context)

    return context.to_dict()


@router.delete("/contexts/{context_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_live_context(
    context_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Delete a specific live context."""
    context = db.query(LiveContext).filter(
        LiveContext.id == context_id,
        LiveContext.user_id == current_user.id
    ).first()

    if not context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Live context not found",
        )

    db.delete(context)
    db.commit()

    return None


@router.get("/contexts", response_model=List[SchemaLiveContextOut])
async def get_user_live_contexts(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    process_id: Optional[UUID] = None,
    event_id: Optional[UUID] = None,
    template_id: Optional[UUID] = None,
    limit: int = 10,
):
    """Get all live contexts for the current user, with optional filtering."""
    query = db.query(LiveContext).filter(LiveContext.user_id == current_user.id)

    if process_id:
        query = query.filter(LiveContext.process_id == process_id)

    if event_id:
        query = query.filter(LiveContext.event_id == event_id)

    if template_id:
        query = query.filter(LiveContext.template_id == template_id)

    # Get the most recent contexts
    contexts = query.order_by(LiveContext.created_at.desc()).limit(limit).all()

    return [context.to_dict() for context in contexts]


@router.post("/message", response_model=SchemaLiveResponse)
async def process_live_message(
    message: SchemaLiveMessage,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Process a live message and generate a response using OpenAI."""
    try:
        # Get or create the context
        context = None

        if message.contextId:
            # Get existing context
            context = db.query(LiveContext).filter(
                LiveContext.id == message.contextId,
                LiveContext.user_id == current_user.id
            ).first()

            if not context:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Live context not found",
                )
        else:
            # Create a new context if none provided
            default_system_message = {
                "role": "system",
                "content": live_ai_service.get_system_prompt(),
                "timestamp": datetime.utcnow().isoformat(),
            }

            context = LiveContext(
                user_id=current_user.id,
                process_id=message.processId,
                event_id=message.eventId,
                messages=[default_system_message],
                live_context_metadata=message.metadata,
            )
            db.add(context)
            db.commit()
            db.refresh(context)

        # Add user message to the context
        user_message = {
            "role": "user",
            "content": message.message,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if not context.messages:
            context.messages = []

        context.messages.append(user_message)

        # Get process info if available
        process_info = None
        if context.process_id:
            process = db.query(Process).options(
                joinedload(Process.steps).joinedload(Step.sub_steps)
            ).filter(Process.id == context.process_id).first()

            if process:
                # Convert process to dict for AI service
                process_info = process.to_dict()

                # Add steps information
                steps_data = []
                for step in process.steps:
                    step_dict = step.to_dict()

                    # Add substeps if available
                    if step.sub_steps:
                        substeps_data = [substep.to_dict() for substep in step.sub_steps]
                        step_dict["subSteps"] = substeps_data

                    steps_data.append(step_dict)

                process_info["steps"] = steps_data

        # Process message with AI service
        response_text, suggested_operations = await live_ai_service.process_message_async(
            message.message,
            context.messages.copy(),  # Pass a copy to avoid mutation
            process_info
        )

        # Add AI response to context
        ai_response = {
            "role": "assistant",
            "content": response_text,
            "timestamp": datetime.utcnow().isoformat(),
        }

        context.messages.append(ai_response)
        db.commit()

    except Exception as e:
        logger.error(f"Error processing live message: {str(e)}")
        # Return a user-friendly error without exposing internal details
        if isinstance(e, HTTPException):
            # Re-raise HTTP exceptions as they are already properly formatted
            raise
        else:
            # For other exceptions, return a 500 with a friendly message
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while processing your message. Please try again later."
            )

    # Return the response
    return {
        "response": response_text,
        "contextId": str(context.id),
        "suggestedOperations": suggested_operations if suggested_operations else [],
        "processModifications": None,  # No modifications in this simple implementation
        "metadata": context.live_context_metadata or {},
    }


@router.post("/operation", response_model=Dict[str, Any])
async def perform_live_operation(
    operation: SchemaLiveOperation,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Perform an operation on a process, step, or substep."""
    # Verify process exists and user has permission
    process = verify_process_ownership(db, operation.processId, current_user.id)

    result = {"success": True, "details": {}}

    # Handle different operation types
    if operation.operation == "complete_step":
        if not operation.stepId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Step ID is required for complete_step operation",
            )

        # Find the step
        step = db.query(Step).filter(
            Step.id == operation.stepId,
            Step.process_id == process.id
        ).first()

        if not step:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Step not found",
            )

        # Update the step
        step.completed = True
        step.completed_at = datetime.utcnow()

        # Update all substeps to completed as well
        substeps = db.query(SubStep).filter(SubStep.step_id == step.id).all()
        for substep in substeps:
            substep.completed = True
            substep.completed_at = datetime.utcnow()

        db.commit()

        # Include updated substeps in the result
        updated_substeps = []
        for substep in substeps:
            updated_substeps.append({
                "id": str(substep.id),
                "completed": True,
                "completedAt": substep.completed_at.isoformat() if substep.completed_at else None
            })

        result["details"] = {
            "stepId": str(step.id),
            "completed": True,
            "completedAt": step.completed_at.isoformat(),
            "updatedSubsteps": updated_substeps
        }

    elif operation.operation == "add_step":
        if not operation.content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Content is required for add_step operation",
            )

        # Find the highest order value to add the step at the end
        highest_order = db.query(Step).filter(Step.process_id == process.id).order_by(Step.order.desc()).first()
        order = 0 if not highest_order else highest_order.order + 1

        # Create the step
        new_step = Step(
            content=operation.content,
            completed=False,
            order=order,
            process_id=process.id,
        )
        db.add(new_step)
        db.commit()
        db.refresh(new_step)

        result["details"] = new_step.to_dict()

    elif operation.operation == "add_substep":
        if not operation.stepId or not operation.content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Step ID and content are required for add_substep operation",
            )

        # Find the step
        step = db.query(Step).filter(
            Step.id == operation.stepId,
            Step.process_id == process.id
        ).first()

        if not step:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Step not found",
            )

        # Find the highest order value to add the substep at the end
        highest_order = db.query(SubStep).filter(SubStep.step_id == step.id).order_by(SubStep.order.desc()).first()
        order = 0 if not highest_order else highest_order.order + 1

        # Create the substep
        new_substep = SubStep(
            content=operation.content,
            completed=False,
            order=order,
            step_id=step.id,
        )
        db.add(new_substep)
        db.commit()
        db.refresh(new_substep)

        result["details"] = new_substep.to_dict()

    elif operation.operation == "update_step":
        if not operation.stepId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Step ID is required for update_step operation",
            )

        # Find the step
        step = db.query(Step).filter(
            Step.id == operation.stepId,
            Step.process_id == process.id
        ).first()

        if not step:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Step not found",
            )

        # Update the step
        if operation.content is not None:
            step.content = operation.content

        if operation.completed is not None:
            step.completed = operation.completed
            if operation.completed:
                step.completed_at = datetime.utcnow()
            else:
                step.completed_at = None

        if operation.order is not None:
            step.order = operation.order

        db.commit()
        db.refresh(step)

        result["details"] = step.to_dict()

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported operation: {operation.operation}",
        )

    return result


@router.get("/process-context/{process_id}", response_model=SchemaLiveProcessContext)
async def get_process_context(
    process_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Get context information about a process for use in live sessions."""
    # Verify process exists and user has permission
    process = verify_process_ownership(db, process_id, current_user.id)

    # Load the process with all steps and substeps
    process = db.query(Process).options(
        joinedload(Process.steps).joinedload(Step.sub_steps)
    ).filter(Process.id == process_id).first()

    # Get related events
    events = db.query(Event).filter(Event.process_id == process_id).all()
    event_data = [event.to_dict() for event in events]

    # Get recent messages from live contexts related to this process
    contexts = db.query(LiveContext).filter(
        LiveContext.process_id == process_id,
        LiveContext.user_id == current_user.id
    ).order_by(LiveContext.updated_at.desc()).limit(3).all()

    recent_messages = []
    for context in contexts:
        # Filter out system messages
        messages = [msg for msg in context.messages if msg.get("role") != "system"]
        # Get the last 5 messages from each context
        recent_messages.extend(messages[-5:])

    # Get user preferences
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    user_prefs = preferences.to_dict() if preferences else None

    # Structure the response with detailed process information including steps and substeps
    process_data = process.to_dict()

    # Enrich with steps and substeps for better context
    if process.steps:
        steps_data = []
        for step in process.steps:
            step_dict = step.to_dict()

            # Add substeps if available
            if step.sub_steps:
                substeps_data = [substep.to_dict() for substep in step.sub_steps]
                step_dict["subSteps"] = substeps_data

            steps_data.append(step_dict)

        process_data["steps"] = steps_data

    return {
        "process": process_data,
        "relatedEvents": event_data,
        "recentMessages": recent_messages,
        "userPreferences": user_prefs,
    }
