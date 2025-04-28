"""
Base service class that provides common functionality for all services.
"""

import logging
from typing import List, Optional, Type, TypeVar

from sqlalchemy.orm import Session

# Type variable for generic entity
T = TypeVar("T")


class BaseService:
    """Base service class with common database operations."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db
        self.logger = logging.getLogger(self.__class__.__name__)

    def get_by_id(self, model_class: Type[T], entity_id: str) -> Optional[T]:
        """
        Get an entity by its ID.

        Args:
            model_class: The model class
            entity_id: The entity ID

        Returns:
            The entity if found, None otherwise
        """
        return self.db.query(model_class).filter(model_class.id == entity_id).first()

    def get_all(self, model_class: Type[T], limit: int = 100, offset: int = 0) -> List[T]:
        """
        Get all entities of a given type.

        Args:
            model_class: The model class
            limit: Maximum number of entities to return
            offset: Offset for pagination

        Returns:
            List of entities
        """
        return self.db.query(model_class).limit(limit).offset(offset).all()

    def create(self, entity: T) -> T:
        """
        Create a new entity.

        Args:
            entity: The entity to create

        Returns:
            The created entity
        """
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: T) -> T:
        """
        Update an entity.

        Args:
            entity: The entity to update

        Returns:
            The updated entity
        """
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity: T) -> bool:
        """
        Delete an entity.

        Args:
            entity: The entity to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            self.db.delete(entity)
            self.db.commit()
            return True
        except Exception as e:
            self.logger.error(f"Error deleting entity: {e}")
            self.db.rollback()
            return False
