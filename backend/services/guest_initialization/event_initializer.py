"""
Event initialization module for sample event creation.
"""

import logging
import random
import uuid
from datetime import datetime, timedelta
from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from db.models import Event, EventStatusEnum, ParticipantStatusEnum, Process, Step, Topic, User, event_topics
from services.guest_initialization.event_helper import EventHelpers

# Set up logging
logger = logging.getLogger(__name__)


class EventInitializer:
    """Handles creation of events, participants, and related data."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db

    async def create_work_events(self, users: List[User], topics: List[Topic], processes: List[Process]) -> List[Event]:
        """
        Create realistic work events based on processes.

        Args:
            users: List of users to assign events to
            topics: List of topics to associate with events
            processes: List of processes to base events on (required)

        Returns:
            List[Event]: Created events
        """
        if not processes:
            logger.warning("No processes provided for event creation - cannot create events without processes")
            return []

        events = []
        today = datetime.now()

        # Get the main user
        jasonyu = next((u for u in users if u.handle == "jasonyu"), users[0])

        # Select the most appropriate processes to use
        selected_processes = self._select_best_processes(processes, 8)

        # Define quarter timeframe (full 3 months around today)
        quarter_start = today - timedelta(days=30)  # 1 month before today
        quarter_end = today + timedelta(days=90)  # 3 months after today

        # Generate a day-by-day schedule within this quarter
        current_date = quarter_start

        # Process tracking to ensure variety
        process_rotation_index = 0

        # Keep track of created events by date for limiting per day
        events_by_date = {}

        # Create events for each weekday in the quarter
        while current_date <= quarter_end:
            # Skip weekends (mostly) - 90% chance to skip weekends
            if current_date.weekday() >= 5 and random.random() < 0.9:  # 5 = Saturday, 6 = Sunday
                current_date += timedelta(days=1)
                continue

            # Current date as string for DB queries
            date_str = current_date.strftime("%Y-%m-%d")

            # Determine status based on date relation to today
            if current_date.date() < today.date():
                status = EventStatusEnum.DONE
            elif current_date.date() == today.date():
                status = EventStatusEnum.EXECUTION
            else:
                status = EventStatusEnum.PENDING

            # Initialize event counter for this day
            if date_str not in events_by_date:
                events_by_date[date_str] = 0

            # Check existing events count for this day before adding more
            existing_count_query = self.db.query(func.count(Event.id)).filter(Event.date == date_str)
            existing_count = existing_count_query.scalar() or 0

            # Stop if we already have 5 events for this day
            if existing_count >= 5:
                current_date += timedelta(days=1)
                continue

            # =================================================================
            # Create daily standup (9:00 - 9:15am every weekday)
            # =================================================================
            if current_date.weekday() < 5 and events_by_date.get(date_str, 0) == 0:
                # Check for existing standup on this date
                existing_standup = (
                    self.db.query(Event)
                    .filter(Event.date == date_str, (Event.title.like("%Standup%") | Event.title.like("%Stand%up%") | Event.title.like("%Daily%Sync%")))
                    .first()
                )

                if not existing_standup:
                    # Find a suitable process for standups
                    standup_process = next(
                        (p for p in processes if "sync" in p.title.lower() or "standup" in p.title.lower()), processes[0]
                    )  # Use first process if no standup-specific process found

                    # Create process instance for standup
                    standup_process_instance = self._create_process_from_template(standup_process, jasonyu)
                    if not standup_process_instance:
                        # Skip if we couldn't create a process instance
                        continue

                    # Give a more specific date name for the standup
                    date_formatted = current_date.strftime("%b %d")  # e.g. "Apr 22"

                    # No recurring events - each event should be unique
                    # Create standup event - each instance is unique (not recurring)
                    # Use the helper to create start and end times
                    event_time = "09:00"
                    event_duration = "15min"
                    event_start_datetime, event_end_datetime = EventHelpers.create_event_datetime(
                        date_str, event_time, event_duration
                    )

                    # Use helper to create standardized metadata
                    event_metadata = EventHelpers.create_event_metadata(
                        complexity=1,
                        category="Work",
                        tags=["Planning", "Sync", "Team"]
                    )

                    standup = Event(
                        id=str(uuid.uuid4()),  # Use proper UUID format
                        # Add date to make it unique
                        title=f"Team Standup - {date_formatted}",
                        description=f"Team sync for status updates - {date_formatted}",
                        start_time=event_start_datetime,  # Set the start_time field
                        end_time=event_end_datetime,  # Set the end_time field
                        date=date_str,
                        time=event_time,  # Consistent morning time
                        duration=event_duration,
                        status=status,
                        complexity=1,
                        color=EventHelpers.get_event_color(1),
                        location=EventHelpers.get_event_location(1),
                        recording_url=None,
                        created_by_id=jasonyu.id,
                        process_id=standup_process_instance.id,
                        event_metadata=event_metadata,
                    )
                    self.db.add(standup)
                    self.db.flush()

                    # Add Jason as participant/host
                    self._add_event_participant(standup, jasonyu, "host", ParticipantStatusEnum.CONFIRMED)

                    # Add topics
                    for topic_name in ["Planning", "Team"]:
                        topic = next((t for t in topics if t.name == topic_name), None)
                        if topic:
                            self.db.execute(event_topics.insert().values(event_id=standup.id, topic_id=topic.id))

                    # Use EventHelpers to create standup steps instead of creating them directly here
                    # This will ensure proper checks for existing steps to avoid duplication
                    EventHelpers.create_standard_standup_steps(standup, status, self.db)

                    # Add to events list and count
                    events.append(standup)
                    events_by_date[date_str] = events_by_date.get(date_str, 0) + 1
                else:
                    # If standup already exists, add it to our list
                    events.append(existing_standup)
                    events_by_date[date_str] = events_by_date.get(date_str, 0) + 1

            # =================================================================
            # Create up to 4 additional meetings for each day (total 5 per day max with standup)
            # =================================================================
            max_additional_events = min(4, 5 - events_by_date.get(date_str, 0))

            for _ in range(max_additional_events):
                # Skip if already have 5 events this day
                if events_by_date.get(date_str, 0) >= 5:
                    break

                # Pick a process using rotation to ensure variety
                process_index = process_rotation_index % len(selected_processes)
                process = selected_processes[process_index]
                process_rotation_index += 1

                # Set meeting complexity (1-5 scale)
                # Most meetings are 1-4 complexity
                complexity = random.randint(1, 4)

                # Schedule more important meetings on Tuesday-Thursday
                # Tue, Wed, Thu
                if current_date.weekday() in [1, 2, 3]:
                    # Higher chance of important meetings (60% chance instead of 40%)
                    if random.random() < 0.6:
                        complexity = random.randint(3, 5)

                # Generate meeting times - spread throughout the day
                # Define a wider range of possible time slots to avoid clustering
                all_time_slots = [
                    "09:30",
                    "10:00",
                    "10:30",
                    "11:00",
                    "11:30",  # Morning
                    "13:00",
                    "13:30",
                    "14:00",
                    "14:30",
                    "15:00",
                    "15:30",
                    "16:00",
                    "16:30",  # Afternoon
                ]

                # Get available times for this day by excluding existing scheduled times
                # Also exclude times within 30 min of existing events to avoid tight clustering
                existing_times = [e.time for e in events if e.date == date_str]

                # Convert existing times to hours for proximity check
                existing_hours = []
                for time_str in existing_times:
                    try:
                        hour, minute = map(int, time_str.split(":"))
                        # Convert to decimal hours
                        existing_hours.append(hour + minute / 60)
                    except (ValueError, AttributeError):
                        pass

                # Filter times that are at least 30 min away from any existing event
                available_times = []
                for time_slot in all_time_slots:
                    try:
                        hour, minute = map(int, time_slot.split(":"))
                        slot_hour = hour + minute / 60

                        # Check if time is at least 30 min (0.5 hour) from any existing event
                        too_close = any(abs(slot_hour - existing_hour) < 0.5 for existing_hour in existing_hours)

                        if not too_close and time_slot not in existing_times:
                            available_times.append(time_slot)
                    except (ValueError, AttributeError):
                        pass

                # If no times left, skip creating another event this day
                if not available_times:
                    break

                # Choose a time
                event_time = random.choice(available_times)

                # Duration based on complexity (30 min to 3 hours)
                durations = {1: "30min", 2: "45min", 3: "60min", 4: "90min", 5: "120min"}
                duration = durations.get(complexity, "60min")

                # Generate title and description
                event_title = self._generate_meeting_title(process, current_date, complexity)

                # Check for existing events with very similar titles to avoid duplication
                similar_events = (
                    self.db.query(Event)
                    .filter(
                        Event.date == date_str,
                        Event.title.like(f"%{event_title.split(' ')[0]}%{event_title.split(' ')[-1]}%"),
                    )
                    .all()
                )

                if similar_events:
                    # If a similar title exists, modify this one to be more distinct
                    title_words = event_title.split()
                    if len(title_words) >= 3:
                        # Add a modifier to make it distinct
                        modifiers = ["Advanced", "Extended", "Deep Dive", "Follow-up", "Strategic", "Technical"]
                        event_title = f"{random.choice(modifiers)} {event_title}"

                # Each event is a unique standalone event

                # Remove 'weekly' or 'bi-weekly' from the title if present
                if "weekly" in event_title.lower() or "bi-weekly" in event_title.lower():
                    event_title = event_title.replace("Weekly ", "").replace("weekly ", "")
                    event_title = event_title.replace("Bi-weekly ", "").replace("bi-weekly ", "")

                # Generate event tags (2-3 relevant tags)
                tags = self._generate_tags_for_event(process, complexity)

                # Create process instance from template
                process_instance = self._create_process_from_template(process, jasonyu)

                # Skip if we couldn't create a process instance
                if not process_instance:
                    continue

                # Use helper to create standardized metadata
                event_metadata = EventHelpers.create_event_metadata(
                    complexity=complexity,
                    category="Work",
                    tags=tags,
                    template_id=str(process.id) if process.is_template else None
                )

                # Use the helper to create start and end times
                event_start_datetime, event_end_datetime = EventHelpers.create_event_datetime(
                    date_str, event_time, duration
                )

                # Create the event
                event = Event(
                    id=str(uuid.uuid4()),
                    title=event_title,
                    description=process.description if process.description else f"Meeting related to {process.title}",
                    # Set both new datetime fields
                    start_time=event_start_datetime,
                    end_time=event_end_datetime,
                    # Keep legacy fields for compatibility
                    date=date_str,
                    time=event_time,
                    duration=duration,
                    status=status,
                    complexity=complexity,
                    color=process.color if process.color else EventHelpers.get_event_color(complexity),
                    location=EventHelpers.get_event_location(complexity),
                    recording_url=(f"/video/stock-video-{random.randint(1, 4)}.mp4" if status == EventStatusEnum.DONE and complexity >= 3 else None),
                    created_by_id=jasonyu.id,
                    process_id=process_instance.id,
                    event_metadata=event_metadata,
                )
                self.db.add(event)
                self.db.flush()

                # Add Jason as participant/host
                self._add_event_participant(event, jasonyu, "host", ParticipantStatusEnum.CONFIRMED)

                # Add topics/tags
                for tag in tags:
                    topic = next((t for t in topics if t.name == tag), None)
                    if topic:
                        self.db.execute(event_topics.insert().values(event_id=event.id, topic_id=topic.id))

                # Create steps based on process template or generate standard steps
                self._create_steps_for_event(event, process, status)

                # Add to events list and increment counter
                events.append(event)
                events_by_date[date_str] = events_by_date.get(date_str, 0) + 1

            # Move to next day
            current_date += timedelta(days=1)

        # Add a few special events that are referenced in the frontend
        special_events = self._create_special_events(jasonyu, processes, topics, today)
        events.extend(special_events)

        logger.info(f"Created {len(events)} events for the quarter around {                     today.strftime('%Y-%m-%d')}")

        self.db.commit()
        for event in events:
            self.db.refresh(event)

        return events

    async def create_role_events(self, user: User, role: str, topics: List[Topic], processes: List[Process]) -> List[Event]:
        """
        Create role-specific events for a guest user, based on processes.

        Args:
            user: The user to create events for
            role: The role of the user
            topics: List of topics to associate with events
            processes: List of processes to base events on (required)

        Returns:
            List[Event]: Created events
        """
        if not processes:
            logger.warning("No processes provided for role event creation - cannot create events without processes")
            return []

        # Get the current date
        today = datetime.now()

        # Define date ranges for events: prior month and next 3 months
        # Calculate start date: first day of the previous month
        start_date = today.replace(day=1) - timedelta(days=1)
        start_date = start_date.replace(day=1)  # First day of previous month

        # Calculate end date: last day of the 3rd month ahead (approximately 90 days)
        # This ensures a full quarter of data
        end_date = today + timedelta(days=90)

        # Filter processes by role relevance - those created by this user or matching the role
        role_terms = {
            "dev": ["development", "code", "backend", "frontend", "api", "test"],
            "design": ["design", "ui", "ux", "user experience", "visual"],
            "product": ["product", "feature", "roadmap", "strategy", "requirement"],
            "marketing": ["marketing", "content", "social", "campaign", "analytics"],
            "ops": ["operations", "devops", "infrastructure", "monitoring"],
            "pm": ["project", "management", "planning", "schedule"],
        }

        # Get the terms for this role
        role_keywords = role_terms.get(role.lower(), role_terms["dev"])

        # Select the best processes for this role
        selected_processes = self._select_role_processes(processes, role_keywords, user)

        # Define quarter timeframe (full 3 months around today)
        quarter_start = today - timedelta(days=30)  # 1 month before today
        quarter_end = today + timedelta(days=90)  # 3 months after today

        # Generate a day-by-day schedule within this quarter
        current_date = quarter_start

        # Process tracking to ensure variety
        process_rotation_index = 0

        # Keep track of created events by date for limiting per day
        events_by_date = {}
        events = []

        # Create events for each weekday in the quarter
        while current_date <= quarter_end:
            # Skip weekends (mostly) - 90% chance to skip weekends
            if current_date.weekday() >= 5 and random.random() < 0.9:  # 5 = Saturday, 6 = Sunday
                current_date += timedelta(days=1)
                continue

            # Current date as string for DB queries
            date_str = current_date.strftime("%Y-%m-%d")

            # Determine status based on date relation to today
            if current_date.date() < today.date():
                status = EventStatusEnum.DONE
            elif current_date.date() == today.date():
                status = EventStatusEnum.EXECUTION
            else:
                status = EventStatusEnum.PENDING

            # Initialize event counter for this day
            if date_str not in events_by_date:
                events_by_date[date_str] = 0

            # Check existing events count for this day before adding more
            existing_count_query = self.db.query(Event.id).filter(Event.date == date_str, Event.created_by_id == user.id).count()

            # Skip if already have 3 events this day for this user - increased from 2 to 3
            if existing_count_query >= 3:
                current_date += timedelta(days=1)
                continue

            # =================================================================
            # Create daily standup for the role team (9:15 - 9:30am every weekday)
            # =================================================================
            if current_date.weekday() < 5 and events_by_date.get(date_str, 0) == 0:
                # Check for existing standup on this date for this user
                existing_standup = (
                    self.db.query(Event)
                    .filter(
                        Event.date == date_str,
                        Event.created_by_id == user.id,
                        (Event.title.like("%Standup%") | Event.title.like("%Stand%up%") | Event.title.like("%Daily%Sync%")),
                    )
                    .first()
                )

                if not existing_standup:
                    # Find a suitable process for standups
                    standup_process = next(
                        (p for p in selected_processes if "sync" in p.title.lower() or "standup" in p.title.lower()), selected_processes[0]
                    )  # Use first process if no standup-specific process found

                    # Create process instance for standup
                    standup_process_instance = self._create_process_from_template(standup_process, user)
                    if not standup_process_instance:
                        # Skip if we couldn't create a process instance
                        continue

                    # Give a more specific date name for the standup
                    date_formatted = current_date.strftime("%b %d")  # e.g. "Apr 22"

                    # Create standup event - each instance is unique
                    # Use the helper to create start and end times
                    event_time = "09:15"
                    event_duration = "15min"
                    event_start_datetime, event_end_datetime = EventHelpers.create_event_datetime(
                        date_str, event_time, event_duration
                    )

                    # Use helper to create standardized metadata
                    event_metadata = EventHelpers.create_event_metadata(
                        complexity=1,
                        category="Work",
                        tags=["Planning", "Sync", role.capitalize()]
                    )

                    standup = Event(
                        id=str(uuid.uuid4()),  # Use proper UUID format
                        # Add date to make it unique
                        title=f"{role.capitalize()} Team Standup - {date_formatted}",
                        description=f"{role.capitalize()} team sync - {date_formatted}",
                        start_time=event_start_datetime,  # Set the start_time field
                        end_time=event_end_datetime,  # Set the end_time field
                        date=date_str,
                        time=event_time,  # Slightly later than main standup
                        duration=event_duration,
                        status=status,
                        complexity=1,
                        color=EventHelpers.get_event_color(1),
                        location=EventHelpers.get_event_location(1),
                        recording_url=None,
                        created_by_id=user.id,
                        process_id=standup_process_instance.id,
                        event_metadata=event_metadata,
                    )
                    self.db.add(standup)
                    self.db.flush()

                    # Add user as participant/host
                    self._add_event_participant(standup, user, "host", ParticipantStatusEnum.CONFIRMED)

                    # Add topics
                    for topic_name in ["Planning", role.capitalize()]:
                        topic = next((t for t in topics if t.name == topic_name), None)
                        if topic:
                            self.db.execute(event_topics.insert().values(event_id=standup.id, topic_id=topic.id))

                    # Use EventHelpers to create standup steps instead of creating them directly here
                    # This will ensure proper checks for existing steps to avoid duplication
                    EventHelpers.create_standard_standup_steps(standup, status, self.db)

                    # Add to events list and count
                    events.append(standup)
                    events_by_date[date_str] = events_by_date.get(date_str, 0) + 1
                else:
                    # If standup already exists, add it to our list
                    events.append(existing_standup)
                    events_by_date[date_str] = events_by_date.get(date_str, 0) + 1

            # =================================================================
            # Create 1 additional role-specific meeting for some days (not every day)
            # =================================================================
            # Only create additional events for about 60% of days
            if random.random() < 0.6 and events_by_date.get(date_str, 0) < 2:
                # Skip if we already have 2 events for this day
                if events_by_date.get(date_str, 0) >= 2:
                    current_date += timedelta(days=1)
                    continue

                # Pick a process using rotation to ensure variety
                if selected_processes:
                    process_index = process_rotation_index % len(selected_processes)
                    process = selected_processes[process_index]
                    process_rotation_index += 1

                    # Skip if this is a standup process - too many standups is unrealistic
                    if "standup" in process.title.lower() or "sync" in process.title.lower():
                        current_date += timedelta(days=1)
                        continue

                    # Set meeting complexity (1-5 scale)
                    # Most meetings are 1-4 complexity
                    complexity = random.randint(1, 4)

                    # Schedule more important meetings on Tuesday-Thursday
                    # Tue, Wed, Thu
                    if current_date.weekday() in [1, 2, 3] and random.random() < 0.4:
                        # Higher chance of important meetings
                        complexity = random.randint(3, 5)

                    # Generate meeting times - spread throughout the day
                    # Different times than the main events to avoid conflicts
                    time_options = {
                        0: ["11:30", "15:00"],  # Monday
                        1: ["10:00", "14:30"],  # Tuesday
                        2: ["11:00", "16:00"],  # Wednesday
                        3: ["10:30", "15:30"],  # Thursday
                        4: ["11:30", "14:30"],  # Friday
                        5: ["13:00"],  # Saturday (rare)
                        6: ["13:30"],  # Sunday (rare)
                    }

                    # Get available times for this day of week
                    day_of_week = current_date.weekday()
                    available_times = time_options[day_of_week]

                    # Choose time based on existing events
                    existing_times = [e.time for e in events if e.date == date_str]

                    # Filter out times that are already taken
                    available_times = [t for t in available_times if t not in existing_times]

                    # If no times left, skip creating another event this day
                    if not available_times:
                        current_date += timedelta(days=1)
                        continue

                    # Choose a time
                    event_time = random.choice(available_times)

                    # Duration based on complexity (30 min to 2 hours)
                    durations = {1: "30min", 2: "45min", 3: "60min", 4: "90min", 5: "120min"}
                    duration = durations.get(complexity, "60min")

                    # Generate role-specific title
                    event_title = self._generate_role_meeting_title(process, current_date, complexity, role)

                    # Each event is a unique standalone event

                    # Remove 'weekly' or 'bi-weekly' from the title if present
                    if "weekly" in event_title.lower() or "bi-weekly" in event_title.lower():
                        event_title = event_title.replace("Weekly ", "").replace("weekly ", "")
                        event_title = event_title.replace("Bi-weekly ", "").replace("bi-weekly ", "")

                    # Generate event tags (2-3 relevant tags)
                    tags = self._generate_role_tags(process, complexity, role)

                    # Create process instance from template
                    process_instance = self._create_process_from_template(process, user)

                    # Skip if we couldn't create a process instance
                    if not process_instance:
                        continue

                    # Use helper to create standardized metadata
                    event_metadata = EventHelpers.create_event_metadata(
                        complexity=complexity,
                        category="Work",
                        tags=tags,
                        template_id=str(process.id) if process.is_template else None
                    )

                    # Use the helper to create start and end times
                    event_start_datetime, event_end_datetime = EventHelpers.create_event_datetime(
                        date_str, event_time, duration
                    )

                    # Create the event
                    event = Event(
                        id=str(uuid.uuid4()),
                        title=event_title,
                        description=(
                            process.description
                            if process.description
                            else f"{role.capitalize()} meeting related to {process.title}"
                        ),
                        # Set both new datetime fields
                        start_time=event_start_datetime,
                        end_time=event_end_datetime,
                        # Keep legacy fields for compatibility
                        date=date_str,
                        time=event_time,
                        duration=duration,
                        status=status,
                        complexity=complexity,
                        color=process.color if process.color else EventHelpers.get_event_color(complexity),
                        location=EventHelpers.get_event_location(complexity),
                        recording_url=(f"/video/stock-video-{random.randint(1, 4)}.mp4" if status == EventStatusEnum.DONE and complexity >= 3 else None),
                        created_by_id=user.id,
                        process_id=process_instance.id,
                        event_metadata=event_metadata,
                    )
                    self.db.add(event)
                    self.db.flush()

                    # Add user as participant/host
                    self._add_event_participant(event, user, "host", ParticipantStatusEnum.CONFIRMED)

                    # Add topics/tags
                    for tag in tags:
                        topic = next((t for t in topics if t.name == tag), None)
                        if topic:
                            self.db.execute(event_topics.insert().values(event_id=event.id, topic_id=topic.id))

                    # Create steps based on process template or generate standard steps
                    self._create_steps_for_event(event, process, status)

                    # Add to events list and increment counter
                    events.append(event)
                    events_by_date[date_str] = events_by_date.get(date_str, 0) + 1

            # Move to next day
            current_date += timedelta(days=1)

        self.db.commit()
        for event in events:
            self.db.refresh(event)

        logger.info(f"Created {len(events)} {                     role} role events for user {user.handle}")
        return events

    # =========================================================================
    # Helper methods for event creation
    # =========================================================================

    def _select_best_processes(self, processes: List[Process], count: int = 8) -> List[Process]:
        """Select the best processes to use for event creation."""
        return EventHelpers.select_best_processes(processes, count)

    def _select_role_processes(self, processes: List[Process], role_keywords: List[str], user: User) -> List[Process]:
        """Select the most relevant processes for a specific role."""
        return EventHelpers.select_processes_for_role(processes, role_keywords, user)

    def _generate_meeting_title(self, process: Process, meeting_date: datetime, complexity: int) -> str:
        """Generate a realistic meeting title based on process and date."""
        return EventHelpers.generate_meeting_title(process, meeting_date, complexity)

    def _generate_role_meeting_title(self, process: Process, meeting_date: datetime, complexity: int, role: str) -> str:
        """Generate a role-specific meeting title."""
        return EventHelpers.generate_meeting_title(process, meeting_date, complexity, role)

    def _generate_tags_for_event(self, process: Process, complexity: int) -> List[str]:
        """Generate appropriate tags for an event based on process and complexity."""
        return EventHelpers.generate_event_tags(process, complexity)

    def _generate_role_tags(self, process: Process, complexity: int, role: str) -> List[str]:
        """Generate role-specific tags for an event."""
        return EventHelpers.generate_event_tags(process, complexity, role)

    def _get_color_for_event(self, complexity: int) -> str:
        """Get appropriate color based on event complexity."""
        return EventHelpers.get_event_color(complexity)

    def _get_location_for_event(self, complexity: int) -> str:
        """Get appropriate location based on event complexity."""
        return EventHelpers.get_event_location(complexity)

    def _create_steps_for_event(self, event: Event, process: Process, status: EventStatusEnum) -> None:
        """Create appropriate steps for an event based on the process template."""
        # Check if steps already exist for this process to avoid duplication
        existing_steps = self.db.query(Step).filter(Step.process_id == process.id).count()
        if existing_steps > 0:
            logger.info(f"Process {process.id} already has {existing_steps} steps. Skipping step creation.")
            return

        # Extra caution for standups to prevent duplicate steps
        if "standup" in event.title.lower() or "sync" in event.title.lower():
            EventHelpers.create_standard_standup_steps(event, status, self.db)
        else:
            EventHelpers.create_steps_for_event(event, process, status, self.db)

    def _create_special_events(self, user: User, processes: List[Process], topics: List[Topic], today: datetime) -> List[Event]:
        """Create special events referenced in the frontend."""
        special_events = []

        # Define important events with meaningful names but proper UUID IDs
        event_definitions = [
            {
                "id": str(uuid.uuid4()),  # Using proper UUID format
                "name": "auth_refactoring",  # Internal reference name
                "title": "Authentication System Refactoring",
                "description": "Refactoring our authentication system to improve security and performance",
                "date_offset": -1,  # 1 day ago
                "time": "14:00",
                "duration": "60min",
                "status": EventStatusEnum.DONE,
                "complexity": 4,
                "color": "blue",
                "tags": ["Backend", "Security", "Refactoring"],
                "has_recording": True,
                "process_name": "Authentication System",
            },
            {
                "id": str(uuid.uuid4()),  # Using proper UUID format
                "name": "api_docs",  # Internal reference name
                "title": "API Documentation Update",
                "description": "Update API documentation for better developer experience",
                "date_offset": 2,  # 2 days from now
                "time": "10:00",
                "duration": "45min",
                "status": EventStatusEnum.PENDING,
                "complexity": 3,
                "color": "green",
                "tags": ["Documentation", "API", "Backend"],
                "has_recording": False,
                "process_name": "API Documentation",
            },
            {
                "id": str(uuid.uuid4()),  # Using proper UUID format
                "name": "sprint_retro",  # Internal reference name
                "title": "Sprint Retrospective",
                "description": "Review our sprint accomplishments and areas for improvement",
                "date_offset": 7,  # 1 week from today
                "time": "13:00",
                "duration": "60min",
                "status": EventStatusEnum.PENDING,
                "complexity": 2,
                "color": "green",
                "tags": ["Planning", "Retrospective", "Management"],
                "has_recording": False,
                "process_name": "Sprint Retrospective",
            },
        ]

        for event_def in event_definitions:
            # Check if event already exists by name (stored in metadata)
            existing = None
            if "name" in event_def:
                # Look for events with matching name in metadata
                existing_events = self.db.query(Event).filter(Event.title == event_def["title"]).all()
                for event in existing_events:
                    if event.event_metadata and event.event_metadata.get("special_name") == event_def["name"]:
                        existing = event
                        break

            if existing:
                special_events.append(existing)
                continue

            # Calculate date
            event_date = (today + timedelta(days=event_def["date_offset"])).strftime("%Y-%m-%d")

            # Find matching process by name
            matching_process = None
            matching_template = None
            for p in processes:
                if event_def["process_name"].lower() in p.title.lower():
                    if p.is_template:
                        matching_template = p
                    else:
                        matching_process = p
                        break

            # If no specific match found, use the first process as fallback
            if not matching_template and not matching_process and processes:
                if any(p.is_template for p in processes):
                    matching_template = next(p for p in processes if p.is_template)
                else:
                    matching_process = processes[0]

            # Create a process instance if needed
            process_instance = None
            if matching_template:
                # Create instance from template
                process_instance = self._create_process_from_template(matching_template, user)
                if process_instance:
                    matching_process = process_instance
            elif matching_process:
                # Use the existing process
                process_instance = matching_process

            # Skip if we couldn't get a process
            if not process_instance:
                continue

            # Use helper to create standardized metadata
            event_metadata = EventHelpers.create_event_metadata(
                complexity=event_def["complexity"],
                category="Work",
                tags=event_def["tags"],
                template_id=str(matching_template.id) if matching_template else None
            )

            # Add special name for tracking
            event_metadata["special_name"] = event_def.get("name", "")

            # Use the helper to create start and end times
            event_start_datetime, event_end_datetime = EventHelpers.create_event_datetime(
                event_date, event_def["time"], event_def["duration"]
            )

            # No need to check for missing start and end times as EventHelpers.create_event_datetime
            # always provides valid datetime objects with appropriate fallbacks

            event = Event(
                id=event_def["id"],
                title=event_def["title"],
                description=event_def["description"],
                # Set both new datetime fields - ensure they are not None
                start_time=event_start_datetime,  # Using the variable from EventHelpers
                end_time=event_end_datetime,      # Using the variable from EventHelpers
                # Keep legacy fields for compatibility
                date=event_date,
                time=event_def["time"],
                duration=event_def["duration"],
                status=event_def["status"],
                complexity=event_def["complexity"],
                color=event_def["color"],
                location=EventHelpers.get_event_location(event_def["complexity"]),
                recording_url=(f"/video/stock-video-{random.randint(1, 4)}.mp4" if event_def["has_recording"] else None),
                created_by_id=user.id,
                process_id=process_instance.id,
                event_metadata=event_metadata,
            )
            self.db.add(event)
            self.db.flush()

            # Add user as participant
            self._add_event_participant(event, user, "host", ParticipantStatusEnum.CONFIRMED)

            # Add topics/tags
            for tag_name in event_def["tags"]:
                topic = next((t for t in topics if t.name == tag_name), None)
                if topic:
                    self.db.execute(event_topics.insert().values(event_id=event.id, topic_id=topic.id))

            # Create steps based on process or default steps
            if matching_process:
                self._create_steps_for_event(event, matching_process, event_def["status"])
            else:
                # Create generic steps
                steps = [
                    f"Prepare for {event_def['title']}",
                    f"Review related documentation",
                    f"Conduct the meeting",
                    f"Document decisions and outcomes",
                    f"Follow up on action items",
                ]

                for i, step_content in enumerate(steps):
                    # Determine completion based on status
                    if event_def["status"] == EventStatusEnum.DONE:
                        step_completed = True
                    elif event_def["status"] == EventStatusEnum.EXECUTION:
                        step_completed = i < len(steps) // 2
                    else:
                        step_completed = False

                    step = Step(id=str(uuid.uuid4()), content=step_content, completed=step_completed, order=i + 1, process_id=process_instance.id)
                    self.db.add(step)

            special_events.append(event)

        return special_events

    async def ensure_all_events_have_processes(self, users: List[User], processes: List[Process]) -> None:
        """
        Ensures that ALL events in the database have a process assigned to them.

        Args:
            users: List of users that can be assigned as process owners
            processes: List of processes to use as templates
        """
        logger.info("Ensuring all events have processes assigned...")

        # Get all events without processes
        events_without_process = self.db.query(Event).filter(Event.process_id == None).all()
        logger.info(f"Found {len(events_without_process)} events without processes")

        # Get all events with processes but without steps
        events_without_steps = self.db.query(Event).filter(
            Event.process_id != None,
            ~Event.id.in_(self.db.query(Step.event_id).filter(Step.event_id != None))
        ).all()
        logger.info(f"Found {len(events_without_steps)} events with processes but without steps")

        # If all events have processes and steps, return
        if not events_without_process and not events_without_steps:
            logger.info("All events already have processes and steps assigned.")
            return

        logger.info(f"Found {len(events_without_process)} events without processes. Assigning processes...")

        # Get the default user
        default_user = users[0] if users else None
        if not default_user:
            logger.error("No users available to assign as process owners. Aborting.")
            return

        # Get a default process template
        default_template = next((p for p in processes if p.is_template), None)
        if not default_template:
            # If no template exists, use the first process
            default_template = processes[0] if processes else None

        if not default_template:
            logger.error("No processes available to assign to events. Aborting.")
            return

        # For each event without a process, create and assign a process
        for event in events_without_process:
            # Get the event owner
            event_owner = next((u for u in users if u.id == event.created_by_id), default_user)

            # Create a process instance for this event
            process_instance = self._create_process_from_template(default_template, event_owner)

            if process_instance:
                # Assign the process to the event
                event.process_id = process_instance.id

                # Create steps for the event if it doesn't have any
                if not event.steps:
                    self._create_steps_for_event(event, process_instance, event.status)

                logger.info(f"Assigned process {process_instance.id} to event {event.id}")
            else:
                logger.warning(f"Failed to create process for event {event.id}")

        # Now handle events with processes but without steps
        logger.info(f"Adding steps to {len(events_without_steps)} events that have processes but no steps...")
        for event in events_without_steps:
            # Get the process for this event
            process = self.db.query(Process).filter(Process.id == event.process_id).first()

            if process:
                # Create steps based on the associated process
                self._create_steps_for_event(event, process, event.status)
                logger.info(f"Added steps to event {event.id} using process {process.id}")
            else:
                # If the associated process doesn't exist (shouldn't happen), try to find another one
                logger.warning(f"Process {event.process_id} for event {event.id} not found. Trying to find another process.")

                # Get the event owner
                event_owner = next((u for u in users if u.id == event.created_by_id), default_user)

                # Find a suitable process or create a new instance
                if default_template:
                    new_process = self._create_process_from_template(default_template, event_owner)
                    if new_process:
                        # Update the event with the new process
                        event.process_id = new_process.id
                        # Create steps for the event
                        self._create_steps_for_event(event, new_process, event.status)
                        logger.info(f"Replaced missing process and added steps to event {event.id}")
                    else:
                        logger.error(f"Failed to create replacement process for event {event.id}")
                else:
                    logger.error(f"No template process available to replace missing process for event {event.id}")

        # Check specifically for the "Dev Meeting" event
        dev_meetings = self.db.query(Event).filter(Event.title.like("%Dev Meeting%")).all()
        for dev_meeting in dev_meetings:
            # Check if this meeting has a process assigned
            if not dev_meeting.process_id:
                logger.info(f"Found 'Dev Meeting' event (ID: {dev_meeting.id}) without a process. Fixing...")

                # Get the event owner
                event_owner = next((u for u in users if u.id == dev_meeting.created_by_id), default_user)

                # Create a process instance for this Dev Meeting
                process_instance = self._create_process_from_template(default_template, event_owner)

                if process_instance:
                    # Assign the process to the event
                    dev_meeting.process_id = process_instance.id

                    # Create meeting-specific steps
                    self._create_steps_for_event(dev_meeting, process_instance, dev_meeting.status)

                    logger.info(f"Fixed 'Dev Meeting' event {dev_meeting.id} with process {process_instance.id}")
                else:
                    logger.warning(f"Failed to create process for 'Dev Meeting' event {dev_meeting.id}")

        # Check if there are any Dev Meetings with processes but without steps
        dev_meetings_without_steps = [
            meeting for meeting in dev_meetings
            if meeting.process_id and not self.db.query(Step).filter(Step.event_id == meeting.id).first()
        ]

        for meeting in dev_meetings_without_steps:
            logger.info(f"Adding steps to 'Dev Meeting' event {meeting.id}...")
            process = self.db.query(Process).filter(Process.id == meeting.process_id).first()
            if process:
                self._create_steps_for_event(meeting, process, meeting.status)
                logger.info(f"Added steps to 'Dev Meeting' event {meeting.id}")

        # Commit all changes
        self.db.commit()
        logger.info("Process and step assignments complete.")

    def _create_process_from_template(self, template_process: Process, user: User) -> Process:
        """
        Create a process instance from a template process.

        Args:
            template_process: The template process to create an instance from
            user: The user who will own the process instance

        Returns:
            Process: The newly created process instance
        """
        return EventHelpers.create_process_from_template(template_process, user, self.db)

    def _add_event_participant(self, event: Event, user: User, role: str, status: ParticipantStatusEnum) -> None:
        """
        Add a participant to an event.

        Args:
            event: The event to add participant to
            user: The user to add as participant
            role: The role of the participant
            status: The participation status
        """
        EventHelpers.add_event_participant(event, user, role, status, self.db)
