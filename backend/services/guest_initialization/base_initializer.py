"""
Base initializer class with common functionality for all initializers.
"""

import logging
import traceback
from typing import Any, Dict, List, Optional, TypeVar

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

# Type variable for generic method return types
T = TypeVar("T")


class BaseInitializer:
    """Base class for all data initializers with enhanced error handling and logging."""

    def __init__(self, db: Session):
        """Initialize with database session.

        Args:
            db: SQLAlchemy database session
        """
        self.db = db
        self.logger = logging.getLogger(self.__class__.__name__)

    def commit_with_rollback(self, error_message: str = "Database error") -> bool:
        """Commit changes with automatic rollback and logging on failure.

        Args:
            error_message: Custom error message prefix

        Returns:
            bool: True if commit succeeded, False otherwise
        """
        try:
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.logger.error(f"{error_message}: {e}")
            self.db.rollback()
            return False
        except Exception as e:
            self.logger.error(f"Unexpected error during commit: {e}")
            self.logger.error(traceback.format_exc())
            self.db.rollback()
            return False

    def add_and_flush(self, obj: Any, error_message: str = "Error adding object") -> Optional[Any]:
        """Add an object to the database and flush to get its ID.

        Args:
            obj: The object to add
            error_message: Custom error message prefix

        Returns:
            The added object or None if there was an error
        """
        try:
            self.db.add(obj)
            self.db.flush()
            return obj
        except SQLAlchemyError as e:
            self.logger.error(f"{error_message}: {e}")
            self.db.rollback()
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error adding object: {e}")
            self.logger.error(traceback.format_exc())
            self.db.rollback()
            return None

    def safe_query(self, query_func, error_message: str = "Error executing query") -> Optional[Any]:
        """Execute a query function safely with error handling.

        Args:
            query_func: A callable that executes a database query
            error_message: Custom error message prefix

        Returns:
            Query result or None if there was an error
        """
        try:
            return query_func()
        except SQLAlchemyError as e:
            self.logger.error(f"{error_message}: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error executing query: {e}")
            self.logger.error(traceback.format_exc())
            return None

    def log_creation(self, entity_type: str, count: int) -> None:
        """Log the creation of entities.

        Args:
            entity_type: The type of entity created (e.g., "users", "events")
            count: The number of entities created
        """
        self.logger.info(f"Created {count} {entity_type}")

    def bulk_create(
        self, items: List[Dict[str, Any]], model_class: Any, handle_duplicates: bool = True, identifier_field: str = "id", identifier_value_field: str = "id"
    ) -> List[Any]:
        """
        Efficiently create multiple objects with duplicate detection.

        Args:
            items: List of dictionaries with model data
            model_class: SQLAlchemy model class
            handle_duplicates: Whether to check for duplicates before creation
            identifier_field: Field to use for duplicate detection (e.g. 'id', 'email')
            identifier_value_field: Field in the item dict to get the value from

        Returns:
            List of created objects
        """
        created_objects = []

        # Extract all the identifier values
        if handle_duplicates:
            identifiers = [item.get(identifier_value_field) for item in items if identifier_value_field in item]

            # Query for existing objects with these identifiers
            existing_query = self.db.query(model_class).filter(getattr(model_class, identifier_field).in_(identifiers))

            # Create a set of existing identifiers for fast lookup
            existing_identifiers = {getattr(obj, identifier_field) for obj in existing_query.all()}
        else:
            existing_identifiers = set()

        # Create only non-existing objects
        for item in items:
            item_id = item.get(identifier_value_field)

            # Skip if this item already exists
            if item_id in existing_identifiers:
                # Try to find the existing object
                existing_obj = self.db.query(model_class).filter(getattr(model_class, identifier_field) == item_id).first()

                if existing_obj:
                    created_objects.append(existing_obj)
                    # Don't need to log when using existing entities
                continue

            # Create the new object
            try:
                obj = model_class(**item)
                self.db.add(obj)
                self.db.flush()
                created_objects.append(obj)
            except Exception as e:
                self.logger.error(f"Error creating {model_class.__name__}: {e}")
                self.logger.error(traceback.format_exc())
                continue

        return created_objects
