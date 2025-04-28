"""
User service module for handling user-related operations.
"""

import uuid
from typing import Any, Dict, Optional

from api.schemas.users import SchemaUserCreate
from api.security import get_password_hash
from db.models import User, UserPreferences
from services.common.base_service import BaseService


class UserService(BaseService):
    """Service for handling user-related operations."""

    def check_email_exists(self, email: str) -> bool:
        """
        Check if a user with the given email already exists.

        Args:
            email: The email to check

        Returns:
            bool: True if the email exists, False otherwise
        """
        return self.db.query(User).filter(User.email == email).first() is not None

    def check_handle_exists(self, handle: str) -> bool:
        """
        Check if a user with the given handle already exists.

        Args:
            handle: The handle to check

        Returns:
            bool: True if the handle exists, False otherwise
        """
        return self.db.query(User).filter(User.handle == handle).first() is not None

    def create_user(self, user_data: SchemaUserCreate) -> User:
        """
        Create a new non-guest user in the system.

        Args:
            user_data: The user data to create

        Returns:
            User: The created user

        Raises:
            ValueError: If the email or handle already exists
        """
        # Check if email already exists
        if self.check_email_exists(user_data.email):
            raise ValueError("Email already registered")

        # Check if handle already exists
        if self.check_handle_exists(user_data.handle):
            raise ValueError("Handle already taken")

        # Create hashed password
        hashed_password = get_password_hash(user_data.password)

        # Set default profile image if not provided
        profile_image = user_data.profile_image
        if not profile_image:
            profile_image = "/profile/profile.jpg"

        # Prepare user metadata
        user_metadata: Dict[str, Any] = {}

        new_user = User(
            id=uuid.uuid4(),
            email=user_data.email,
            name=user_data.name,
            handle=user_data.handle,
            password_hash=hashed_password,
            bio=user_data.bio,
            profile_image=profile_image,
            user_metadata=user_metadata,
        )

        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)

        self.logger.info(f"Created new user: {new_user.name} ({new_user.email})")
        return new_user

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Get a user by ID.

        Args:
            user_id: The user ID

        Returns:
            User: The user if found, None otherwise
        """
        return self.get_by_id(User, user_id)

    def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get a user by email.

        Args:
            email: The user's email

        Returns:
            User: The user if found, None otherwise
        """
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_handle(self, handle: str) -> Optional[User]:
        """
        Get a user by handle.

        Args:
            handle: The user's handle

        Returns:
            User: The user if found, None otherwise
        """
        return self.db.query(User).filter(User.handle == handle).first()

    def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Optional[User]:
        """
        Update a user's information.

        Args:
            user_id: The user ID
            update_data: Data to update

        Returns:
            User: The updated user if found, None otherwise
        """
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        # Update fields
        for key, value in update_data.items():
            if hasattr(user, key) and key != "id" and key != "password_hash":
                setattr(user, key, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def get_user_preferences(self, user_id: str) -> Optional[UserPreferences]:
        """
        Get user preferences.

        Args:
            user_id: The user ID

        Returns:
            UserPreferences: The user preferences if found, None otherwise
        """
        return self.db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()

    def update_user_preferences(self, user_id: str, preferences_data: Dict[str, Any]) -> Optional[UserPreferences]:
        """
        Update user preferences.

        Args:
            user_id: The user ID
            preferences_data: Preferences data to update

        Returns:
            UserPreferences: The updated preferences if found, None otherwise
        """
        preferences = self.get_user_preferences(user_id)

        if not preferences:
            # Create new preferences if not found
            preferences = UserPreferences(id=uuid.uuid4(), user_id=user_id, **preferences_data)
            self.db.add(preferences)
        else:
            # Update existing preferences
            for key, value in preferences_data.items():
                if hasattr(preferences, key) and key != "id" and key != "user_id":
                    setattr(preferences, key, value)

        self.db.commit()
        self.db.refresh(preferences)
        return preferences
