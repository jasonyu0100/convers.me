"""Process routes for the API."""

import logging
from datetime import datetime
from typing import Annotated, Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from api.schemas.processes import SchemaProcessCreate as ProcessCreate
from api.schemas.processes import SchemaProcessDetailOut as ProcessDetailOut
from api.schemas.processes import SchemaProcessOut as ProcessOut
from api.schemas.processes import SchemaProcessStepCreate as StepCreate
from api.schemas.processes import SchemaProcessStepUpdate as StepUpdate
from api.schemas.processes import SchemaProcessSubStepCreate as SubStepCreate
from api.schemas.processes import SchemaProcessSubStepUpdate as SubStepUpdate
from api.schemas.processes import SchemaProcessUpdate as ProcessUpdate
from api.security import get_current_user
from api.utils import check_router_health
from api.utils.auth_utils import verify_process_ownership
from db.database import get_db
from db.models import Process, Step, SubStep, User

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/processes", tags=["processes"])
templates_router = APIRouter(prefix="/templates", tags=["templates"])
live_processes_router = APIRouter(
    prefix="/live-processes", tags=["live-processes"])


@router.get("/health", include_in_schema=True, response_model=Dict[str, Any])
async def health_check_processes():
    """Health check for the processes router."""
    return check_router_health("processes")


@templates_router.get("/health", include_in_schema=True, response_model=Dict[str, Any])
async def health_check_templates():
    """Health check for the templates router."""
    return check_router_health("templates")


@live_processes_router.get("/health", include_in_schema=True, response_model=Dict[str, Any])
async def health_check_live_processes():
    """Health check for the live-processes router."""
    return check_router_health("live-processes")


@templates_router.get("/test", include_in_schema=True, response_model=Dict[str, Any])
async def test_templates():
    """Public test endpoint that returns a sample template structure with steps and substeps."""
    sample_template = {
        "id": "test-template-id",
        "title": "Sample Template",
        "description": "This is a sample template for testing the API",
        "color": "blue",
        "isTemplate": True,
        "steps": [
            {
                "id": "step-1",
                "content": "First Step",
                "completed": False,
                "order": 0,
                "subSteps": [
                    {"id": "substep-1", "content": "First Substep",
                        "completed": False, "order": 0, "stepId": "step-1"},
                    {
                        "id": "substep-2",
                        "content": "Second Substep",
                        "completed": False,
                        "order": 1,
                        "stepId": "step-1",
                    },
                ],
            },
            {"id": "step-2", "content": "Second Step",
                "completed": False, "order": 1, "subSteps": []},
        ],
    }
    return sample_template


@router.post("", response_model=ProcessOut)
async def create_process(process: ProcessCreate, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Create a new process."""
    new_process = Process(
        title=process.title,
        description=process.description,
        color=process.color,
        category=process.category,
        favorite=process.favorite,
        created_by_id=current_user.id,
        is_template=False,
        template_id=None,
        directory_id=process.directoryId,
    )
    db.add(new_process)
    db.commit()
    db.refresh(new_process)

    # Convert to dictionary to ensure proper UUID and metadata conversion
    return new_process.to_dict()


@router.get("", response_model=List[ProcessOut])
async def get_processes(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    favorite: Optional[bool] = None,
    is_template: Optional[bool] = None,
):
    """Get processes with optional filtering."""
    query = db.query(Process)

    # Only return processes created by the current user
    query = query.filter(Process.created_by_id == current_user.id)

    # Filter by category if provided
    if category:
        query = query.filter(Process.category == category)

    # Filter by favorite if provided
    if favorite is not None:
        query = query.filter(Process.favorite == favorite)
        # Only templates can be favorited - add filter to ensure consistency
        if favorite:
            query = query.filter(Process.is_template.is_(True))

    # Filter by template status if provided
    if is_template is not None:
        query = query.filter(Process.is_template == is_template)

    # Add eager loading of steps and substeps
    query = query.options(joinedload(Process.steps).joinedload(Step.sub_steps))

    processes = query.offset(skip).limit(limit).all()

    # Convert each process to a dictionary to ensure proper UUID and MetaData conversion
    return [process.to_dict() for process in processes]

# Template specific routes


@templates_router.get("", response_model=List[ProcessOut])
async def get_templates(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    favorite: Optional[bool] = None,
):
    """Get template processes with optional filtering."""
    query = db.query(Process)

    # Only return templates created by the current user
    query = query.filter(Process.created_by_id == current_user.id)

    # Always filter by template status
    query = query.filter(Process.is_template.is_(True))

    # Filter by category if provided
    if category:
        query = query.filter(Process.category == category)

    # Filter by favorite if provided - this is valid for templates
    if favorite is not None:
        query = query.filter(Process.favorite == favorite)

    # Add eager loading of steps and substeps
    query = query.options(joinedload(Process.steps).joinedload(Step.sub_steps))

    templates = query.offset(skip).limit(limit).all()

    # Convert each template to a dictionary to ensure proper UUID and MetaData conversion
    return [template.to_dict() for template in templates]


@templates_router.post("", response_model=ProcessOut)
async def create_template(process: ProcessCreate, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Create a new template process."""
    # Get directory_id from Pydantic model
    directory_id = None
    if hasattr(process, 'directoryId'):
        directory_id = process.directoryId

    new_template = Process(
        title=process.title,
        description=process.description,
        color=process.color,
        category=process.category,
        favorite=process.favorite,
        created_by_id=current_user.id,
        directory_id=directory_id,
        is_template=True,  # Force template to be true
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)

    return new_template.to_dict()


@templates_router.get("/{template_id:uuid}", response_model=ProcessDetailOut)
async def get_template(template_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get a specific template process by ID."""
    # Include more eager loading with better query
    template = (
        db.query(Process)
        .filter(Process.id == template_id, Process.is_template == True)
        .options(
            joinedload(Process.steps).joinedload(Step.sub_steps),
            joinedload(Process.instances)
        )
        .first()
    )

    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Template process not found")

    # Check if the user is the creator
    if template.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You don't have permission to view this template")

    # Explicitly include steps data
    steps_data = []
    if template.steps:
        sorted_steps = sorted(template.steps, key=lambda s: s.order)

        for step in sorted_steps:
            substeps_data = []
            if step.sub_steps:
                sorted_substeps = sorted(
                    step.sub_steps, key=lambda ss: ss.order)

                for substep in sorted_substeps:
                            # Substeps should have their completed_at set when marked as completed

                    substeps_data.append({
                        "id": str(substep.id),
                        "content": substep.content,
                        "completed": substep.completed,
                        "completedAt": substep.completed_at.isoformat() if substep.completed_at else None,
                        "order": substep.order,
                        "stepId": str(step.id),
                        "createdAt": substep.created_at.isoformat() if substep.created_at else None,
                        "updatedAt": substep.updated_at.isoformat() if substep.updated_at else None,
                    })

            # Steps should have their completed_at set when marked as completed

            step_data = {
                "id": str(step.id),
                "content": step.content,
                "completed": step.completed,
                "completedAt": step.completed_at.isoformat() if step.completed_at else None,
                "order": step.order,
                "dueDate": step.due_date,
                "processId": str(step.process_id) if step.process_id else None,
                "createdAt": step.created_at.isoformat() if step.created_at else None,
                "updatedAt": step.updated_at.isoformat() if step.updated_at else None,
                "subSteps": substeps_data,
            }
            steps_data.append(step_data)

    # Get the base template data
    template_dict = template.to_dict()

    # Ensure steps data is included
    template_dict["steps"] = steps_data

    # Include instance IDs if any
    if hasattr(template, "instances") and template.instances:
        template_dict["instanceIds"] = [
            str(instance.id) for instance in template.instances]

    # Add connected events to comply with ProcessDetailOut schema
    template_dict["connectedEvents"] = []

    # Log the template details for debugging
    logger.info(f"Returning template {template_id} with {len(steps_data)} steps")

    return template_dict


@templates_router.put("/{template_id:uuid}", response_model=ProcessDetailOut)
async def update_template(
    template_id: UUID,
    template_update: ProcessUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update a template process."""
    db_template = db.query(Process).filter(
        Process.id == template_id, Process.is_template == True).first()
    if not db_template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Template process not found")

    # Check if the user is the creator
    if db_template.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You don't have permission to update this template")

    # Update the template fields
    for key, value in template_update.model_dump(exclude_unset=True).items():
        setattr(db_template, key, value)

    # Ensure is_template remains True
    db_template.is_template = True

    # Update last_updated timestamp
    db_template.last_updated = datetime.utcnow().isoformat()

    db.commit()

    # Reload the template with steps and substeps after updating
    db_template = (
        db.query(Process)
        .filter(Process.id == template_id)
        .options(joinedload(Process.steps).joinedload(Step.sub_steps))
        .first()
    )

    # Get the updated template
    template_dict = db_template.to_dict()

    # Add connected events to comply with ProcessDetailOut schema
    template_dict["connectedEvents"] = []

    logger.info(f"Updated template {template_id} with {len(template_dict.get('steps', []))} steps")

    return template_dict


@templates_router.delete("/{template_id:uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Delete a template process."""
    db_template = db.query(Process).filter(
        Process.id == template_id, Process.is_template == True).first()
    if not db_template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Template process not found")

    # Check if the user is the creator
    if db_template.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only the creator can delete this template")

    db.delete(db_template)
    db.commit()
    return None

# Live processes specific routes


@live_processes_router.get("", response_model=List[ProcessOut])
async def get_live_processes(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    favorite: Optional[bool] = None,
    template_id: Optional[UUID] = None,
):
    """Get live (non-template) processes with optional filtering."""
    query = db.query(Process)

    # Only return live processes created by the current user
    query = query.filter(Process.created_by_id == current_user.id)

    # Always filter by live process status (not templates)
    query = query.filter(Process.is_template.is_(False))

    # Filter by category if provided
    if category:
        query = query.filter(Process.category == category)

    # Filter by favorite if provided
    # For live processes, favorites should always be false as only templates can be favorited
    if favorite is not None:
        # If looking for favorited processes, we won't find any non-templates
        if favorite:
            # Return empty list immediately as no live processes should be favorites
            return []
        else:
            # Non-favorites can include live processes
            query = query.filter(Process.favorite.is_(False))

    # Filter by template_id if provided
    if template_id:
        query = query.filter(Process.template_id == template_id)

    # Add eager loading of steps and substeps
    query = query.options(joinedload(Process.steps).joinedload(Step.sub_steps))

    live_processes = query.offset(skip).limit(limit).all()

    return [process.to_dict() for process in live_processes]


@live_processes_router.post("", response_model=ProcessOut)
async def create_live_process(process: ProcessCreate, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Create a new live process, optionally from a template."""
    # Get directory_id from Pydantic model
    directory_id = None
    if hasattr(process, 'directoryId'):
        directory_id = process.directoryId

    new_process = Process(
        title=process.title,
        description=process.description,
        color=process.color,
        category=process.category,
        favorite=False,  # Only templates can be favorited
        created_by_id=current_user.id,
        directory_id=directory_id,
        template_id=None,
        is_template=False,
        last_updated=datetime.utcnow().isoformat()
    )
    db.add(new_process)
    db.commit()
    db.refresh(new_process)

    # Code removed - template_id is not used in this route

    # Convert to dictionary to ensure proper UUID and metadata conversion
    return new_process.to_dict()


@live_processes_router.get("/{process_id:uuid}", response_model=ProcessDetailOut)
async def get_live_process(process_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get a specific live process by ID."""
    process = (
        db.query(Process).filter(Process.id == process_id).options(
            joinedload(Process.steps).joinedload(Step.sub_steps)).first()
    )

    if not process:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Live process not found")

    # Check if the user is the creator
    if process.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You don't have permission to view this process")

    # Convert to dictionary to ensure proper UUID and metadata conversion
    process_dict = process.to_dict()

    # Process dictionary should already include properly formatted steps
    # No need for additional formatting here

    # Add connectedEvents to comply with ProcessDetailOut schema
    process_dict["connectedEvents"] = []

    return process_dict


@live_processes_router.put("/{process_id:uuid}", response_model=ProcessDetailOut)
async def update_live_process(
    process_id: UUID,
    process_update: ProcessUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update a live process."""
    db_process = db.query(Process).filter(
        Process.id == process_id, Process.is_template == False).first()
    if not db_process:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Live process not found")

    # Check if the user is the creator
    if db_process.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You don't have permission to update this process")

    # Update the process fields
    for key, value in process_update.model_dump(exclude_unset=True).items():
        setattr(db_process, key, value)

    # Ensure is_template remains False
    db_process.is_template = False

    # Update last_updated timestamp
    db_process.last_updated = datetime.utcnow().isoformat()

    db.commit()

    # Reload the process with steps and substeps after updating
    db_process = (
        db.query(Process)
        .filter(Process.id == process_id)
        .options(joinedload(Process.steps).joinedload(Step.sub_steps))
        .first()
    )

    # Convert to dictionary to ensure proper UUID and metadata conversion
    process_dict = db_process.to_dict()

    # Add connectedEvents to comply with ProcessDetailOut schema
    process_dict["connectedEvents"] = []

    return process_dict


@live_processes_router.delete("/{process_id:uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_live_process(process_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Delete a live process."""
    db_process = db.query(Process).filter(
        Process.id == process_id, Process.is_template == False).first()
    if not db_process:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Live process not found")

    # Check if the user is the creator
    if db_process.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only the creator can delete this process")

    db.delete(db_process)
    db.commit()
    return None


@live_processes_router.post("/{process_id:uuid}/fix-completion", response_model=Dict[str, Any])
async def fix_live_process_completion(
    process_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """
    Ensure completed steps have their substeps marked as completed.
    """
    # Verify process exists and user has permission
    process = db.query(Process).filter(
        Process.id == process_id, Process.is_template == False).first()

    if not process:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                        detail="Live process not found")

    # Check if the user is the creator
    if process.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                        detail="You don't have permission to update this process")

    # Load the process with all steps and substeps
    process = db.query(Process).options(
        joinedload(Process.steps).joinedload(Step.sub_steps)
    ).filter(Process.id == process_id, Process.is_template == False).first()

    # Track how many items we update
    updated_substeps = 0

    # Check steps and ensure their substeps are synchronized
    if process.steps:
        for step in process.steps:
            # If parent step is completed, ensure all substeps are completed
            if step.completed and step.sub_steps:
                for substep in step.sub_steps:
                    if not substep.completed:
                        substep.completed = True
                        substep.completed_at = datetime.utcnow()
                        updated_substeps += 1

    # Commit the changes
    db.commit()

    return {
        "success": True,
        "processId": str(process_id),
        "updatedSubsteps": updated_substeps,
        "message": f"Synchronized {updated_substeps} substeps with their completed parent steps"
    }


@router.get("/{process_id:uuid}", response_model=ProcessDetailOut)
async def get_process(process_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get a specific process by ID."""
    process = db.query(Process).filter(Process.id == process_id).options(
        joinedload(Process.steps).joinedload(Step.sub_steps)).first()

    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Process not found")

    # Check if the user is the creator
    if process.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You don't have permission to view this process")

    # Convert to dictionary to ensure proper UUID and metadata conversion
    process_dict = process.to_dict()

    # Process dictionary should already include properly formatted steps
    # No need for additional formatting here

    # Add connectedEvents to comply with ProcessDetailOut schema
    process_dict["connectedEvents"] = []

    return process_dict


@router.put("/{process_id:uuid}", response_model=ProcessDetailOut)
async def update_process(
    process_id: UUID,
    process_update: ProcessUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update a process."""
    db_process = verify_process_ownership(db, process_id, current_user.id)

    # Update the process fields
    for key, value in process_update.model_dump(exclude_unset=True).items():
        setattr(db_process, key, value)

    # Update last_updated timestamp
    db_process.last_updated = datetime.utcnow().isoformat()

    db.commit()

    # Reload the process with steps and substeps after updating
    db_process = (
        db.query(Process)
        .filter(Process.id == process_id)
        .options(joinedload(Process.steps).joinedload(Step.sub_steps))
        .first()
    )

    # Convert to dictionary to ensure proper UUID and metadata conversion
    process_dict = db_process.to_dict()

    # Add connectedEvents to comply with ProcessDetailOut schema
    process_dict["connectedEvents"] = []

    return process_dict


@router.delete("/{process_id:uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_process(process_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Delete a process."""
    db_process = db.query(Process).filter(Process.id == process_id).first()
    if not db_process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Process not found")

    # Check if the user is the creator
    if db_process.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only the creator can delete this process")

    db.delete(db_process)
    db.commit()
    return None

# Steps endpoints


@router.post("/{process_id:uuid}/steps", response_model=Dict[str, Any])
async def create_step(
    process_id: UUID,
    step: StepCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Create a new step in a process."""
    # Verify process exists and user has permission
    verify_process_ownership(db, process_id, current_user.id)

    # Create the step
    new_step = Step(content=step.content, completed=step.completed,
                    order=step.order, due_date=step.due_date, process_id=process_id)
    db.add(new_step)
    db.commit()
    db.refresh(new_step)

    # Convert to dictionary to ensure proper UUID and metadata conversion
    return new_step.to_dict()


@router.get("/{process_id:uuid}/steps", response_model=List[Dict[str, Any]])
async def get_steps(process_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get all steps for a process."""
    # Verify process exists and user has permission
    verify_process_ownership(db, process_id, current_user.id)

    steps = db.query(Step).filter(Step.process_id ==
                                  process_id).order_by(Step.order).all()

    # Convert to dictionary to ensure proper UUID and metadata conversion
    return [step.to_dict() for step in steps]


@router.put("/steps/{step_id:uuid}", response_model=Dict[str, Any])
async def update_step(
    step_id: UUID,
    step_update: StepUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update a step."""
    db_step = db.query(Step).filter(Step.id == step_id).first()
    if not db_step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")

    # Verify user has permission by checking process ownership
    if db_step.process_id:
        verify_process_ownership(db, db_step.process_id, current_user.id)

    # Update the step fields
    for key, value in step_update.model_dump(exclude_unset=True).items():
        setattr(db_step, key, value)

    # Check if the completed status is being updated
    is_completion_update = "completed" in step_update.model_dump(exclude_unset=True)

    # Set the completed_at timestamp if completed status is being updated to True
    if is_completion_update and step_update.completed:
        db_step.completed_at = datetime.utcnow()

        # If the step is being marked as completed, also mark all substeps as completed
        substeps = db.query(SubStep).filter(SubStep.step_id == step_id).all()
        for substep in substeps:
            substep.completed = True
            substep.completed_at = datetime.utcnow()

    # Clear the completed_at timestamp if step is being marked as incomplete
    elif is_completion_update and not step_update.completed:
        db_step.completed_at = None

        # Optionally, you can also mark all substeps as incomplete when the step is marked incomplete
        substeps = db.query(SubStep).filter(SubStep.step_id == step_id).all()
        for substep in substeps:
            substep.completed = False
            substep.completed_at = None

    db.commit()
    db.refresh(db_step)

    # Get the updated step with substeps
    updated_step = db.query(Step).options(
        joinedload(Step.sub_steps)
    ).filter(Step.id == step_id).first()

    # Convert to dictionary including substeps
    result = updated_step.to_dict()

    # Add substeps to the response
    if updated_step.sub_steps:
        result["subSteps"] = [substep.to_dict() for substep in updated_step.sub_steps]

    return result


@router.delete("/steps/{step_id:uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_step(step_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Delete a step."""
    db_step = db.query(Step).filter(Step.id == step_id).first()
    if not db_step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")

    # Verify user has permission by checking process ownership
    if db_step.process_id:
        verify_process_ownership(db, db_step.process_id, current_user.id)

    db.delete(db_step)
    db.commit()
    return None

# Sub-steps endpoints


@router.post("/steps/{step_id:uuid}/substeps", response_model=Dict[str, Any])
async def create_substep(
    step_id: UUID,
    substep: SubStepCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Create a new sub-step for a step."""
    # Verify step exists
    step = db.query(Step).filter(Step.id == step_id).first()
    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")

    # Verify user has permission by checking process ownership
    if step.process_id:
        verify_process_ownership(db, step.process_id, current_user.id)

    # Create the sub-step
    new_substep = SubStep(content=substep.content,
                          completed=substep.completed, order=substep.order, step_id=step_id)
    db.add(new_substep)
    db.commit()
    db.refresh(new_substep)

    # Convert to dictionary to ensure proper UUID and metadata conversion
    return new_substep.to_dict()


@router.get("/steps/{step_id:uuid}/substeps", response_model=List[Dict[str, Any]])
async def get_substeps(step_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get all sub-steps for a step."""
    # Verify step exists
    step = db.query(Step).filter(Step.id == step_id).first()
    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")

    # Verify user has permission by checking process ownership
    if step.process_id:
        verify_process_ownership(db, step.process_id, current_user.id)

    substeps = db.query(SubStep).filter(SubStep.step_id ==
                                        step_id).order_by(SubStep.order).all()

    # Convert to dictionaries to ensure proper UUID and metadata conversion
    return [substep.to_dict() for substep in substeps]


@router.put("/batch/substeps/update", response_model=List[Dict[str, Any]])
async def batch_update_substeps(
    substep_updates: List[Dict[str, Any]],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """
    Batch update multiple substeps at once.
    Each update should contain: id, completed (and any other fields to update)
    """
    updated_substeps = []

    for update in substep_updates:
        substep_id = update.get("id")
        if not substep_id:
            continue

        # Find the substep
        substep = db.query(SubStep).filter(SubStep.id == substep_id).first()
        if not substep:
            continue

        # Verify user has permission by checking the process ownership
        step = db.query(Step).filter(Step.id == substep.step_id).first()
        if step and step.process_id:
            try:
                verify_process_ownership(db, step.process_id, current_user.id)
            except HTTPException:
                # Skip this substep if the user doesn't have permission
                continue

        # Update the fields that are provided
        for key, value in update.items():
            if key != "id" and hasattr(substep, key):
                setattr(substep, key, value)

        # Set the completed_at timestamp if completed status is being updated to True
        if "completed" in update and update["completed"]:
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

    return [substep.to_dict() for substep in updated_substeps]


@router.put("/substeps/{substep_id:uuid}", response_model=Dict[str, Any])
async def update_substep(
    substep_id: UUID,
    substep_update: SubStepUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update a sub-step."""
    db_substep = db.query(SubStep).filter(SubStep.id == substep_id).first()
    if not db_substep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sub-step not found")

    # Verify user has permission by checking the process ownership
    step = db.query(Step).filter(Step.id == db_substep.step_id).first()
    if step and step.process_id:
        verify_process_ownership(db, step.process_id, current_user.id)

    # Update the sub-step fields
    for key, value in substep_update.model_dump(exclude_unset=True).items():
        setattr(db_substep, key, value)

    # Set the completed_at timestamp if completed status is being updated to True
    if "completed" in substep_update.model_dump(exclude_unset=True) and substep_update.completed:
        db_substep.completed_at = datetime.utcnow()
    # Clear the completed_at timestamp if substep is being marked as incomplete
    elif "completed" in substep_update.model_dump(exclude_unset=True) and not substep_update.completed:
        db_substep.completed_at = None

    db.commit()
    db.refresh(db_substep)

    # Convert to dictionary to ensure proper UUID and metadata conversion
    return db_substep.to_dict()


@router.delete("/substeps/{substep_id:uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_substep(substep_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Delete a sub-step."""
    db_substep = db.query(SubStep).filter(SubStep.id == substep_id).first()
    if not db_substep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sub-step not found")

    # Verify user has permission by checking the process ownership
    step = db.query(Step).filter(Step.id == db_substep.step_id).first()
    if step and step.process_id:
        verify_process_ownership(db, step.process_id, current_user.id)

    db.delete(db_substep)
    db.commit()
    return None


# Internal function to get process steps - can be called from other modules
def get_process_steps_internal(db: Session, process_id: UUID, current_user: User) -> List[Any]:
    """
    Get steps for a process - internal function that can be called from other modules.
    Returns properly formatted steps with their substeps.

    Args:
        db: Database session
        process_id: Process ID
        current_user: Current user

    Returns:
        List of formatted steps with substeps
    """
    # Verify process exists
    process = db.query(Process).filter(Process.id == process_id).first()
    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Process not found")

    # Load steps with substeps
    steps = db.query(Step).options(
        joinedload(Step.sub_steps)
    ).filter(Step.process_id == process_id).order_by(Step.order).all()

    # If no steps, return empty list
    if not steps:
        return []

    # Format steps using helper function
    from api.lib.events.helpers import format_steps_with_substeps
    return format_steps_with_substeps(steps)


@router.post("/{process_id:uuid}/fix-completion", response_model=Dict[str, Any])
async def fix_process_completion(
    process_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """
    Ensure completed steps have their substeps marked as completed.
    """
    # Verify process exists and user has permission
    process = verify_process_ownership(db, process_id, current_user.id)

    # Load the process with all steps and substeps
    process = db.query(Process).options(
        joinedload(Process.steps).joinedload(Step.sub_steps)
    ).filter(Process.id == process_id).first()

    if not process:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Process not found")

    # Track how many items we update
    updated_substeps = 0

    # Check steps and ensure their substeps are synchronized
    if process.steps:
        for step in process.steps:
            # If parent step is completed, ensure all substeps are completed
            if step.completed and step.sub_steps:
                for substep in step.sub_steps:
                    if not substep.completed:
                        substep.completed = True
                        substep.completed_at = datetime.utcnow()
                        updated_substeps += 1

    # Commit the changes
    db.commit()

    return {
        "success": True,
        "processId": str(process_id),
        "updatedSubsteps": updated_substeps,
        "message": f"Synchronized {updated_substeps} substeps with their completed parent steps"
    }
