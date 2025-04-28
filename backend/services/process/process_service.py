"""
Process service module for handling process-related operations.
"""

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status

from db.models import Event, Process, Step, SubStep
from services.common.base_service import BaseService

# Set up logger
logger = logging.getLogger(__name__)


class ProcessService(BaseService):
    """Service for handling process-related operations."""

    def get_process_by_id(self, process_id: str) -> Optional[Process]:
        """
        Get a process by ID.

        Args:
            process_id: The process ID

        Returns:
            Process: The process if found, None otherwise
        """
        return self.db.query(Process).filter(Process.id == process_id).first()

    def get_processes_by_user(self, user_id: str, limit: int = 100, offset: int = 0) -> List[Process]:
        """
        Get processes created by a user.

        Args:
            user_id: The user ID
            limit: Maximum number of processes to return
            offset: Offset for pagination

        Returns:
            List[Process]: List of processes
        """
        return self.db.query(Process).filter(Process.created_by_id == user_id).order_by(Process.last_updated.desc()).limit(limit).offset(offset).all()

    def get_processes_by_directory(self, directory_id: str, limit: int = 100, offset: int = 0) -> List[Process]:
        """
        Get processes in a directory.

        Args:
            directory_id: The directory ID
            limit: Maximum number of processes to return
            offset: Offset for pagination

        Returns:
            List[Process]: List of processes
        """
        return self.db.query(Process).filter(Process.directory_id == directory_id).order_by(Process.last_updated.desc()).limit(limit).offset(offset).all()

    def create_process(
        self,
        user_id: str,
        title: str,
        description: str = "",
        color: str = "blue",
        directory_id: Optional[str] = None,
        category: str = "",
        steps: List[Dict[str, Any]] = None,
        metadata: Dict[str, Any] = None,
    ) -> Process:
        """
        Create a new process.

        Args:
            user_id: ID of the user creating the process
            title: Process title
            description: Process description
            color: Process color
            directory_id: Optional directory ID
            category: Process category
            steps: List of step data for initial steps
            metadata: Additional metadata

        Returns:
            Process: The created process
        """
        process = Process(
            id=str(uuid.uuid4()),
            title=title,
            description=description,
            color=color,
            last_updated=datetime.utcnow().isoformat(),
            favorite=False,
            category=category,
            created_by_id=user_id,
            directory_id=directory_id,
            process_metadata=metadata or {},
        )

        self.db.add(process)
        self.db.flush()

        # Add steps if provided
        if steps:
            for i, step_data in enumerate(steps):
                step = Step(
                    id=f"step-{process.id}-{i}",
                    content=step_data.get("content", ""),
                    completed=step_data.get("completed", False),
                    order=i + 1,
                    due_date=step_data.get("due_date"),
                    process_id=process.id,
                )
                self.db.add(step)

                # Add sub-steps if provided
                sub_steps = step_data.get("sub_steps", [])
                for j, sub_step_data in enumerate(sub_steps):
                    sub_step = SubStep(
                        id=f"substep-{step.id}-{j}",
                        content=sub_step_data.get("content", ""),
                        completed=sub_step_data.get("completed", False),
                        order=j + 1,
                        step_id=step.id,
                    )
                    self.db.add(sub_step)

        self.db.commit()
        self.db.refresh(process)
        return process

    def update_process(self, process_id: str, update_data: Dict[str, Any]) -> Optional[Process]:
        """
        Update a process.

        Args:
            process_id: The process ID
            update_data: Data to update

        Returns:
            Process: The updated process if found, None otherwise
        """
        process = self.get_process_by_id(process_id)
        if not process:
            return None

        # Update basic fields
        for key, value in update_data.items():
            if hasattr(process, key) and key not in ["id", "created_by_id"]:
                setattr(process, key, value)

        # Always update last_updated field
        process.last_updated = datetime.utcnow().isoformat()

        self.db.commit()
        self.db.refresh(process)
        return process

    def delete_process(self, process_id: str) -> bool:
        """
        Delete a process.

        Args:
            process_id: The process ID

        Returns:
            bool: True if successful, False otherwise
        """
        process = self.get_process_by_id(process_id)
        if not process:
            return False

        # Delete all steps and sub-steps first
        for step in process.steps:
            # Delete sub-steps
            self.db.query(SubStep).filter(SubStep.step_id == step.id).delete()

        # Delete steps
        self.db.query(Step).filter(Step.process_id == process_id).delete()

        # Delete the process
        self.db.delete(process)
        self.db.commit()
        return True

    def add_step(self, process_id: str, content: str, order: Optional[int] = None) -> Optional[Step]:
        """
        Add a step to a process.

        Args:
            process_id: The process ID
            content: Step content
            order: Step order (if None, will be added at the end)

        Returns:
            Step: The created step if successful, None otherwise
        """
        process = self.get_process_by_id(process_id)
        if not process:
            return None

        # Determine order if not provided
        if order is None:
            max_order = self.db.query(Step).filter(Step.process_id == process_id).order_by(Step.order.desc()).first()
            order = (max_order.order + 1) if max_order else 1

        step = Step(id=str(uuid.uuid4()), content=content, completed=False, order=order, process_id=process_id)

        self.db.add(step)

        # Update last_updated of the process
        process.last_updated = datetime.utcnow().isoformat()

        self.db.commit()
        self.db.refresh(step)
        return step

    def update_step(self, step_id: str, update_data: Dict[str, Any]) -> Optional[Step]:
        """
        Update a step.

        Args:
            step_id: The step ID
            update_data: Data to update

        Returns:
            Step: The updated step if found, None otherwise
        """
        step = self.db.query(Step).filter(Step.id == step_id).first()
        if not step:
            return None

        # Update fields
        for key, value in update_data.items():
            if hasattr(step, key) and key not in ["id", "process_id"]:
                setattr(step, key, value)

        # Update last_updated of the process
        process = self.get_process_by_id(step.process_id)
        if process:
            process.last_updated = datetime.utcnow().isoformat()

        self.db.commit()
        self.db.refresh(step)
        return step

    def delete_step(self, step_id: str) -> bool:
        """
        Delete a step.

        Args:
            step_id: The step ID

        Returns:
            bool: True if successful, False otherwise
        """
        step = self.db.query(Step).filter(Step.id == step_id).first()
        if not step:
            return False

        # Update the process last_updated
        process = self.get_process_by_id(step.process_id)

        # Delete all sub-steps first
        self.db.query(SubStep).filter(SubStep.step_id == step_id).delete()

        # Delete the step
        self.db.delete(step)

        # Update last_updated of the process
        if process:
            process.last_updated = datetime.utcnow().isoformat()

        self.db.commit()
        return True

    def add_sub_step(self, step_id: str, content: str, order: Optional[int] = None) -> Optional[SubStep]:
        """
        Add a sub-step to a step.

        Args:
            step_id: The step ID
            content: Sub-step content
            order: Sub-step order (if None, will be added at the end)

        Returns:
            SubStep: The created sub-step if successful, None otherwise
        """
        step = self.db.query(Step).filter(Step.id == step_id).first()
        if not step:
            return None

        # Determine order if not provided
        if order is None:
            max_order = self.db.query(SubStep).filter(SubStep.step_id == step_id).order_by(SubStep.order.desc()).first()
            order = (max_order.order + 1) if max_order else 1

        sub_step = SubStep(id=str(uuid.uuid4()), content=content, completed=False, order=order, step_id=step_id)

        self.db.add(sub_step)

        # Update last_updated of the process
        process = self.get_process_by_id(step.process_id)
        if process:
            process.last_updated = datetime.utcnow().isoformat()

        self.db.commit()
        self.db.refresh(sub_step)
        return sub_step

    def update_sub_step(self, sub_step_id: str, update_data: Dict[str, Any]) -> Optional[SubStep]:
        """
        Update a sub-step.

        Args:
            sub_step_id: The sub-step ID
            update_data: Data to update

        Returns:
            SubStep: The updated sub-step if found, None otherwise
        """
        sub_step = self.db.query(SubStep).filter(SubStep.id == sub_step_id).first()
        if not sub_step:
            return None

        # Update fields
        for key, value in update_data.items():
            if hasattr(sub_step, key) and key not in ["id", "step_id"]:
                setattr(sub_step, key, value)

        # Update last_updated of the process
        step = self.db.query(Step).filter(Step.id == sub_step.step_id).first()
        if step:
            process = self.get_process_by_id(step.process_id)
            if process:
                process.last_updated = datetime.utcnow().isoformat()

        self.db.commit()
        self.db.refresh(sub_step)
        return sub_step

    def delete_sub_step(self, sub_step_id: str) -> bool:
        """
        Delete a sub-step.

        Args:
            sub_step_id: The sub-step ID

        Returns:
            bool: True if successful, False otherwise
        """
        sub_step = self.db.query(SubStep).filter(SubStep.id == sub_step_id).first()
        if not sub_step:
            return False

        # Get the step and process to update last_updated
        step = self.db.query(Step).filter(Step.id == sub_step.step_id).first()

        # Delete the sub-step
        self.db.delete(sub_step)

        # Update last_updated of the process
        if step:
            process = self.get_process_by_id(step.process_id)
            if process:
                process.last_updated = datetime.utcnow().isoformat()

        self.db.commit()
        return True

    @staticmethod
    def generate_missing_substeps_for_event(db, event_id: str) -> bool:
        """
        Generate missing substeps for an event's steps.
        This method is called when the API receives a request to populate missing substeps.

        Args:
            db: Database session
            event_id: The event ID

        Returns:
            bool: True if successful
        """
        from api.lib.events.helpers import generate_substeps_for_step, should_have_substeps

        try:
            logger.info(f"Generating missing substeps for event {event_id}")

            # Get event information to determine the appropriate substeps
            event = db.query(Event).filter(Event.id == event_id).first()
            if not event:
                logger.error(f"Event {event_id} not found")
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

            steps = db.query(Step).filter(Step.event_id == event_id).all()

            # Generate standard substep data based on event type
            default_substeps_map = {}
            event_title = event.title.lower() if event.title else ""

            if "standup" in event_title or "sync" in event_title:
                # Standup meeting substeps
                default_substeps = {
                    "Review yesterday's accomplishments": ["List individual achievements", "Review team progress", "Discuss completed tasks", "Share metrics and results"],
                    "Discuss today's priorities": ["Outline key objectives", "Prioritize tasks", "Allocate resources", "Set expectations"],
                    "Identify any blockers": ["Technical issues", "Resource constraints", "Dependencies", "Process bottlenecks"],
                    "Assign action items": ["Delegate tasks", "Set deadlines", "Define deliverables", "Schedule follow-ups"]
                }
                default_substeps_map.update(default_substeps)
            elif "review" in event_title:
                # Review meeting substeps
                default_substeps = {
                    "Present work completed": ["Prepare demonstrations", "Collect metrics", "Create visual summaries", "Outline achievements"],
                    "Gather feedback": ["Stakeholder input", "User feedback", "Team perspectives", "External opinions"],
                    "Identify areas for improvement": ["Technical debt", "Process inefficiencies", "Quality issues", "Performance bottlenecks"],
                    "Plan next iteration": ["Define priorities", "Resource allocation", "Timeline adjustments", "Risk management"],
                    "Document decisions": ["Meeting notes", "Action items", "Responsibility assignments", "Follow-up schedule"]
                }
                default_substeps_map.update(default_substeps)
            elif "planning" in event_title:
                # Planning meeting substeps
                default_substeps = {
                    "Define objectives": ["Business goals", "Project milestones", "Success metrics", "Expected outcomes"],
                    "Identify requirements": ["User needs", "Technical constraints", "Dependencies", "Acceptance criteria"],
                    "Break down tasks": ["Component identification", "Work packages", "Effort estimation", "Prioritization"],
                    "Assign responsibilities": ["Team allocation", "Role definition", "Accountability matrix", "Skill matching"],
                    "Set timeline": ["Milestone dates", "Deliverable schedule", "Buffer allocation", "Critical path analysis"],
                    "Define success criteria": ["Quantitative metrics", "Qualitative indicators", "Evaluation process", "Stakeholder approval"]
                }
                default_substeps_map.update(default_substeps)
            else:
                # Generic meeting substeps
                default_substeps = {
                    "Prepare agenda": ["Outline key topics", "Set time allocations", "Define objectives", "Share ahead of time"],
                    "Send meeting invites": ["Include necessary participants", "Provide context", "Attach relevant documents", "Confirm attendance"],
                    "Conduct meeting": ["Introduction and objectives", "Topic discussions", "Decision making", "Summarize key points"],
                    "Document outcomes": ["Meeting minutes", "Decision logs", "Action items", "Supporting materials"],
                    "Follow up on action items": ["Assign responsibilities", "Set deadlines", "Create tracking mechanism", "Schedule check-ins"]
                }
                default_substeps_map.update(default_substeps)

            # Add more generic substeps for common step types
            common_substeps = {
                "Planning": ["Determine scope", "Identify resources", "Create timeline", "Assess risks"],
                "Implementation": ["Setup environment", "Create components", "Integration", "Testing"],
                "Testing": ["Create test cases", "Run tests", "Document results", "Fix issues"],
                "Review": ["Gather feedback", "Identify issues", "Document findings", "Plan improvements"]
            }
            default_substeps_map.update(common_substeps)

            substeps_added = 0

            for step in steps:
                # Check if step already has substeps
                substeps_count = db.query(SubStep).filter(SubStep.step_id == step.id).count()
                if substeps_count == 0:
                    logger.info(f"Generating substeps for step: '{step.content}'")
                    substep_contents = []

                    # Try to find matching default substeps
                    for key, substeps in default_substeps_map.items():
                        if step.content and (key.lower() in step.content.lower() or step.content.lower() in key.lower()):
                            substep_contents = substeps
                            break

                    # If no matching default substeps, generate them
                    if not substep_contents and should_have_substeps(step.content or ""):
                        substep_contents = generate_substeps_for_step(step.content or "")

                    # Create the substeps
                    if substep_contents:
                        for i, content in enumerate(substep_contents):
                            substep = SubStep(
                                id=str(uuid.uuid4()),
                                content=content,
                                completed=step.completed,  # Match parent step's completion
                                order=i + 1,
                                step_id=step.id
                            )
                            db.add(substep)
                            substeps_added += 1
                        logger.info(f"Added {len(substep_contents)} substeps to step '{step.content}'")

            db.commit()
            logger.info(f"Successfully added {substeps_added} total substeps across {len(steps)} steps")
            return True

        except Exception as e:
            logger.error(f"Error generating substeps for event {event_id}: {str(e)}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error generating substeps: {str(e)}"
            )
