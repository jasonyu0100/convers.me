"""
Guest user service module for handling guest user creation and initialization.
"""

import os
import random
import string
import uuid
from datetime import datetime, timedelta
from typing import List, Tuple

from sqlalchemy.orm import Session

from api.schemas.auth import SchemaGuestLogin as GuestLogin
from api.schemas.users import SchemaUserCreate as UserCreate
from api.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, get_password_hash
from db.models import Event, EventStatusEnum, Media, MediaTypeEnum, ParticipantStatusEnum, Post, Process, User
from services.common.base_service import BaseService
from services.guest_initialization.event_helper import EventHelpers
from services.guest_initialization.service import GuestInitializationService
from services.user_initialization.initializer_service import InitializerService


class GuestUserService(BaseService):
    """Service for handling guest user-related operations."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        super().__init__(db)
        self.initializer_service = InitializerService(db)

    def create_guest_user(self, user_data: UserCreate) -> User:
        """
        Create a new guest user with role-specific demo content.

        Args:
            user_data: The user data to create

        Returns:
            User: The created guest user

        Raises:
            ValueError: If the email or handle already exists
        """
        # Check if email already exists
        if self.db.query(User).filter(User.email == user_data.email).first():
            raise ValueError("Email already registered")

        # Check if handle already exists
        if self.db.query(User).filter(User.handle == user_data.handle).first():
            raise ValueError("Handle already taken")

        # Create hashed password
        hashed_password = get_password_hash(user_data.password)

        # Set default profile image if not provided
        profile_image = user_data.profile_image
        if not profile_image:
            profile_image = "/profile/profile.jpg"

        # Prepare metadata for guest account
        user_metadata = {"is_guest": True, "guest_role": user_data.guest_role, "created_at": str(datetime.now())}

        # Create the user
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

        # Initialize demo content for the guest user
        if user_data.guest_role:
            try:
                # Use the initializer service to set up the guest environment
                # Note: We're handling this synchronously since create_guest_user isn't async
                # The method will schedule the async task through a background worker
                import asyncio

                loop = asyncio.new_event_loop()
                success = loop.run_until_complete(self.initializer_service.initialize_guest_environment(new_user))
                loop.close()

                if success:
                    self.logger.info(f"Created demo content for guest user with role: {user_data.guest_role}")
                else:
                    self.logger.warning(f"Failed to create demo content for guest user with role: {user_data.guest_role}")
            except Exception as e:
                self.logger.error(f"Error creating demo data for guest user: {e}")
                import traceback

                self.logger.error(traceback.format_exc())
                # Don't fail account creation if demo data fails

        return new_user

    async def guest_login(self, guest_data: GuestLogin) -> Tuple[User, str, str]:
        """
        Create a guest account with the specified role and return login credentials.

        Args:
            guest_data: The guest login data containing the role

        Returns:
            Tuple[User, str, str]: The guest user, access token, and password

        Raises:
            ValueError: If guest login is not allowed or role is invalid
        """
        try:
            # Only allow in development mode
            if os.environ.get("DEBUG", "False").lower() != "true":
                raise ValueError("Guest login is only available in development mode")

            # Validate role
            role = guest_data.role.lower()
            valid_roles = ["dev", "pm", "designer", "ops", "intern", "leadership"]
            if role not in valid_roles:
                raise ValueError(f"Invalid role. Must be one of: {', '.join(valid_roles)}")

            # Map frontend roles to backend roles if needed
            role_mapping = {
                "pm": "pm",
                "designer": "designer",
                "dev": "dev",
                "ops": "ops",
                "intern": "intern",
                "leadership": "leadership",
            }
            backend_role = role_mapping.get(role, role)

            # Generate random identifier (3 digits)
            random_id = "".join(random.choices(string.digits, k=3))

            # Create user email, handle, and profile info based on role
            email = f"{role}{random_id}@convers.me"
            password = "guest123"  # Simple password for guest accounts

            # Check if email already exists
            existing_user = self.db.query(User).filter(User.email == email).first()
            if existing_user:
                # If exists, use a different random ID
                for _ in range(10):  # Try up to 10 times
                    random_id = "".join(random.choices(string.digits, k=3))
                    email = f"{role}{random_id}@convers.me"
                    existing_user = self.db.query(User).filter(User.email == email).first()
                    if not existing_user:
                        break

                # If we still have a conflict after 10 attempts, raise error
                if existing_user:
                    raise ValueError("Failed to create unique guest account, please try again")

            # Role-specific information
            role_info = {
                "dev": {
                    "name": f"Guest Developer {random_id}",
                    "bio": "Guest Software Engineer account for exploring the platform",
                    "profile_image": "/profile/profile-picture-1.jpg",
                },
                "pm": {
                    "name": f"Guest Product Manager {random_id}",
                    "bio": "Guest Product Manager account for exploring the platform",
                    "profile_image": "/profile/profile-picture-2.jpg",
                },
                "designer": {
                    "name": f"Guest Designer {random_id}",
                    "bio": "Guest Designer account for exploring the platform",
                    "profile_image": "/profile/profile-picture-3.jpg",
                },
                "ops": {
                    "name": f"Guest Operations {random_id}",
                    "bio": "Guest Operations account for exploring the platform",
                    "profile_image": "/profile/profile-picture-4.jpg",
                },
                "intern": {
                    "name": f"Guest Intern {random_id}",
                    "bio": "Guest Intern account for exploring the platform",
                    "profile_image": "/profile/profile-picture-5.jpg",
                },
                "leadership": {
                    "name": f"Guest Leadership {random_id}",
                    "bio": "Guest Leadership account for strategic planning and team management",
                    "profile_image": "/profile/profile-picture-6.jpg",
                },
            }

            # Now check for handle uniqueness
            guest_handle = f"guest_{role}{random_id}"
            existing_handle = self.db.query(User).filter(User.handle == guest_handle).first()

            if existing_handle:
                # If handle exists, generate a new one
                for _ in range(10):  # Try up to 10 times
                    random_id = "".join(random.choices(string.digits, k=3))
                    guest_handle = f"guest_{role}{random_id}"
                    email = f"{role}{random_id}@convers.me"

                    # Check both email and handle
                    existing_email = self.db.query(User).filter(User.email == email).first()
                    existing_handle = self.db.query(User).filter(User.handle == guest_handle).first()

                    if not existing_email and not existing_handle:
                        break

                # If we still have conflicts, use timestamp for uniqueness
                if existing_email or existing_handle:
                    timestamp = int(datetime.utcnow().timestamp())
                    random_id = str(timestamp % 1000)
                    guest_handle = f"guest_{role}{random_id}"
                    email = f"{role}{random_id}@convers.me"

            # Create user in database
            hashed_password = get_password_hash(password)
            guest_user = User(
                id=uuid.uuid4(),
                email=email,
                name=role_info[role]["name"],
                handle=guest_handle,
                bio=role_info[role]["bio"],
                profile_image=role_info[role]["profile_image"],
                password_hash=hashed_password,
                user_metadata={
                    "is_guest": True,
                    "created_at": str(datetime.utcnow()),
                    "guest_role": backend_role,  # Add role to metadata for directory initialization
                    "role": role_info[role]["name"].split()[1],  # Add display role
                },
            )

            self.db.add(guest_user)
            try:
                self.db.commit()
                self.db.refresh(guest_user)
                self.logger.info(f"Successfully created guest user: {guest_user.email} ({guest_user.name})")
            except Exception as e:
                self.logger.error(f"Error committing guest user to database: {e}")
                # Re-raise the exception since we need the user to be created
                raise ValueError("Failed to create guest user account. Please try again.")

            # Now that we have the user, let's create content
            try:
                # Initialize role-specific directories for the guest user
                self.logger.info(f"Initializing guest environment for user {guest_user.id}")
                data_init_service = GuestInitializationService(self.db)
                await data_init_service.initialize_guest_environment(guest_user)
                self.logger.info(f"Successfully initialized guest environment for user {guest_user.id}")

                # Try to create additional sample content, but don't fail login if it fails
                try:
                    self.logger.info(f"Creating sample content for guest user {guest_user.id}")
                    await self._create_sample_content(guest_user, role)
                    self.logger.info(f"Successfully created sample content for guest user {guest_user.id}")
                except Exception as e:
                    self.logger.error(f"Error creating sample content for guest user: {e}", exc_info=True)
                    # Don't fail account creation if sample content creation fails
                    # Just log the error and continue
            except Exception as e:
                self.logger.error(f"Error initializing guest environment: {e}", exc_info=True)
                # We'll still continue and return the user even if initialization fails
                # This is important to ensure users can still log in

            # Create access token
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(data={"sub": guest_user.email}, expires_delta=access_token_expires)
            self.logger.info(f"Generated access token for guest user {guest_user.id}")

            return guest_user, access_token, password

        except ValueError:
            # Re-raise validation errors directly
            raise
        except Exception as e:
            # For all other unexpected errors, log and convert to a user-friendly message
            self.logger.error(f"Unexpected error in guest_login: {e}", exc_info=True)
            raise ValueError("An unexpected error occurred while creating guest account. Please try again.")

    async def _create_sample_content(self, guest_user: User, role: str) -> None:
        """
        Create sample content for a guest user.

        Args:
            guest_user: The guest user to create content for
            role: The role of the guest user
        """
        # Role-specific topics
        role_topics = {
            "dev": ["Frontend", "Backend", "API", "Testing"],
            "pm": ["Feature", "Planning", "User Research", "Requirements"],
            "designer": ["UI/UX", "Design System", "Prototyping", "User Testing"],
            "ops": ["DevOps", "CI/CD", "Infrastructure", "Monitoring"],
            "intern": ["Learning", "Documentation", "Support", "Testing"],
            "leadership": ["Strategy", "Team Building", "Performance", "Planning"],
        }

        # Get relevant topics for the role
        topics = role_topics.get(role, ["Development", "Planning"])

        # Create 4 team members with complementary roles
        sample_users = await self._create_sample_team_members(guest_user, role)

        # Create posts
        await self._create_sample_posts(guest_user, sample_users, role, topics)

        # Create events
        try:
            self.logger.info("Creating sample events for guest user")
            await self._create_sample_events(guest_user, sample_users, role, topics)
        except Exception as e:
            self.logger.error(f"Failed to create sample events: {str(e)}")
            # Continue with other content creation

        self.db.commit()
        self.logger.info(f"Created demo content for guest user with role: {role}")

    async def _create_sample_team_members(self, guest_user: User, role: str) -> List[User]:
        """
        Create sample team members for the guest user.

        Args:
            guest_user: The guest user
            role: The role of the guest user

        Returns:
            List[User]: The created sample users
        """
        sample_users = []

        # Create 4 team members with complementary roles
        team_roles = {
            "dev": ["pm", "designer", "ops", "intern"],
            "pm": ["dev", "designer", "leadership", "intern"],
            "designer": ["dev", "pm", "intern", "leadership"],
            "ops": ["dev", "pm", "intern", "leadership"],
            "intern": ["dev", "pm", "designer", "leadership"],
            "leadership": ["dev", "pm", "designer", "ops"],
        }

        team_member_roles = team_roles.get(role, ["dev", "pm", "designer", "leadership"])

        for i, team_role in enumerate(team_member_roles):
            # Generate random name based on role
            first_names = ["Alex", "Sam", "Jamie", "Jordan", "Taylor", "Morgan", "Casey", "Riley"]
            last_names = ["Smith", "Jones", "Lee", "Garcia", "Brown", "Davis", "Wilson", "Miller"]

            user_name = f"{random.choice(first_names)} {random.choice(last_names)}"

            # Create profile image path
            profile_idx = i % 7 + 1
            profile_image = f"/profile/profile-picture-{profile_idx}.jpg"

            # Generate a unique handle and email for the user
            user_handle, user_email = self._generate_unique_handle_email(team_role)

            team_user = User(
                id=uuid.uuid4(),
                name=user_name,
                handle=user_handle,
                email=user_email,
                profile_image=profile_image,
                bio=f"{team_role.capitalize()} specialist with expertise in various areas",
                password_hash=get_password_hash("password123"),
                user_metadata={
                    "isOnline": random.choice([True, False]),
                    "role": f"{team_role.capitalize()} Specialist",
                },
            )
            self.db.add(team_user)
            self.db.flush()
            sample_users.append(team_user)

        return sample_users

    def _generate_unique_handle_email(self, role_prefix: str) -> Tuple[str, str]:
        """
        Generate a unique handle and email for a user.

        Args:
            role_prefix: The role prefix for the handle and email

        Returns:
            Tuple[str, str]: The unique handle and email
        """
        # Try with a random suffix first
        handle_suffix = random.randint(100, 999)
        handle = f"{role_prefix}{handle_suffix}"
        email = f"{role_prefix}{handle_suffix}@convers.me"

        # Check if either handle or email exists
        existing_handle = self.db.query(User).filter(User.handle == handle).first()
        existing_email = self.db.query(User).filter(User.email == email).first()

        # If either one exists, keep trying with different numbers
        attempts = 0
        while (existing_handle or existing_email) and attempts < 20:
            handle_suffix = random.randint(100, 999)
            handle = f"{role_prefix}{handle_suffix}"
            email = f"{role_prefix}{handle_suffix}@convers.me"

            existing_handle = self.db.query(User).filter(User.handle == handle).first()
            existing_email = self.db.query(User).filter(User.email == email).first()
            attempts += 1

        # If we still have conflicts after multiple attempts, use timestamp to ensure uniqueness
        if existing_handle or existing_email:
            timestamp = int(datetime.utcnow().timestamp())
            handle = f"{role_prefix}{timestamp % 1000}"
            email = f"{role_prefix}{timestamp}@convers.me"

        return handle, email

    async def _create_sample_posts(self, guest_user: User, sample_users: List[User], role: str, topics: List[str]) -> None:
        """
        Create sample posts for the guest user and team members.

        Args:
            guest_user: The guest user
            sample_users: The sample team members
            role: The role of the guest user
            topics: The topics relevant to the role
        """
        # Create 3 posts from the guest user
        for i in range(3):
            post_content = ""
            if i == 0:
                post_content = f"Just joined as a {role}! Looking forward to collaborating with everyone."
            elif i == 1:
                post_content = f"Working on a new {topics[i % len(topics)]} project today. Making good progress!"
            else:
                post_content = f"Looking for feedback on our approach to {topics[i % len(topics)]}. Any thoughts?"

            # Create post
            new_post = Post(content=post_content, visibility="public", author_id=guest_user.id, event_id=None)
            self.db.add(new_post)

        # Create posts from the team members
        team_post_templates = [
            "Just finished the {} update for our project. What do you think @{}?",
            "Working on the {} implementation today. Need some input from the {} team.",
            "Had a great meeting about our {} strategy. Excited about the next steps!",
            "Looking for feedback on our approach to {}. Anyone have experience with this?",
            "Just pushed the latest {} changes to the repo. Ready for review!",
            "Struggling with a {} issue. Any experts available for a quick chat?",
        ]

        # Create a few posts from each team member (1-2 posts each)
        for user in sample_users:
            for _ in range(random.randint(1, 2)):
                user_role = user.user_metadata.get("role", "").lower().split()[0]
                user_topics = role_topics = {
                    "dev": ["Frontend", "Backend", "API", "Testing"],
                    "pm": ["Feature", "Planning", "User Research", "Requirements"],
                    "designer": ["UI/UX", "Design System", "Prototyping", "User Testing"],
                    "ops": ["DevOps", "CI/CD", "Infrastructure", "Monitoring"],
                    "intern": ["Learning", "Documentation", "Support", "Testing"],
                    "leadership": ["Strategy", "Team Building", "Performance", "Planning"],
                }.get(user_role, ["Development", "Planning"])

                # Pick a random template and topic
                template = random.choice(team_post_templates)
                topic = random.choice(user_topics)

                # Add guest handle mention in some posts
                if "@{}" in template:
                    post_content = template.format(topic, guest_user.handle)
                elif "{}" in template and "{} team" in template:
                    # Handle templates with two placeholders for topic
                    post_content = template.format(topic, user_role)
                else:
                    post_content = template.format(topic)

                # Create post
                new_post = Post(content=post_content, visibility="public", author_id=user.id, event_id=None)
                self.db.add(new_post)

                # Add media to some posts (1 in 3 chance)
                if random.random() < 0.33:
                    self.db.flush()
                    await self._add_media_to_post(new_post, user, topic, user_role)

        # Create 1 media post with appropriate content for the guest role
        media_post_content = f"Here's a preview of what I've been working on for the {topics[0]} project:"
        media_post = Post(content=media_post_content, visibility="public", author_id=guest_user.id)
        self.db.add(media_post)
        self.db.flush()

        # Add media to the post based on role
        media_type = MediaTypeEnum.IMAGE
        media_url = f"/image/stock-image-{(ord(role[0]) % 4) + 1}.jpg"
        media_title = f"{role.capitalize()} Project Preview"

        new_media = Media(
            type=media_type,
            title=media_title,
            url=media_url,
            aspect_ratio="16/9",
            post_id=media_post.id,
            created_by_id=guest_user.id,
            media_metadata={"category": f"{role.capitalize()} Work", "aspectRatio": "16/9"},
        )
        self.db.add(new_media)

    async def _add_media_to_post(self, post: Post, user: User, topic: str, user_role: str) -> None:
        """
        Add media to a post.

        Args:
            post: The post to add media to
            user: The post author
            topic: The topic of the post
            user_role: The role of the user
        """
        # Determine media type
        media_choices = [MediaTypeEnum.IMAGE, MediaTypeEnum.VIDEO, MediaTypeEnum.AUDIO]
        # 70% image, 20% video, 10% audio
        weights = [0.7, 0.2, 0.1]
        selected_media_type = random.choices(media_choices, weights=weights)[0]

        # Generate appropriate URL
        if selected_media_type == MediaTypeEnum.IMAGE:
            media_url = f"/image/stock-image-{random.randint(1, 4)}.jpg"
            aspect_ratio = random.choice(["16/9", "1/1"])
            media_title = f"{topic} Visual"
        elif selected_media_type == MediaTypeEnum.VIDEO:
            media_url = f"/video/stock-video-{random.randint(1, 4)}.mp4"
            aspect_ratio = "16/9"
            media_title = f"{topic} Demo"
        else:  # Audio
            media_url = f"/audio/stock-audio-{random.randint(1, 4)}.mp3"
            aspect_ratio = None
            media_title = f"{topic} Discussion"

        # Create media
        media = Media(
            type=selected_media_type,
            title=media_title,
            url=media_url,
            aspect_ratio=aspect_ratio,
            duration="3:42" if selected_media_type in [MediaTypeEnum.VIDEO, MediaTypeEnum.AUDIO] else None,
            post_id=post.id,
            created_by_id=user.id,
            media_metadata={
                "category": f"{user_role.capitalize()} Work",
                "aspectRatio": aspect_ratio or "square",
            },
        )
        self.db.add(media)

    async def _create_sample_events(self, guest_user: User, sample_users: List[User], role: str, topics: List[str]) -> None:
        """
        Create sample events for the guest user.

        Args:
            guest_user: The guest user
            sample_users: The sample team members
            role: The role of the guest user
            topics: The topics relevant to the role
        """
        try:
            self.logger.info("Creating sample events for guest user...")

            # Create one upcoming event for this user
            tomorrow = datetime.utcnow() + timedelta(days=1)
            event_date_str = tomorrow.strftime("%Y-%m-%d")
            event_time = "09:00"
            event_duration = "30min"

            # Use the helper to create start and end times with extended logging
            self.logger.info(f"Creating event datetimes for event 1 with params: date={event_date_str}, time={event_time}, duration={event_duration}")
            event_start_datetime, event_end_datetime = EventHelpers.create_event_datetime(
                event_date_str, event_time, event_duration
            )

            # Verify we got valid datetimes before proceeding
            if not isinstance(event_start_datetime, datetime) or not isinstance(event_end_datetime, datetime):
                self.logger.error(f"Invalid datetime objects received: start={type(event_start_datetime)}, end={type(event_end_datetime)}")
                # Fallback to current time
                event_start_datetime = datetime.utcnow()
                event_end_datetime = event_start_datetime + timedelta(minutes=30)

            self.logger.info(f"Created event datetimes: start={event_start_datetime}, end={event_end_datetime}")

            # Use helper to create standardized metadata
            event_metadata = EventHelpers.create_event_metadata(
                complexity=2,
                category="Work",
                tags=topics[:2]
            )

            # Create the event with explicit datetime values
            event = Event(
                title=f"{role.capitalize()} Team Meeting",
                description=f"Regular team sync to discuss {topics[0]} and {topics[1]} progress",
                date=event_date_str,
                time=event_time,
                duration=event_duration,
                start_time=event_start_datetime,
                end_time=event_end_datetime,
                status=EventStatusEnum.PENDING,
                complexity=2,
                color=EventHelpers.get_event_color(2),  # Use helper for color
                location=EventHelpers.get_event_location(2),  # Use helper for location
                created_by_id=guest_user.id,
                event_metadata=event_metadata,
            )

            # Double-check that start_time and end_time are set before adding to db
            if not event.start_time or not event.end_time:
                self.logger.error(f"Event has NULL datetime fields after creation: start_time={event.start_time}, end_time={event.end_time}")
                # Set fallback values directly on the event object
                event.start_time = datetime.utcnow()
                event.end_time = event.start_time + timedelta(minutes=30)
                self.logger.info(f"Set fallback datetime values: start_time={event.start_time}, end_time={event.end_time}")

            self.db.add(event)
            try:
                self.db.flush()
                self.logger.info(f"Successfully created first event with id={event.id}")
            except Exception as e:
                self.logger.error(f"Failed to add first event to database: {e}")
                # Continue with the rest of the function - don't let one failed event stop everything
                return

            # Add the guest as participant
            EventHelpers.add_event_participant(
                event=event,
                user=guest_user,
                role="Host",
                status=ParticipantStatusEnum.CONFIRMED,
                db=self.db
            )

            # Create past/completed event
            yesterday = datetime.utcnow() - timedelta(days=1)
            event_date_str = yesterday.strftime("%Y-%m-%d")
            event_time = "14:00"
            event_duration = "60min"

            # Use the helper to create start and end times with error handling
            try:
                event_start_datetime, event_end_datetime = EventHelpers.create_event_datetime(
                    event_date_str, event_time, event_duration
                )

                # Verify datetime objects
                if not isinstance(event_start_datetime, datetime) or not isinstance(event_end_datetime, datetime):
                    raise ValueError(f"Invalid datetime objects: start={type(event_start_datetime)}, end={type(event_end_datetime)}")
            except Exception as e:
                self.logger.error(f"Error creating datetime for past event: {e}")
                # Fallback to yesterday's date manually
                event_start_datetime = yesterday.replace(hour=14, minute=0, second=0, microsecond=0)
                event_end_datetime = event_start_datetime + timedelta(minutes=60)

            self.logger.info(f"Past event datetimes: start={event_start_datetime}, end={event_end_datetime}")

            # Use helper to create standardized metadata
            past_event_metadata = EventHelpers.create_event_metadata(
                complexity=3,
                category="Work",
                tags=[topics[0], "Planning"]
            )

            past_event = Event(
                title=f"{topics[0]} Planning Session",
                description=f"Initial planning for the {topics[0]} project",
                date=event_date_str,
                time=event_time,
                duration=event_duration,
                start_time=event_start_datetime,
                end_time=event_end_datetime,
                status=EventStatusEnum.DONE,
                complexity=3,
                color=EventHelpers.get_event_color(3),  # Use helper for color
                location=EventHelpers.get_event_location(3),  # Use helper for location
                created_by_id=sample_users[0].id,
                event_metadata=past_event_metadata,
            )

            # Double-check datetime fields
            if not past_event.start_time or not past_event.end_time:
                self.logger.error(f"Past event has NULL datetime fields: start_time={past_event.start_time}, end_time={past_event.end_time}")
                past_event.start_time = event_start_datetime
                past_event.end_time = event_end_datetime

            self.db.add(past_event)
            try:
                self.db.flush()
                self.logger.info(f"Successfully created past event with id={past_event.id}")
            except Exception as e:
                self.logger.error(f"Failed to add past event to database: {e}")
                # Continue with the rest of the function
                return

            # Add the first sample user as host
            EventHelpers.add_event_participant(
                event=past_event,
                user=sample_users[0],
                role="Host",
                status=ParticipantStatusEnum.CONFIRMED,
                db=self.db
            )

            # Add the guest as participant
            EventHelpers.add_event_participant(
                event=past_event,
                user=guest_user,
                role="Participant",
                status=ParticipantStatusEnum.CONFIRMED,
                db=self.db
            )

            # Create events using template processes if any are available
            await self._create_template_events(guest_user, sample_users, role, topics)

            self.logger.info("Finished creating sample events for guest user")

        except Exception as e:
            self.logger.error(f"Unexpected error in _create_sample_events: {e}", exc_info=True)
            # Don't re-raise the exception - just log it and continue

    async def _create_template_events(self, guest_user: User, sample_users: List[User], role: str, topics: List[str]) -> None:
        """
        Create events from template processes.

        Args:
            guest_user: The guest user
            sample_users: The sample team members
            role: The role of the guest user
            topics: The topics relevant to the role
        """
        try:
            # First check if any template processes exist
            template_processes = self.db.query(Process).filter(Process.is_template == True).all()
            if template_processes:
                self.logger.info(f"Found {len(template_processes)} template processes for guest user events")

                # Use up to 3 templates to create events for this guest
                for i, template in enumerate(template_processes[:3]):
                    try:
                        # Create process instance from the template using helper method
                        process_instance = EventHelpers.create_process_from_template(
                            template_process=template,
                            user=guest_user,
                            db=self.db
                        )

                        if not process_instance:
                            self.logger.warning(f"Failed to create process instance from template {template.id}")
                            continue

                        # Update the process title to be more specific for this guest role
                        process_instance.title = f"{template.title} for {role.capitalize()} {topics[i % len(topics)]}"
                        process_instance.description = f"Instance of {template.title} template customized for {role}"

                        # Add guest-specific customization metadata
                        if not process_instance.process_metadata:
                            process_instance.process_metadata = {}
                        process_instance.process_metadata["instanceType"] = "guest_demo"
                        process_instance.process_metadata["customization"] = f"Created for {role} role demonstration"

                        self.db.add(process_instance)
                        self.db.flush()
                        self.logger.info(f"Created process instance '{process_instance.title}' from template '{template.title}'")

                        # Create an event using this process instance
                        # Each event on a different day
                        event_date = datetime.utcnow() + timedelta(days=i + 1)
                        event_date_str = event_date.strftime("%Y-%m-%d")
                        event_time = f"{10 + i}:00"  # Different time for each event
                        event_duration = "60min"

                        self.logger.info(f"Creating template event with date={event_date_str}, time={event_time}, duration={event_duration}")

                        # Use the helper to create start and end times with error handling
                        try:
                            event_start_datetime, event_end_datetime = EventHelpers.create_event_datetime(
                                event_date_str, event_time, event_duration
                            )

                            # Verify datetime objects
                            if not isinstance(event_start_datetime, datetime) or not isinstance(event_end_datetime, datetime):
                                raise ValueError(f"Invalid datetime objects: start={type(event_start_datetime)}, end={type(event_end_datetime)}")
                        except Exception as e:
                            self.logger.error(f"Error creating datetime for template event: {e}")
                            # Fallback to calculated date manually
                            event_start_datetime = event_date.replace(hour=10+i, minute=0, second=0, microsecond=0)
                            event_end_datetime = event_start_datetime + timedelta(minutes=60)

                        self.logger.info(f"Template event datetimes: start={event_start_datetime}, end={event_end_datetime}")

                        # Randomly select complexity
                        complexity = random.randint(1, 5)

                        # Generate a dynamic title using the helper
                        try:
                            event_title = EventHelpers.generate_meeting_title(
                                process=process_instance,
                                meeting_date=event_date,
                                complexity=complexity,
                                role=role
                            )
                        except Exception as e:
                            self.logger.error(f"Error generating meeting title: {e}")
                            # Fallback to a simple title
                            event_title = f"{role.capitalize()} Meeting - {topics[i % len(topics)]}"

                        # Use helper to create standardized metadata
                        event_metadata = EventHelpers.create_event_metadata(
                            complexity=complexity,
                            category="Work",
                            tags=topics[:2],
                            template_id=str(template.id)
                        )

                        template_event = Event(
                            title=event_title,
                            description=f"Event created from the {template.title} template process",
                            date=event_date_str,
                            time=event_time,
                            duration=event_duration,
                            start_time=event_start_datetime,
                            end_time=event_end_datetime,
                            status=EventStatusEnum.PENDING,
                            complexity=complexity,
                            color=template.color or EventHelpers.get_event_color(complexity),
                            location=EventHelpers.get_event_location(complexity),
                            created_by_id=guest_user.id,
                            process_id=process_instance.id,  # Link to the process instance
                            event_metadata=event_metadata,
                        )

                        # Double-check datetime fields before adding to db
                        if not template_event.start_time or not template_event.end_time:
                            self.logger.error(f"Template event has NULL datetime fields: start_time={template_event.start_time}, end_time={template_event.end_time}")
                            template_event.start_time = event_start_datetime
                            template_event.end_time = event_end_datetime

                        self.db.add(template_event)
                        try:
                            self.db.flush()
                            self.logger.info(f"Created template event '{template_event.title}' from template process '{template.title}'")
                        except Exception as e:
                            self.logger.error(f"Failed to add template event to database: {e}")
                            # Skip participants and move to next template
                            continue

                        # Add the guest as host participant
                        try:
                            EventHelpers.add_event_participant(
                                event=template_event,
                                user=guest_user,
                                role="Host",
                                status=ParticipantStatusEnum.CONFIRMED,
                                db=self.db
                            )

                            # Add 1-2 team members as participants
                            for team_user in sample_users[:random.randint(1, 2)]:
                                EventHelpers.add_event_participant(
                                    event=template_event,
                                    user=team_user,
                                    role="Participant",
                                    status=ParticipantStatusEnum.CONFIRMED,
                                    db=self.db
                                )
                        except Exception as e:
                            self.logger.error(f"Error adding participants to template event: {e}")
                            # Continue anyway - the event will still exist without participants

                    except Exception as e:
                        self.logger.error(f"Error processing template {template.id}: {e}")
                        # Continue with the next template
                        continue
            else:
                self.logger.info("No template processes found for creating events")

        except Exception as e:
            self.logger.error(f"Unexpected error in _create_template_events: {e}", exc_info=True)
            # Don't re-raise the exception - just log it and continue
