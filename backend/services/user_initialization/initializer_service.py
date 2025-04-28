"""
Main data initialization service that coordinates all initializers.
"""

from sqlalchemy.orm import Session

from db.models import User
from services.common.base_service import BaseService


class InitializerService(BaseService):
    """Service for initializing the database with sample data."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        super().__init__(db)

        # Import here to avoid circular imports
        from services.guest_initialization.service import GuestInitializationService

        self.data_service = GuestInitializationService(db)

    async def initialize_development(self) -> bool:
        """
        Initialize a complete development environment with sample data.

        Returns:
            bool: Success status
        """
        try:
            return await self.data_service.initialize_development_environment()
        except Exception as e:
            self.logger.error(f"Error initializing development environment: {e}")
            return False

    async def initialize_production(self) -> bool:
        """
        Initialize a minimal production environment with essential data.

        Returns:
            bool: Success status
        """
        try:
            return await self.data_service.initialize_production_environment()
        except Exception as e:
            self.logger.error(f"Error initializing production environment: {e}")
            return False

    async def initialize_guest_environment(self, guest_user: User) -> bool:
        """
        Initialize a development environment for a guest user.
        Associates the demo data with the provided guest user.

        Args:
            guest_user: The guest user to associate data with

        Returns:
            bool: Success status
        """
        try:
            return await self.data_service.initialize_guest_environment(guest_user)
        except Exception as e:
            self.logger.error(f"Error initializing guest environment: {e}")
            return False
