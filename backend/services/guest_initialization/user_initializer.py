"""
User initialization module for sample account creation.
"""

import logging
import uuid
from typing import List

from sqlalchemy.orm import Session

from api.security import get_password_hash
from db.models import User, UserPreferences

# Set up logging
logger = logging.getLogger(__name__)


class UserInitializer:
    """Handles creation of sample users and user preferences."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db

    async def create_admin_user(self) -> User:
        """
        Create an admin user if one doesn't exist.

        Returns:
            User: The admin user
        """
        # Check if admin exists
        admin = self.db.query(User).filter(User.email == "admin@convers.me").first()
        if admin:
            logger.info("Admin user already exists, skipping creation")
            return admin

        # Create admin user
        admin = User(
            id=uuid.uuid4(),
            name="Admin User",
            handle="admin",
            email="admin@convers.me",
            profile_image="/profile/profile-picture-1.jpg",
            bio="System administrator",
            password_hash=get_password_hash("admin1234"),
            user_metadata={"isAdmin": True, "role": "Administrator"},
        )
        self.db.add(admin)
        self.db.commit()
        self.db.refresh(admin)
        logger.info(f"Created admin user: {admin.name} ({admin.email})")
        return admin

    async def create_sample_accounts(self) -> List[User]:
        """
        Create sample accounts for different startup roles.

        Returns:
            List[User]: Created users
        """
        # Sample account data for specific startup roles matching frontend mockUsers
        sample_accounts = [
            {
                "name": "Jason Yu",
                "handle": "jasonyu",
                "email": "jason@convers.me",
                "profile_image": "/profile/profile-picture-1.jpg",
                "bio": "Engineering Lead | Full Stack Developer | Product enthusiast",
                "password": "password123",
                "metadata": {"isOnline": True, "role": "Engineering Lead"},
            },
            {
                "name": "Sarah Johnson",
                "handle": "sarahj",
                "email": "sarah@convers.me",
                "profile_image": "/profile/profile-picture-2.jpg",
                "bio": "Product Manager | User-Focused Design | Agile enthusiast",
                "password": "password123",
                "metadata": {"isOnline": True, "role": "Product Manager"},
            },
            {
                "name": "Michael Chen",
                "handle": "mchen",
                "email": "michael@convers.me",
                "profile_image": "/profile/profile-picture-3.jpg",
                "bio": "Backend Developer | Database Expert | Infrastructure specialist",
                "password": "password123",
                "metadata": {"isOnline": False, "role": "Backend Developer"},
            },
            {
                "name": "Aisha Patel",
                "handle": "aishap",
                "email": "aisha@convers.me",
                "profile_image": "/profile/profile-picture-4.jpg",
                "bio": "UX/UI Designer | Design Systems Expert | User Advocate",
                "password": "password123",
                "metadata": {"isOnline": True, "role": "UX Designer"},
            },
            {
                "name": "Carlos Rodriguez",
                "handle": "carlos",
                "email": "carlos@convers.me",
                "profile_image": "/profile/profile-picture-5.jpg",
                "bio": "DevOps Engineer | Cloud Architecture | CI/CD Pipeline Specialist",
                "password": "password123",
                "metadata": {"isOnline": False, "role": "DevOps Engineer"},
            },
            {
                "name": "Emma Wilson",
                "handle": "emmaw",
                "email": "emma@convers.me",
                "profile_image": "/profile/profile-picture-6.jpg",
                "bio": "Frontend Developer | React Expert | Accessibility Advocate",
                "password": "password123",
                "metadata": {"isOnline": True, "role": "Frontend Developer"},
            },
            {
                "name": "Alex Brown",
                "handle": "alexb",
                "email": "alex@convers.me",
                "profile_image": "/profile/profile-picture-7.jpg",
                "bio": "Product Marketing | Growth Hacking | Content Strategy",
                "password": "password123",
                "metadata": {"isOnline": True, "role": "Marketing Manager"},
            },
        ]

        # Create guest account for demo purposes
        sample_accounts.append(
            {
                "name": "Guest User",
                "handle": "guest",
                "email": "guest@convers.me",
                "profile_image": "/profile/default.svg",
                "bio": "Demo guest account",
                "password": "guest123",
                "metadata": {"isOnline": True, "role": "Guest", "isGuest": True},
            }
        )

        users = []
        for i, account_data in enumerate(sample_accounts):
            # Check if user exists
            existing = self.db.query(User).filter(User.email == account_data["email"]).first()
            if existing:
                users.append(existing)
                continue

            # Create user with proper UUIDs - when deployed, the frontend will receive the proper IDs
            user_id = uuid.uuid4()

            user = User(
                id=user_id,
                name=account_data["name"],
                handle=account_data["handle"],
                email=account_data["email"],
                profile_image=account_data["profile_image"],
                bio=account_data["bio"],
                password_hash=get_password_hash(account_data["password"]),
                user_metadata=account_data.get("metadata", {}),
            )
            self.db.add(user)
            users.append(user)

        self.db.commit()
        for user in users:
            self.db.refresh(user)

        logger.info(f"Created {len(users)} sample accounts")
        return users

    async def create_user_preferences(self, users: List[User]) -> List[UserPreferences]:
        """
        Create user preferences for the provided users.

        Args:
            users: List of users to create preferences for

        Returns:
            List[UserPreferences]: Created preferences
        """
        preferences = []
        for user in users:
            # Check if preferences exist
            existing = self.db.query(UserPreferences).filter(UserPreferences.user_id == user.id).first()
            if existing:
                preferences.append(existing)
                continue

            # Create preferences
            pref = UserPreferences(
                id=uuid.uuid4(),
                user_id=user.id,
                theme="system",  # Default to system theme
                email_notifications=True,
                time_zone="UTC",
                language="en",
                additional_settings={
                    "sidebar_collapsed": False,
                    "default_view": "calendar",
                    "notification_settings": {
                        "event_reminders": True,
                        "mention_alerts": True,
                        "team_updates": True,
                    },
                    "display_preferences": {"dense_mode": False, "show_avatars": True},
                },
            )
            self.db.add(pref)
            preferences.append(pref)

        self.db.commit()
        for pref in preferences:
            self.db.refresh(pref)

        logger.info(f"Created preferences for {len(preferences)} users")
        return preferences
