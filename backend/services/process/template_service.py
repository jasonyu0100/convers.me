"""
Template service module for handling process template operations.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from db.models import Process, Step, SubStep
from services.common.base_service import BaseService
from services.process.process_service import ProcessService


class TemplateService(BaseService):
    """Service for handling process template operations."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        super().__init__(db)
        self.process_service = ProcessService(db)

    def get_templates(self, user_id: Optional[str] = None, category: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Process]:
        """
        Get process templates.

        Args:
            user_id: Optional filter by creator user ID
            category: Optional filter by category
            limit: Maximum number of templates to return
            offset: Offset for pagination

        Returns:
            List[Process]: List of process templates
        """
        query = self.db.query(Process).filter(Process.is_template == True)

        if user_id:
            query = query.filter(Process.created_by_id == user_id)

        if category:
            query = query.filter(Process.category == category)

        return query.order_by(Process.title).limit(limit).offset(offset).all()

    def get_template_by_id(self, template_id: str) -> Optional[Process]:
        """
        Get a template by ID.

        Args:
            template_id: The template ID

        Returns:
            Process: The template if found, None otherwise
        """
        return self.db.query(Process).filter(Process.id == template_id, Process.is_template == True).first()

    def create_template(
        self,
        user_id: str,
        title: str,
        description: str = "",
        color: str = "blue",
        category: str = "",
        steps: List[Dict[str, Any]] = None,
        metadata: Dict[str, Any] = None,
    ) -> Process:
        """
        Create a new process template.

        Args:
            user_id: ID of the user creating the template
            title: Template title
            description: Template description
            color: Template color
            category: Template category
            steps: List of step data for initial steps
            metadata: Additional metadata

        Returns:
            Process: The created template
        """
        # Use process service but mark as template
        template = self.process_service.create_process(
            user_id=user_id, title=title, description=description, color=color, category=category, steps=steps, metadata=metadata
        )

        # Mark as template
        template.is_template = True
        self.db.commit()
        return template

    def create_process_from_template(self, template_id: str, user_id: str, title: Optional[str] = None, description: Optional[str] = None) -> Optional[Process]:
        """
        Create a new process from a template.

        Args:
            template_id: ID of the template to use
            user_id: ID of the user creating the process
            title: Optional custom title (otherwise uses template title)
            description: Optional custom description (otherwise uses template description)

        Returns:
            Process: The created process if successful, None otherwise
        """
        template = self.get_template_by_id(template_id)
        if not template:
            return None

        # Use provided title/description or fall back to template's
        process_title = title or f"{template.title} (Copy)"
        process_description = description or template.description

        # Create new process
        new_process = Process(
            id=str(uuid.uuid4()),
            title=process_title,
            description=process_description,
            color=template.color,
            last_updated=datetime.utcnow().isoformat(),
            favorite=False,
            category=template.category,
            created_by_id=user_id,
            directory_id=template.directory_id,
            process_metadata=template.process_metadata.copy() if template.process_metadata else {},
            is_template=False,
            template_id=template.id,  # Reference back to the template
        )

        self.db.add(new_process)
        self.db.flush()

        # Copy steps
        for template_step in sorted(template.steps, key=lambda s: s.order):
            step = Step(
                id=str(uuid.uuid4()),
                content=template_step.content,
                completed=False,  # Always start uncompleted
                order=template_step.order,
                due_date=None,  # Don't copy due dates
                process_id=new_process.id,
            )
            self.db.add(step)
            self.db.flush()

            # Copy sub-steps
            for template_sub_step in sorted(template_step.sub_steps, key=lambda s: s.order):
                sub_step = SubStep(
                    id=str(uuid.uuid4()),
                    content=template_sub_step.content,
                    completed=False,  # Always start uncompleted
                    order=template_sub_step.order,
                    step_id=step.id,
                )
                self.db.add(sub_step)

        self.db.commit()
        self.db.refresh(new_process)
        return new_process
