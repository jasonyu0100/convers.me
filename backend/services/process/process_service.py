"""
Process service module for handling process-related operations.
"""

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from db.models import Process, Step, SubStep
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
    def migrate_all_event_steps_to_processes(db) -> Dict[str, Any]:
        """
        Admin utility to migrate all event steps to processes.
        This fixes the critical architectural issue where steps should be linked to processes, not events.

        Args:
            db: Database session

        Returns:
            Dict with migration statistics
        """
        import uuid
        from datetime import datetime

        from db.models import Event, Process, Step

        try:
            # Find all events that have steps directly attached but no linked process
            events_with_steps = db.query(Event).join(
                Step, Event.id == Step.event_id
            ).filter(
                Event.process_id.is_(None)
            ).distinct().all()

            logger.info(f"Found {len(events_with_steps)} events with steps but no linked process")

            events_processed = 0
            steps_migrated = 0

            # Process each event
            for event in events_with_steps:
                # Create a new process for this event
                new_process = Process(
                    id=str(uuid.uuid4()),
                    title=event.title,
                    description=event.description or f"Process for event: {event.title}",
                    color=event.color or "blue",
                    last_updated=datetime.utcnow().isoformat(),
                    favorite=False,
                    category="event",
                    created_by_id=event.created_by_id,
                    process_metadata={"migrated_from_event": True, "event_id": str(event.id)},
                )
                db.add(new_process)
                db.flush()  # Get ID without committing

                # Update the event to link to this process
                event.process_id = new_process.id

                # Find all steps for this event
                event_steps = db.query(Step).filter(Step.event_id == event.id).all()

                # Migrate steps to the process
                event_steps_count = len(event_steps)
                for step in event_steps:
                    step.process_id = new_process.id
                    step.event_id = None  # Remove event link

                db.commit()

                logger.info(f"Migrated {event_steps_count} steps from event {event.id} to process {new_process.id}")
                events_processed += 1
                steps_migrated += event_steps_count

            return {
                "success": True,
                "events_processed": events_processed,
                "steps_migrated": steps_migrated,
                "message": f"Successfully migrated {steps_migrated} steps from {events_processed} events to new processes"
            }

        except Exception as e:
            logger.error(f"Error migrating event steps to processes: {str(e)}")
            db.rollback()
            return {
                "success": False,
                "error": str(e),
                "message": "Error occurred during migration"
            }

    # The generate_missing_substeps_for_event method has been removed
    # as it's not supported in the current architecture where
    # steps should only be associated with processes, not events
