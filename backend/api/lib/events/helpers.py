"""Event helper functions."""

import logging
import uuid
from typing import List

from api.schemas.events import SchemaEventListItem, SchemaParticipantsGroup, SchemaParticipantUser, SchemaStepOut, SchemaSubStepOut
from api.utils import ensure_uuid_as_string
from db.models import Event, EventParticipant, Step

# Set up logger
logger = logging.getLogger(__name__)


def format_steps_with_substeps(steps: List[Step]) -> List[SchemaStepOut]:
    """Format event steps with their substeps for API response."""
    formatted_steps = []

    logger.info(f"Formatting {len(steps)} steps")

    for step in sorted(steps, key=lambda s: s.order):
        formatted_substeps = []

        try:
            substeps_to_process = []

            # Handle the substeps collection properly
            if hasattr(step, 'sub_steps'):
                if isinstance(step.sub_steps, Step):
                    logger.warning(f"Step {step.id} has sub_steps that is a Step object, not a list - fixing")
                    substeps_to_process = []
                elif step.sub_steps is None:
                    logger.info(f"Step {step.id} has no substeps")
                    substeps_to_process = []
                else:
                    try:
                        substeps_to_process = list(step.sub_steps)
                        logger.debug(f"Step {step.id} has {len(substeps_to_process)} substeps to format")
                    except Exception as e:
                        logger.error(f"Step {step.id} has sub_steps that couldn't be converted to list: {e}")
                        substeps_to_process = []

            # Process valid substeps
            if substeps_to_process:
                valid_substeps = [
                    ss for ss in substeps_to_process
                    if hasattr(ss, 'id') or hasattr(ss, 'content')
                ]

                if valid_substeps:
                    logger.debug(f"Processing {len(valid_substeps)} valid substeps for step {step.id}")
                    # Sort substeps by order if possible
                    sorted_substeps = sorted(valid_substeps, key=lambda ss: getattr(ss, 'order', 0))

                    # Format each substep
                    for substep in sorted_substeps:
                        substep_dict = {
                            "id": getattr(substep, 'id', str(uuid.uuid4())),
                            "content": getattr(substep, 'content', 'Missing content'),
                            "completed": getattr(substep, 'completed', False),
                            "order": getattr(substep, 'order', 0),
                            "stepId": getattr(substep, 'step_id', step.id),
                            "createdAt": getattr(substep, 'created_at', None),
                            "updatedAt": getattr(substep, 'updated_at', None),
                            "completedAt": getattr(substep, 'completed_at', None),
                        }
                        # Ensure all UUIDs are converted to strings
                        substep_dict = ensure_uuid_as_string(substep_dict)
                        formatted_substeps.append(SchemaSubStepOut.model_validate(substep_dict))
                else:
                    logger.info(f"No valid substeps found for step {step.id}")
        except Exception as e:
            logger.error(f"Error processing substeps for step {step.id}: {e}")
            formatted_substeps = []

        # We don't need to set completed_at here since it should be done at the DB level when marking as completed

        # Create step output - use camelCase field names
        step_out = SchemaStepOut(
            id=str(step.id),
            content=step.content,
            completed=step.completed,
            order=step.order,
            dueDate=step.due_date,
            eventId=str(step.event_id) if step.event_id else None,
            processId=str(step.process_id) if step.process_id else None,
            createdAt=step.created_at,
            updatedAt=step.updated_at,
            completedAt=step.completed_at,
            subSteps=formatted_substeps,
        )
        formatted_steps.append(step_out)
        logger.debug(f"Added formatted step {step.id} with {len(formatted_substeps)} substeps")

    return formatted_steps


def create_participants_group(participants: List[EventParticipant]) -> SchemaParticipantsGroup:
    """Create a participants group from event participants."""
    participants_list = [
        SchemaParticipantUser(
            id=str(p.user.id),
            name=p.user.name,
            handle=p.user.handle,
            profileImage=p.user.profile_image
        )
        for p in participants
        if p.user
    ]

    return SchemaParticipantsGroup(
        name="Participants",
        count=len(participants_list),
        avatars=participants_list[:5],  # Limit to 5 avatars
    )


def format_event_for_list(event: Event) -> SchemaEventListItem:
    """Format event for list view."""
    topic_names = [topic.name for topic in event.topics]
    participant_count = len(event.participants) if event.participants else 0

    return SchemaEventListItem(
        id=str(event.id),
        title=event.title,
        startTime=event.start_time,
        endTime=event.end_time,
        date=event.date,
        time=event.time,
        color=event.color,
        status=event.status,
        participantCount=participant_count,
        topics=topic_names,
    )


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


def generate_substeps_for_step(step_content: str) -> List[str]:
    """Generate substep content for a step based on its content."""
    # Generate appropriate substeps based on the step content
    substeps = []

    if "Requirements analysis" in step_content:
        substeps = [
            "Identify stakeholders",
            "Gather requirements",
            "Document functional requirements",
            "Document non-functional requirements",
            "Validate requirements with stakeholders",
        ]
    elif "Technical design" in step_content:
        substeps = [
            "Define system architecture",
            "Create component diagrams",
            "Design database schema",
            "Define API interfaces",
            "Review design with team",
        ]
    elif "Implementation" in step_content or "Implement" in step_content:
        substeps = [
            "Set up development environment",
            "Implement core functionality",
            "Implement error handling",
            "Add logging and monitoring",
            "Optimize performance",
        ]
    elif "Unit tests" in step_content:
        substeps = [
            "Create test plan",
            "Write test cases",
            "Implement unit tests",
            "Run tests and fix issues",
            "Document test results",
        ]
    elif "Code review" in step_content:
        substeps = [
            "Review code for quality",
            "Check for security issues",
            "Verify adherence to coding standards",
            "Address review comments",
            "Final approval",
        ]
    elif "Integration testing" in step_content:
        substeps = [
            "Set up integration test environment",
            "Create integration test cases",
            "Execute integration tests",
            "Document and fix issues",
            "Verify integration points",
        ]
    elif "Planning" in step_content:
        substeps = [
            "Define project scope",
            "Identify resources needed",
            "Create timeline",
            "Assign responsibilities",
            "Risk assessment",
        ]
    elif "Development" in step_content:
        substeps = [
            "Set up development environment",
            "Code implementation",
            "Unit testing",
            "Code review",
            "Documentation",
        ]
    elif "Testing" in step_content or "tests" in step_content.lower():
        substeps = ["Create test plan", "Develop test cases", "Execute tests", "Document issues", "Verify fixes"]
    elif "Documentation" in step_content:
        substeps = [
            "Create user documentation",
            "Write technical documentation",
            "Document API references",
            "Create maintenance guides",
            "Review and finalize",
        ]
    elif "Deployment" in step_content or "Deploy" in step_content:
        substeps = [
            "Prepare deployment environment",
            "Create deployment plan",
            "Perform deployment",
            "Verify deployment",
            "Monitor for issues",
        ]
    elif "Monitor" in step_content:
        substeps = [
            "Set up monitoring tools",
            "Define key metrics",
            "Establish baseline",
            "Set up alerts",
            "Create monitoring dashboard",
        ]
    elif "Refactor" in step_content:
        substeps = [
            "Identify problem areas",
            "Create test suite",
            "Refactor in small increments",
            "Run tests after each change",
            "Document improvements",
        ]
    elif "Identify" in step_content:
        substeps = [
            "Analyze codebase",
            "Find performance bottlenecks",
            "Identify security issues",
            "Document technical debt",
            "Prioritize issues to address",
        ]
    elif "Verify" in step_content:
        substeps = [
            "Run comprehensive tests",
            "Check code quality metrics",
            "Verify performance",
            "Ensure no regressions",
            "Document verification results",
        ]
    else:
        # Default substeps for other steps
        substeps = ["Plan", "Execute", "Review", "Document", "Follow up"]

    return substeps
