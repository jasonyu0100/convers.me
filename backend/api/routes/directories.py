"""Directory routes for the API."""

# Set up logger
import logging
from typing import Annotated, Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.schemas.processes import SchemaDirectoryCreate as DirectoryCreate
from api.schemas.processes import SchemaDirectoryDetailOut as DirectoryDetailOut
from api.schemas.processes import SchemaDirectoryOut as DirectoryOut
from api.schemas.processes import SchemaDirectoryUpdate as DirectoryUpdate
from api.security import get_current_user
from db.database import get_db
from db.models import Directory, Process, Step, SubStep, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/directories", tags=["directories"])


# Health check endpoint
@router.get("/health", include_in_schema=True, response_model=Dict[str, Any])
async def health_check_directories():
    """Health check for the directories router."""
    from api.utils import check_router_health

    health_data = check_router_health("directories")
    return health_data


# Public test endpoint that returns a sample directory without requiring authentication
@router.get("/test", include_in_schema=True, response_model=Dict[str, Any])
async def test_directories():
    """Public test endpoint that returns a sample directory with processes, steps and substeps."""
    sample_directory = {
        "id": "test-directory-id",
        "name": "Test Directory",
        "description": "This is a sample directory for testing",
        "color": "green",
        "processes": [
            {
                "id": "process-1",
                "title": "Process in Directory",
                "description": "A process that belongs to this directory",
                "color": "blue",
                "isTemplate": True,
                "directoryId": "test-directory-id",
                "steps": [
                    {
                        "id": "dir-step-1",
                        "content": "Directory Process Step",
                        "completed": False,
                        "order": 0,
                        "processId": "process-1",
                        "subSteps": [
                            {
                                "id": "dir-substep-1",
                                "content": "Directory Process Substep",
                                "completed": False,
                                "order": 0,
                                "stepId": "dir-step-1",
                            }
                        ],
                    }
                ],
            }
        ],
    }
    return sample_directory


@router.post("", response_model=DirectoryOut)
async def create_directory(directory: DirectoryCreate, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Create a new directory."""
    # If a parent_id is provided, verify it exists
    if directory.parentId:
        parent_dir = db.query(Directory).filter(Directory.id == directory.parentId).first()
        if not parent_dir:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent directory not found")

        # Verify the user owns the parent directory
        if parent_dir.created_by_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to add to this parent directory",
            )

    # Create the directory
    new_directory = Directory(
        name=directory.name,
        description=directory.description,
        color=directory.color,
        icon=directory.icon,
        parent_id=directory.parentId,
        created_by_id=current_user.id,
        directory_metadata=directory.directoryMetadata,
    )
    db.add(new_directory)
    db.commit()
    db.refresh(new_directory)

    # Convert to dictionary to ensure proper UUID and metadata conversion
    return new_directory.to_dict()


@router.get("", response_model=List[DirectoryOut])
async def get_directories(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    parent_id: Optional[UUID] = None,
    include_templates: bool = False,
):
    """
    Get all directories for the current user.

    If parent_id is provided, returns subdirectories of that directory.
    If parent_id is None, returns top-level directories.
    By default, directories that are templates (belong to a collection) are excluded.
    Set include_templates=True to include template directories.
    """
    query = db.query(Directory).filter(Directory.created_by_id == current_user.id)

    # Filter out template directories unless explicitly requested
    if not include_templates:
        query = query.filter(Directory.is_template == False)

    if parent_id:
        # Get subdirectories of specific parent
        query = query.filter(Directory.parent_id == parent_id)
    else:
        # Get top-level directories
        query = query.filter(Directory.parent_id.is_(None))

    directories = query.all()
    result = []

    # For each directory, fetch its processes
    for directory in directories:
        dir_dict = directory.to_dict()

        # Get processes for this directory
        processes = db.query(Process).filter(Process.directory_id == directory.id).all()

        # Only include template processes in the response
        template_processes = [process for process in processes if process.is_template]
        dir_dict["processes"] = [str(process.id) for process in template_processes]
        logger.info(f"Found {len(template_processes)} template processes in directory {directory.id}")

        # Add process counts to help with UI rendering
        dir_dict["processCount"] = len(template_processes)

        result.append(dir_dict)

    return result


@router.get("/{directory_id:uuid}", response_model=DirectoryDetailOut)
async def get_directory(directory_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get a specific directory with its processes, steps, and substeps."""
    logger.info(f"Getting directory {directory_id}")

    # Get the directory without eager loading
    directory = db.query(Directory).filter(Directory.id == directory_id).first()

    if not directory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Directory not found")

    # Check permissions
    if directory.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to view this directory")

    # Convert directory to dictionary to ensure proper UUID handling
    directory_dict = directory.to_dict()

    # Get processes in this directory, handling both templates and instances
    # First get all processes
    all_processes = db.query(Process).filter(Process.directory_id == directory_id).all()

    # Split into templates and instances
    template_processes = [p for p in all_processes if p.is_template]
    instance_processes = [p for p in all_processes if not p.is_template and p.template_id]
    standalone_processes = [p for p in all_processes if not p.is_template and not p.template_id]

    # For instances, only include those whose templates are not in this directory
    # This prevents duplicates where both template and instance are in the same directory
    filtered_instances = []
    template_ids_in_directory = set(template.id for template in template_processes)
    for instance in instance_processes:
        if instance.template_id not in template_ids_in_directory:
            filtered_instances.append(instance)

    # Combine filtered processes
    processes = template_processes + standalone_processes + filtered_instances
    logger.info(f"Found {len(all_processes)} total processes, filtered to {len(processes)} unique processes in directory {directory_id}")

    # Get all process IDs
    process_ids = [process.id for process in processes]

    # Load all steps in a single query
    steps = []
    if process_ids:
        steps = db.query(Step).filter(Step.process_id.in_(process_ids)).all()
    logger.info(f"Found {len(steps)} steps for processes in this directory")

    # Get step IDs
    step_ids = [step.id for step in steps]

    # Load all substeps in a single query
    substeps = []
    if step_ids:
        substeps = db.query(SubStep).filter(SubStep.step_id.in_(step_ids)).all()
    logger.info(f"Found {len(substeps)} substeps for steps in this directory")

    # Organize substeps by step_id for quick lookup
    substeps_by_step: Dict[str, List[SubStep]] = {}
    for substep in substeps:
        step_id = str(substep.step_id)
        if step_id not in substeps_by_step:
            substeps_by_step[step_id] = []
        substeps_by_step[step_id].append(substep)

    # Organize steps by process_id for quick lookup
    steps_by_process: Dict[str, List[Step]] = {}
    for step in steps:
        process_id = str(step.process_id)
        if process_id not in steps_by_process:
            steps_by_process[process_id] = []
        steps_by_process[process_id].append(step)

    # Create the response
    directory_dict = directory.to_dict()
    directory_dict["processes"] = []

    # Not returning subdirectories anymore - directories directly contain processes

    # Add processes with their steps and substeps
    for process in processes:
        process_id = str(process.id)

        # Convert process to dictionary
        process_dict = {
            "id": process_id,
            "title": process.title,
            "description": process.description,
            "color": process.color,
            "lastUpdated": process.last_updated,
            "favorite": process.favorite,
            "category": process.category,
            "metadata": process.process_metadata,
            "isTemplate": process.is_template,
            "createdById": str(process.created_by_id) if process.created_by_id else None,
            "directoryId": str(process.directory_id) if process.directory_id else None,
            "templateId": str(process.template_id) if process.template_id else None,
            "createdAt": process.created_at.isoformat() if process.created_at else None,
            "updatedAt": process.updated_at.isoformat() if process.updated_at else None,
            "steps": [],  # Initialize empty steps array
        }

        # Add steps for this process
        process_steps = steps_by_process.get(process_id, [])
        if process_steps:
            for step in process_steps:
                step_id = str(step.id)
                step_dict = {
                    "id": step_id,
                    "content": step.content,
                    "completed": step.completed,
                    "order": step.order,
                    "dueDate": step.due_date,
                    "processId": process_id,
                    "eventId": str(step.event_id) if step.event_id else None,
                    "createdAt": step.created_at.isoformat() if step.created_at else None,
                    "updatedAt": step.updated_at.isoformat() if step.updated_at else None,
                    "subSteps": [],
                }

                # Add substeps for this step
                step_substeps = substeps_by_step.get(step_id, [])
                if step_substeps:
                    for substep in step_substeps:
                        substep_dict = {
                            "id": str(substep.id),
                            "content": substep.content,
                            "completed": substep.completed,
                            "order": substep.order,
                            "stepId": step_id,
                            "createdAt": substep.created_at.isoformat() if substep.created_at else None,
                            "updatedAt": substep.updated_at.isoformat() if substep.updated_at else None,
                        }
                        step_dict["subSteps"].append(substep_dict)

                process_dict["steps"].append(step_dict)

        # Add template relationship info
        if process.template_id:
            # Get the template
            template = db.query(Process).filter(Process.id == process.template_id).first()
            if template:
                process_dict["template"] = {"id": str(template.id), "title": template.title}

        # If this is a template, include instance IDs
        if process.is_template:
            # Get the instances
            instances = db.query(Process).filter(Process.template_id == process.id).all()
            if instances:
                process_dict["instanceIds"] = [str(instance.id) for instance in instances]

        directory_dict["processes"].append(process_dict)

    # Convert to camelCase for the response
    # Use APIBaseModel.process_response for camelCase conversion

    return directory_dict


@router.put("/{directory_id:uuid}", response_model=DirectoryOut)
async def update_directory(
    directory_id: UUID,
    directory_update: DirectoryUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update a directory."""
    # Get the directory
    db_directory = db.query(Directory).filter(Directory.id == directory_id).first()

    if not db_directory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Directory not found")

    # Check permissions
    if db_directory.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to update this directory")

    # If updating parent, verify the new parent exists and user has permissions
    if directory_update.parentId is not None and directory_update.parentId != db_directory.parent_id:
        # If parent_id is empty string, set to None (make it a top-level directory)
        if directory_update.parentId == "":
            directory_update.parentId = None

        if directory_update.parentId:
            parent_dir = db.query(Directory).filter(Directory.id == directory_update.parentId).first()
            if not parent_dir:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent directory not found")

            # Verify the user owns the parent directory
            if parent_dir.created_by_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to move to this parent directory",
                )

            # Prevent circular references
            if parent_dir.id == db_directory.id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot set a directory as its own parent")

    # Update the directory fields
    data = directory_update.model_dump(exclude_unset=True)

    # Handle special case for parentId -> parent_id
    if 'parentId' in data:
        data['parent_id'] = data.pop('parentId')

    # Handle special case for directoryMetadata -> directory_metadata
    if 'directoryMetadata' in data:
        data['directory_metadata'] = data.pop('directoryMetadata')

    for key, value in data.items():
        setattr(db_directory, key, value)

    db.commit()
    db.refresh(db_directory)

    # Convert to camelCase for the response
    # Use APIBaseModel.process_response for camelCase conversion

    return db_directory.to_dict()


@router.delete("/{directory_id:uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_directory(
    directory_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    move_processes: Optional[bool] = False,
    target_directory_id: Optional[UUID] = None,
):
    """
    Delete a directory.

    If move_processes is True, move contained processes to the target_directory_id.
    If move_processes is False, all contained processes will be orphaned (no directory).
    """
    # Get the directory
    db_directory = db.query(Directory).filter(Directory.id == directory_id).first()

    if not db_directory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Directory not found")

    # Check permissions
    if db_directory.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to delete this directory")

    # If moving processes to another directory, verify target directory exists
    if move_processes and target_directory_id:
        target_dir = db.query(Directory).filter(Directory.id == target_directory_id).first()
        if not target_dir:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target directory not found")

        # Verify user owns the target directory
        if target_dir.created_by_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to move processes to this directory",
            )

        # Move processes to the target directory
        db.query(Process).filter(Process.directory_id == directory_id).update({"directory_id": target_directory_id})
    else:
        # Orphan processes (set directory_id to NULL)
        db.query(Process).filter(Process.directory_id == directory_id).update({"directory_id": None})

    # Move subdirectories to be top-level directories
    db.query(Directory).filter(Directory.parent_id == directory_id).update({"parent_id": None})

    # Delete the directory
    db.delete(db_directory)
    db.commit()
    return None
