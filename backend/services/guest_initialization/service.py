"""
Main data initialization service that coordinates all initializers.

This service orchestrates the initialization of all types of data in the application.
It delegates to specialized initializers for each data type and manages the overall
initialization process.

Refactoring Notes:
1. Simplified initialization flow with improved error handling
2. Reduced code duplication by leveraging the BaseInitializer
3. Added support for batch operations for better performance
4. Enhanced coordination between initializers
5. Improved tracking of created entities
"""

import logging
import random
import traceback
from typing import List

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from db.models import Directory, Event, Media, Notification, Post, Process, Topic, User

# Import initializers
from .base_initializer import BaseInitializer
from .content_initializer import ContentInitializer
from .directory_initializer import DirectoryInitializer
from .event_initializer import EventInitializer
from .insight_initializer import InsightInitializer
from .notification_initializer import NotificationInitializer
from .post_initializer import PostInitializer
from .process_initializer import ProcessInitializer
from .report_initializer import ReportInitializer
from .topic_initializer import TopicInitializer
from .user_initializer import UserInitializer

# Set up logging
logger = logging.getLogger(__name__)


class GuestInitializationService(BaseInitializer):
    """Main service for initializing the database with realistic sample data."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        super().__init__(db)

        # Store created entities for reference
        self.users: List[User] = []
        self.topics: List[Topic] = []
        self.directories: List[Directory] = []
        self.processes: List[Process] = []
        self.events: List[Event] = []
        self.posts: List[Post] = []
        self.media: List[Media] = []
        self.notifications: List[Notification] = []

        # Initialize sub-services
        self.user_initializer = UserInitializer(db)
        self.topic_initializer = TopicInitializer(db)
        self.process_initializer = ProcessInitializer(db)
        self.directory_initializer = DirectoryInitializer(db)
        self.event_initializer = EventInitializer(db)
        self.post_initializer = PostInitializer(db)
        self.notification_initializer = NotificationInitializer(db)
        self.content_initializer = ContentInitializer(db)
        self.insight_initializer = InsightInitializer(db)
        self.report_initializer = ReportInitializer(db)

    async def _create_event_relationships(self) -> None:
        """
        Create relationships between events.
        Helper method used by both guest and development environment initialization.
        """
        self.logger.info("Creating related event connections")
        if not self.events or len(self.events) <= 1:
            self.logger.info("Not enough events to create relationships")
            return

        try:
            for event in self.events:
                # Limit each event to 1-3 related events
                max_related = min(3, len(self.events) - 1)
                related_count = random.randint(1, max_related)

                # Only create relations for a subset of events (70%)
                if random.random() < 0.7:
                    # Select other events that might be related
                    other_events = [e for e in self.events if e.id != event.id]

                    # Prioritize events with same process_id if available
                    if event.process_id:
                        process_matches = [e for e in other_events if e.process_id == event.process_id]
                        if process_matches:
                            # Prefer process matches but don't use exclusively
                            other_events = process_matches + [e for e in other_events if e not in process_matches]

                    # Select random related events
                    if other_events:
                        related_events = random.sample(other_events, min(related_count, len(other_events)))
                        for related in related_events:
                            # Add to event_metadata.related_events if not already there
                            if not event.event_metadata:
                                event.event_metadata = {}

                            if "related_events" not in event.event_metadata:
                                event.event_metadata["related_events"] = []

                            if related.id not in event.event_metadata["related_events"]:
                                event.event_metadata["related_events"].append(related.id)

                            # Create bidirectional relationship
                            if not related.event_metadata:
                                related.event_metadata = {}

                            if "related_events" not in related.event_metadata:
                                related.event_metadata["related_events"] = []

                            if event.id not in related.event_metadata["related_events"]:
                                related.event_metadata["related_events"].append(event.id)

            # Commit changes
            self.commit_with_rollback("Error saving event relationships")
            self.logger.info(f"Successfully created relationships for {len(self.events)} events")
        except Exception as e:
            self.logger.error(f"Error creating event relationships: {e}")
            self.logger.error(traceback.format_exc())
            # Don't throw the exception, just log it

    async def initialize_development_environment(self) -> bool:
        """
        Initialize a complete development environment with sample data.

        Returns:
            bool: Success status
        """
        try:
            self.logger.info("Starting development environment initialization")

            # Create sample users with specific roles
            self.logger.info("Creating sample users")
            self.users = await self.user_initializer.create_sample_accounts()

            # Create work-focused topics
            self.logger.info("Creating work topics")
            self.topics = await self.topic_initializer.create_work_topics()

            # Create directories for organizing processes
            self.logger.info("Creating directories")
            self.directories = await self.directory_initializer.create_directories(self.users)

            # Create processes - this is critical for proper event creation
            self.logger.info("Creating processes")
            main_user = self.users[0] if self.users else None

            if main_user:
                # Check if main user already has processes to avoid duplicates
                existing_processes = self.db.query(Process).filter(Process.created_by_id == main_user.id).all()
                if existing_processes:
                    self.logger.info(f"User {main_user.handle} already has {len(existing_processes)} processes. Using existing ones.")
                    self.processes = existing_processes
                else:
                    # Create work processes across multiple directories
                    self.logger.info("Creating new work processes")
                    self.processes = await self.process_initializer.create_work_processes(self.users, self.directories)
                    self.logger.info(f"Created {len(self.processes)} processes")
            else:
                # Create processes with all users if no main user
                self.logger.info("No main user found, creating processes with all users")
                self.processes = await self.process_initializer.create_work_processes(self.users, self.directories)

            # Verify processes were created
            if not self.processes:
                self.logger.warning("No processes were created")

            # Events require processes - ensure we have at least one
            if not self.processes:
                self.logger.warning("No processes available for events - aborting event creation")
                self.events = []
                return False

            # Create events based on processes
            self.logger.info("Creating work events")
            self.events = await self.event_initializer.create_work_events(self.users, self.topics, self.processes)
            self.logger.info(f"Created {len(self.events)} events")

            # Ensure ALL events in the database have processes
            self.logger.info("Ensuring all events have processes assigned")
            await self.event_initializer.ensure_all_events_have_processes(self.users, self.processes)

            # Create event relationships
            await self._create_event_relationships()

            # Create activity feed content
            self.logger.info("Creating feed content")
            self.posts, self.media = await self.post_initializer.create_feed_content(self.users, self.events)

            # Set up user preferences
            self.logger.info("Creating user preferences")
            await self.user_initializer.create_user_preferences(self.users)

            # Create sample notifications
            self.logger.info("Creating notifications")
            self.notifications = await self.notification_initializer.create_sample_notifications(self.users, self.posts, self.events)

            # Cross-reference content
            self.logger.info("Cross-referencing content")
            await self.content_initializer.create_content_relationships(self.users, self.events, self.posts, self.media)

            # Create insights for users based on their roles
            self.logger.info("Creating role-specific insights")
            for user in self.users:
                if user.user_metadata and "role" in user.user_metadata:
                    role_parts = user.user_metadata["role"].lower().split()
                    # Extract role from metadata (like "Engineering Lead" -> "engineering")
                    user_role = role_parts[0] if role_parts else "dev"
                    # Map generic roles to our specific ones
                    if user_role in ["engineering", "backend", "frontend"]:
                        user_role = "dev"
                    elif user_role == "product":
                        user_role = "pm"
                    elif user_role in ["ux", "ui"]:
                        user_role = "designer"

                    await self.insight_initializer.create_role_insights_data(user, user_role)

            # Log summary
            self.logger.info(
                f"Initialized development environment: {len(self.users)} users, "
                f"{len(self.topics)} topics, {len(self.directories)} directories, "
                f"{len(self.processes)} processes, {len(self.events)} events, "
                f"{len(self.posts)} posts, {len(self.media)} media items, "
                f"{len(self.notifications)} notifications"
            )
            return True
        except SQLAlchemyError as e:
            self.logger.error(f"Database error initializing development environment: {e}")
            self.logger.error(traceback.format_exc())
            self.db.rollback()
            return False
        except Exception as e:
            self.logger.error(f"Error initializing development environment: {e}")
            self.logger.error(traceback.format_exc())
            self.db.rollback()
            return False

    async def initialize_production_environment(self) -> bool:
        """
        Initialize a minimal production environment with essential data.

        Returns:
            bool: Success status
        """
        try:
            # Create admin user
            admin_user = await self.user_initializer.create_admin_user()
            self.users = [admin_user]

            # Create default topics
            self.topics = await self.topic_initializer.create_default_topics()

            # Log summary
            self.logger.info(f"Initialized production environment: 1 admin user, {len(self.topics)} default topics")
            return True
        except SQLAlchemyError as e:
            self.logger.error(f"Database error initializing production environment: {e}")
            self.db.rollback()
            return False
        except Exception as e:
            self.logger.error(f"Error initializing production environment: {e}")
            self.db.rollback()
            return False

    async def initialize_guest_environment(self, guest_user: User) -> bool:
        """
        Initialize a streamlined development environment for a guest user.
        Associates the demo data with the provided guest user based on their role.

        Args:
            guest_user: The guest user to associate data with

        Returns:
            bool: Success status
        """
        self.logger.info(f"Starting guest environment initialization for user: {guest_user.handle} ({guest_user.email})")
        try:
            # Get the guest role from metadata or default to dev
            guest_role = guest_user.user_metadata.get("guest_role", "dev")
            self.logger.info(f"Guest role: {guest_role}")

            # Create required supporting sample accounts (we'll use the provided guest user as primary)
            sample_users = await self.user_initializer.create_sample_accounts()

            # Set up our users array with guest as primary
            self.users = [guest_user] + [u for u in sample_users if u.handle != "guest"]

            # Create supporting topics
            self.topics = await self.topic_initializer.create_work_topics()

            # Create role-specific directories
            self.directories = await self.directory_initializer.create_role_directories(guest_user, guest_role)

            # Set up user preferences
            await self.user_initializer.create_user_preferences([guest_user])

            # Create processes - check for existing ones first to avoid duplicates
            self.logger.info(f"Creating role-specific processes for {guest_user.handle}")

            existing_processes = self.db.query(Process).filter(Process.created_by_id == guest_user.id).all()
            if existing_processes:
                self.logger.info(f"User already has {len(existing_processes)} processes. Using existing ones.")
                self.processes = existing_processes
            else:
                # Create role-specific processes
                self.processes = await self.process_initializer.create_role_processes(guest_user, guest_role, self.directories)
                self.logger.info(f"Created {len(self.processes)} processes for role {guest_role}")

            # Create role-specific events based on processes
            self.logger.info(f"Creating role-specific events for {guest_user.handle}")

            # Events require processes - if none available, we must create at least one
            if not self.processes:
                self.logger.warning("No processes available for events - creating default process")
                # Create at least one default process to use
                self.processes = await self.process_initializer.create_role_processes(guest_user, guest_role, self.directories)
                if not self.processes:
                    self.logger.error("Failed to create any processes, cannot create events")
                    self.events = []
                    return False

            # Create events with the available processes
            self.events = await self.event_initializer.create_role_events(guest_user, guest_role, self.topics, self.processes)
            self.logger.info(f"Created {len(self.events)} events for role {guest_role}")

            # Ensure ALL events have processes
            self.logger.info("Ensuring all events have processes assigned")
            await self.event_initializer.ensure_all_events_have_processes(self.users, self.processes)

            # Create event relationships
            await self._create_event_relationships()

            # Create activity feed content
            self.posts, self.media = await self.post_initializer.create_guest_feed_content(guest_user, self.users, self.events, guest_role)

            # Create sample notifications
            self.notifications = await self.notification_initializer.create_guest_notifications(guest_user, self.users, self.posts, self.events)

            # Cross-reference content
            await self.content_initializer.create_content_relationships(self.users, self.events, self.posts, self.media)

            # Create role-specific insights
            await self.insight_initializer.create_role_insights_data(guest_user, guest_role)

            # Create sample reports
            reports = await self.report_initializer.create_sample_reports(guest_user)
            self.logger.info(f"Created {len(reports)} reports for guest user {guest_user.handle}")

            # Update guest bio with more detailed information based on role
            detailed_bios = {
                "dev": f"Senior Software Engineer with expertise in backend architecture and API design. Passionate about clean code, optimizing performance, and solving complex technical challenges. Currently focused on microservices architecture and containerization.",
                "pm": f"Product Manager with 5+ years experience leading cross-functional teams. Skilled in user research, roadmap planning, and agile methodology. Passionate about solving user problems and data-driven decision making.",
                "designer": f"UX/UI Designer specialized in creating intuitive and accessible interfaces. Expertise in design systems, user research, and usability testing. Passionate about inclusive design and creating delightful user experiences.",
                "ops": f"DevOps Engineer focused on automating and optimizing CI/CD pipelines. Experience with cloud infrastructure, monitoring solutions, and security best practices. Passionate about reliability and system scalability.",
                "intern": f"Software Engineering Intern currently learning full-stack development. Academic background in Computer Science with project experience in web applications. Excited to contribute to real-world projects and grow technical skills.",
                "leadership": f"Engineering Director with experience leading teams across multiple products. Strategic focus on team growth, technology vision, and business alignment. Passionate about mentorship and building high-performing teams.",
            }

            if guest_role in detailed_bios:
                guest_user.bio = detailed_bios[guest_role]
                self.db.add(guest_user)
                self.db.flush()
                self.logger.info(f"Updated bio for guest user {guest_user.handle}")

            # Log summary of created entities
            self.logger.info(
                f"Initialized guest environment for {guest_user.handle}: "
                f"{len(self.users)} users, {len(self.topics)} topics, "
                f"{len(self.directories)} directories, {len(self.processes)} processes, "
                f"{len(self.events)} events, {len(self.posts)} posts, "
                f"{len(self.media)} media items, {len(self.notifications)} notifications, "
                f"{len(reports)} reports"
            )
            return True
        except SQLAlchemyError as e:
            self.logger.error(f"Database error initializing guest environment: {e}")
            self.logger.error(traceback.format_exc())
            self.db.rollback()
            return False
        except Exception as e:
            self.logger.error(f"Error initializing guest environment: {e}")
            self.logger.error(traceback.format_exc())
            self.db.rollback()
            return False
