"""
Helper functions for event creation to reduce duplication in event initialization code.
"""

import logging
import random
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from db.models import Event, EventParticipant, EventStatusEnum, ParticipantStatusEnum, Process, Step, SubStep, User

# Set up logging
logger = logging.getLogger(__name__)

class EventHelpers:
    """Static helper methods for event creation and management."""

    @staticmethod
    def get_event_status(event_date: datetime, today: datetime) -> EventStatusEnum:
        """Determine event status based on date.

        Args:
            event_date: The date of the event
            today: The current date

        Returns:
            EventStatusEnum: The appropriate status for the event
        """
        if event_date.date() < today.date():
            return EventStatusEnum.DONE
        elif event_date.date() == today.date():
            return EventStatusEnum.EXECUTION
        else:
            return EventStatusEnum.PENDING

    @staticmethod
    def get_event_color(complexity: int) -> str:
        """Get appropriate color based on event complexity.

        Args:
            complexity: The complexity level (1-5)

        Returns:
            str: Color code
        """
        color_map = {
            1: "green",  # Low complexity
            2: "blue",  # Medium-low complexity
            3: "purple",  # Medium complexity
            4: "orange",  # Medium-high complexity
            5: "red",  # High complexity
        }
        return color_map.get(complexity, "blue")

    @staticmethod
    def get_event_location(complexity: int) -> str:
        """Get appropriate location based on event complexity.

        Args:
            complexity: The complexity level (1-5)

        Returns:
            str: Location name
        """
        # More important meetings (complexity 4-5) are more likely to be in physical locations
        if complexity >= 4:
            locations = ["Conference Room A", "Conference Room B", "Executive Briefing Center", "Design Studio", "Virtual Meeting"]
        else:
            locations = ["Virtual Meeting", "Virtual Meeting", "Conference Room A", None]

        return random.choice(locations)

    @staticmethod
    def generate_event_tags(process: Process, complexity: int, role: Optional[str] = None) -> List[str]:
        """Generate tags for an event based on process and complexity.

        Args:
            process: The process associated with the event
            complexity: The complexity level (1-5)
            role: Optional role to include as a tag

        Returns:
            List[str]: Tags for the event
        """
        tags = []

        # Add the process category if available
        if hasattr(process, "category") and process.category:
            tags.append(process.category)

        # Add more tags based on process title
        relevant_keywords = {
            "design": "Design",
            "ui": "Design",
            "ux": "Design",
            "planning": "Planning",
            "strategy": "Strategy",
            "review": "Review",
            "api": "API",
            "frontend": "Frontend",
            "backend": "Backend",
            "auth": "Authentication",
            "database": "Database",
            "performance": "Performance",
            "testing": "Testing",
            "documentation": "Documentation",
            "deploy": "Deployment",
            "release": "Release",
            "infrastructure": "Infrastructure",
        }

        # Check process title for relevant keywords
        title_lower = process.title.lower()
        for keyword, tag in relevant_keywords.items():
            if keyword in title_lower and tag not in tags:
                tags.append(tag)

        # For more complex meetings, add more strategic tags
        if complexity >= 4:
            strategic_tags = ["Strategy", "Planning", "Architecture"]
            for tag in strategic_tags:
                if tag not in tags and random.random() < 0.4:
                    tags.append(tag)

        # For simpler meetings, add operational tags
        if complexity <= 2:
            operational_tags = ["Sync", "Operations", "Maintenance"]
            for tag in operational_tags:
                if tag not in tags and random.random() < 0.4:
                    tags.append(tag)

        # Add role as tag if provided
        if role and role.capitalize() not in tags:
            tags = [role.capitalize()] + tags

        # Ensure we have 2-3 tags
        if len(tags) < 2:
            default_tags = ["Planning", "Development", "Team"]
            for tag in default_tags:
                if tag not in tags:
                    tags.append(tag)
                    if len(tags) >= 3:
                        break

        # Limit to 3 tags maximum
        return tags[:3]

    @staticmethod
    def select_best_processes(processes: List[Process], count: int = 8) -> List[Process]:
        """Select the best processes to use for event creation.

        Args:
            processes: Available processes to choose from
            count: Maximum number of processes to select

        Returns:
            List[Process]: Selected processes sorted by suitability
        """
        if not processes:
            return []

        # First separate template and non-template processes
        template_processes = [p for p in processes if p.is_template]
        non_template_processes = [p for p in processes if not p.is_template]

        # Calculate weights for all processes based on their characteristics
        weighted_processes = []

        # First prioritize templates (80% of selections should be templates if available)
        for process in template_processes:
            # Calculate a weight based on process completeness
            steps = [s for s in process.steps]
            completed_steps = sum(1 for s in steps if s.completed)
            weight = 2.0  # Start with higher base weight for templates
            if steps:
                weight += 0.5 + (completed_steps / len(steps)) * 2.0

            # Prioritize processes with clear, descriptive titles
            if len(process.title) > 5 and " " in process.title:
                weight += 1.0

            weighted_processes.append((process, weight))

        # Then add non-templates with lower weights
        for process in non_template_processes:
            # Calculate a weight based on process completeness
            steps = [s for s in process.steps]
            completed_steps = sum(1 for s in steps if s.completed)
            weight = 0.5  # Lower base weight for non-templates
            if steps:
                weight += 0.2 + (completed_steps / len(steps)) * 1.0

            weighted_processes.append((process, weight))

        # Sort by weight (reverse=True for highest weights first)
        weighted_processes.sort(key=lambda x: x[1], reverse=True)

        # Take the top processes
        count = min(count, len(weighted_processes))
        return [p[0] for p in weighted_processes[:count]]

    @staticmethod
    def select_processes_for_role(processes: List[Process], role_keywords: List[str], user: User) -> List[Process]:
        """Select the most relevant processes for a specific role.

        Args:
            processes: Available processes
            role_keywords: Keywords that indicate relevance to the role
            user: The user to check for process ownership

        Returns:
            List[Process]: Most relevant processes for the role
        """
        if not processes:
            return []

        # Calculate weights for all processes based on role relevance
        weighted_processes = []

        for process in processes:
            # Start with a moderate weight
            weight = 1.0

            # Processes created by this user get highest priority
            if process.created_by_id == user.id:
                weight += 3.0

            # Check if process title or category contains role keywords
            title_lower = process.title.lower()
            category_lower = getattr(process, "category", "").lower()

            # Increase weight based on keyword matches
            keyword_matches = sum(1 for kw in role_keywords if kw in title_lower or kw in category_lower)
            weight += keyword_matches * 0.5

            # Prioritize templates slightly
            if getattr(process, "is_template", False):
                weight += 0.5

            # Check for complete processes (with steps)
            steps = getattr(process, "steps", [])
            if steps and len(steps) >= 3:
                weight += 0.5

            weighted_processes.append((process, weight))

        # Sort by weight (highest weights first)
        weighted_processes.sort(key=lambda x: x[1], reverse=True)

        # Take the top processes (at most 60% of available processes)
        max_count = max(5, int(len(processes) * 0.6))
        return [p[0] for p in weighted_processes[:max_count]]

    @staticmethod
    def create_standard_standup_steps(event_id: str, status: EventStatusEnum, db: Session) -> List[Step]:
        """Create standard steps for a standup event.

        Args:
            event_id: The event ID to associate steps with
            status: The event status to determine which steps are completed
            db: Database session

        Returns:
            List[Step]: The created steps
        """
        # Define standup steps with their substeps
        standup_steps_with_substeps = [
            {
                "content": "Review yesterday's accomplishments",
                "substeps": ["List individual achievements", "Review team progress", "Discuss completed tasks", "Share metrics and results"]
            },
            {
                "content": "Discuss today's priorities",
                "substeps": ["Outline key objectives", "Prioritize tasks", "Allocate resources", "Set expectations"]
            },
            {
                "content": "Identify any blockers",
                "substeps": ["Technical issues", "Resource constraints", "Dependencies", "Process bottlenecks"]
            },
            {
                "content": "Assign action items",
                "substeps": ["Delegate tasks", "Set deadlines", "Define deliverables", "Schedule follow-ups"]
            }
        ]

        steps = []
        for i, step_data in enumerate(standup_steps_with_substeps):
            # For past events, all steps completed; for today, first 2 completed
            if status == EventStatusEnum.DONE:
                step_completed = True
            elif status == EventStatusEnum.EXECUTION:
                step_completed = i < 2  # First two steps completed for today
            else:
                step_completed = False  # No steps completed for future events

            # Create the main step
            step = Step(id=str(uuid.uuid4()), content=step_data["content"], completed=step_completed, order=i + 1, event_id=event_id)
            db.add(step)
            db.flush()  # Get the ID

            # Create substeps
            for j, substep_content in enumerate(step_data["substeps"]):
                # Determine if substep should be completed
                substep_completed = False
                if step_completed:  # If parent step is completed
                    substep_completed = True
                elif status == EventStatusEnum.EXECUTION and i < 2:
                    # For ongoing events, complete some substeps of early steps
                    substep_completed = j < len(step_data["substeps"]) // 2

                substep = SubStep(
                    id=str(uuid.uuid4()),
                    content=substep_content,
                    completed=substep_completed,
                    order=j + 1,
                    step_id=step.id
                )
                db.add(substep)

            steps.append(step)

        return steps

    @staticmethod
    def get_default_steps_by_event_type(event_type: str) -> List[dict]:
        """Get default steps with substeps based on the type of event.

        Args:
            event_type: Type of event (review, planning, workshop, etc.)

        Returns:
            List[dict]: Default steps with substeps appropriate for the event type
        """
        if "review" in event_type.lower():
            return [
                {
                    "content": "Present work completed",
                    "substeps": ["Prepare demonstrations", "Collect metrics", "Create visual summaries", "Outline achievements"]
                },
                {
                    "content": "Gather feedback",
                    "substeps": ["Stakeholder input", "User feedback", "Team perspectives", "External opinions"]
                },
                {
                    "content": "Identify areas for improvement",
                    "substeps": ["Technical debt", "Process inefficiencies", "Quality issues", "Performance bottlenecks"]
                },
                {
                    "content": "Plan next iteration",
                    "substeps": ["Define priorities", "Resource allocation", "Timeline adjustments", "Risk management"]
                },
                {
                    "content": "Document decisions",
                    "substeps": ["Meeting notes", "Action items", "Responsibility assignments", "Follow-up schedule"]
                }
            ]
        elif "planning" in event_type.lower():
            return [
                {
                    "content": "Define objectives",
                    "substeps": ["Business goals", "Project milestones", "Success metrics", "Expected outcomes"]
                },
                {
                    "content": "Identify requirements",
                    "substeps": ["User needs", "Technical constraints", "Dependencies", "Acceptance criteria"]
                },
                {
                    "content": "Break down tasks",
                    "substeps": ["Component identification", "Work packages", "Effort estimation", "Prioritization"]
                },
                {
                    "content": "Assign responsibilities",
                    "substeps": ["Team allocation", "Role definition", "Accountability matrix", "Skill matching"]
                },
                {
                    "content": "Set timeline",
                    "substeps": ["Milestone dates", "Deliverable schedule", "Buffer allocation", "Critical path analysis"]
                },
                {
                    "content": "Define success criteria",
                    "substeps": ["Quantitative metrics", "Qualitative indicators", "Evaluation process", "Stakeholder approval"]
                }
            ]
        elif "workshop" in event_type.lower():
            return [
                {
                    "content": "Prepare materials",
                    "substeps": ["Presentation slides", "Exercise worksheets", "Reference documents", "Digital resources"]
                },
                {
                    "content": "Set up workshop environment",
                    "substeps": ["Room arrangement", "Technical equipment", "Collaboration tools", "Supplies preparation"]
                },
                {
                    "content": "Introduce objectives",
                    "substeps": ["Workshop purpose", "Expected outcomes", "Agenda overview", "Participation guidelines"]
                },
                {
                    "content": "Facilitate activities",
                    "substeps": ["Group exercises", "Discussions", "Breakout sessions", "Feedback collection"]
                },
                {
                    "content": "Capture outcomes",
                    "substeps": ["Note taking", "Decision documentation", "Visual recording", "Action item tracking"]
                },
                {
                    "content": "Define next steps",
                    "substeps": ["Implementation plan", "Responsibility assignment", "Timeline definition", "Follow-up process"]
                }
            ]
        else:
            # Generic meeting steps
            return [
                {
                    "content": "Prepare agenda",
                    "substeps": ["Outline key topics", "Set time allocations", "Define objectives", "Share ahead of time"]
                },
                {
                    "content": "Send meeting invites",
                    "substeps": ["Include necessary participants", "Provide context", "Attach relevant documents", "Confirm attendance"]
                },
                {
                    "content": "Conduct meeting",
                    "substeps": ["Introduction and objectives", "Topic discussions", "Decision making", "Summarize key points"]
                },
                {
                    "content": "Document outcomes",
                    "substeps": ["Meeting minutes", "Decision logs", "Action items", "Supporting materials"]
                },
                {
                    "content": "Follow up on action items",
                    "substeps": ["Assign responsibilities", "Set deadlines", "Create tracking mechanism", "Schedule check-ins"]
                }
            ]

    @staticmethod
    def create_steps_for_event(event: Event, process: Process, status: EventStatusEnum, db: Session) -> List[Step]:
        """Create steps for an event based on process template or generate standard steps.

        Args:
            event: The event to create steps for
            process: The process to base steps on
            status: The event status
            db: Database session

        Returns:
            List[Step]: The created steps
        """
        steps = []

        # If process has steps, use those
        if process.steps:
            for i, process_step in enumerate(process.steps):
                # For completed events, mark all steps as completed
                # For ongoing events, mark some steps as completed
                # For upcoming events, mark no steps as completed
                if status == EventStatusEnum.DONE:
                    step_completed = True
                elif status == EventStatusEnum.EXECUTION:
                    step_completed = i < len(process.steps) // 2
                else:
                    step_completed = False

                step = Step(id=str(uuid.uuid4()), content=process_step.content, completed=step_completed, order=i + 1, event_id=event.id)
                db.add(step)
                steps.append(step)

                # Add substeps if the template has them
                if hasattr(process_step, "sub_steps") and process_step.sub_steps:
                    for j, sub_step in enumerate(process_step.sub_steps):
                        # Determine if substep should be completed
                        sub_completed = False
                        if step_completed:  # If parent step is completed
                            sub_completed = True
                        elif status == EventStatusEnum.EXECUTION and i < len(process.steps) // 3:
                            # For ongoing events, complete some substeps of early steps
                            sub_completed = j < len(process_step.sub_steps) // 2

                        sub_step_obj = SubStep(id=str(uuid.uuid4()), content=sub_step.content, completed=sub_completed, order=j + 1, step_id=step.id)
                        db.add(sub_step_obj)
        else:
            # Create default steps based on event type and complexity
            if "standup" in event.title.lower() or "sync" in event.title.lower():
                steps = EventHelpers.create_standard_standup_steps(event.id, status, db)
            else:
                default_steps = EventHelpers.get_default_steps_by_event_type(event.title)

                # Add the default steps with substeps
                for i, step_data in enumerate(default_steps):
                    # Determine completion status
                    if status == EventStatusEnum.DONE:
                        step_completed = True
                    elif status == EventStatusEnum.EXECUTION:
                        step_completed = i < len(default_steps) // 2
                    else:
                        step_completed = False

                    # Create main step
                    step = Step(id=str(uuid.uuid4()), content=step_data["content"], completed=step_completed, order=i + 1, event_id=event.id)
                    db.add(step)
                    db.flush()  # Get the ID

                    # Create substeps
                    if "substeps" in step_data:
                        for j, substep_content in enumerate(step_data["substeps"]):
                            # Determine if substep should be completed
                            substep_completed = False
                            if step_completed:  # If parent step is completed
                                substep_completed = True
                            elif status == EventStatusEnum.EXECUTION and i < len(default_steps) // 3:
                                # For ongoing events, complete some substeps of early steps
                                substep_completed = j < len(step_data["substeps"]) // 2

                            substep = SubStep(
                                id=str(uuid.uuid4()),
                                content=substep_content,
                                completed=substep_completed,
                                order=j + 1,
                                step_id=step.id
                            )
                            db.add(substep)

                    steps.append(step)

        return steps

    @staticmethod
    def add_event_participant(event: Event, user: User, role: str, status: ParticipantStatusEnum, db: Session) -> Optional[EventParticipant]:
        """Add a participant to an event.

        Args:
            event: The event to add participant to
            user: The user to add as participant
            role: The role of the participant
            status: The participation status
            db: Database session

        Returns:
            EventParticipant: The created participant or None if already exists
        """
        # Check if participant already exists with this exact role
        existing = (
            db.query(EventParticipant).filter(EventParticipant.event_id == event.id, EventParticipant.user_id == user.id, EventParticipant.role == role).first()
        )

        if existing:
            return None

        participant = EventParticipant(event_id=event.id, user_id=user.id, role=role, status=status, joined_at=datetime.utcnow())
        db.add(participant)
        return participant

    @staticmethod
    def create_event_datetime(date_str: str, time_str: str, duration_str: str) -> Tuple[datetime, datetime]:
        """Create start and end datetime objects from date, time and duration strings.

        Args:
            date_str: The date string in YYYY-MM-DD format
            time_str: The time string in HH:MM format
            duration_str: The duration string (e.g., "30min", "1h", "90min")

        Returns:
            Tuple[datetime, datetime]: The start and end datetime objects, never None
        """
        # Immediately set a fallback datetime to ensure we always have valid values
        fallback_datetime = datetime.utcnow()
        event_datetime = fallback_datetime  # Initialize with fallback to prevent None

        # Log params for debugging
        logger.info(f"create_event_datetime called with: date_str='{date_str}', time_str='{time_str}', duration_str='{duration_str}'")

        # Validate input parameters
        if not date_str or not isinstance(date_str, str):
            logger.warning(f"Invalid or missing date_str: {date_str}. Using current date.")
            date_str = fallback_datetime.strftime("%Y-%m-%d")

        if not time_str or not isinstance(time_str, str):
            logger.warning(f"Invalid or missing time_str: {time_str}. Using current time.")
            time_str = fallback_datetime.strftime("%H:%M")

        # Parse date and time strings to create datetime objects
        try:
            event_datetime = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
            logger.info(f"Successfully parsed date_str and time_str to event_datetime: {event_datetime}")
        except ValueError as e:
            # If there's any issue with the date format, use current time as fallback
            logger.warning(f"Invalid date/time format: {date_str}, {time_str}. Error: {e}. Using current time.")
            event_datetime = fallback_datetime
        except Exception as e:
            # Catch any other unexpected errors
            logger.error(f"Unexpected error parsing datetime: {e}. Using current time.")
            event_datetime = fallback_datetime

        # Calculate end time based on duration
        duration_minutes = 60  # Default duration is 60 minutes

        try:
            if duration_str == "30min":
                duration_minutes = 30
            elif duration_str == "45min":
                duration_minutes = 45
            elif duration_str == "60min" or duration_str == "1h":
                duration_minutes = 60
            elif duration_str == "90min":
                duration_minutes = 90
            elif duration_str == "120min" or duration_str == "2h":
                duration_minutes = 120
            else:
                # Default to 60 minutes if duration format is unexpected
                logger.warning(f"Unknown duration format: {duration_str}. Using default of 60 minutes.")
                duration_minutes = 60
        except Exception as e:
            logger.error(f"Error processing duration string: {e}. Using default of 60 minutes.")
            duration_minutes = 60

        # Calculate the end datetime with defensive coding to prevent None
        try:
            event_end_datetime = event_datetime + timedelta(minutes=duration_minutes)
            logger.info(f"Calculated event_end_datetime: {event_end_datetime}")
        except Exception as e:
            logger.error(f"Error calculating end time: {e}. Using fallback.")
            event_end_datetime = fallback_datetime + timedelta(minutes=duration_minutes)

        # Ultimate safeguard - NEVER return None values under any circumstances
        if not event_datetime:
            logger.error("CRITICAL: event_datetime is None despite fallbacks. Using current time.")
            event_datetime = datetime.utcnow()

        if not event_end_datetime:
            logger.error("CRITICAL: event_end_datetime is None despite fallbacks. Using current time + duration.")
            event_end_datetime = event_datetime + timedelta(minutes=duration_minutes)

        # Final sanity check - the start time must be before the end time
        if event_datetime >= event_end_datetime:
            logger.error(f"Start time {event_datetime} is not before end time {event_end_datetime}. Adjusting.")
            event_end_datetime = event_datetime + timedelta(minutes=60)

        logger.info(f"Returning start_time={event_datetime}, end_time={event_end_datetime}")
        return event_datetime, event_end_datetime

    @staticmethod
    def generate_meeting_title(process: Process, meeting_date: datetime, complexity: int, role: Optional[str] = None) -> str:
        """Generate a realistic meeting title based on process, date and role.

        Args:
            process: The process used as basis for the event
            meeting_date: The date of the meeting
            complexity: Complexity level (1-5)
            role: Optional role specifier to include in title

        Returns:
            str: A realistic meeting title
        """
        process_title_base = process.title.replace("Process", "").replace("Framework", "").strip()

        # Expanded title components for more variety
        meeting_types = [
            "Meeting", "Discussion", "Workshop", "Session", "Review", "Planning",
            "Briefing", "Sync", "Kickoff", "Retrospective", "Brainstorm",
            "Analysis", "Check-in", "Alignment", "Demo", "Overview", "Training",
            "Presentation", "Working Session", "Coordination", "Strategy Session", "Deep Dive"
        ]

        # Expanded team/department prefixes
        team_prefixes = [
            "", "Team ", "Project ", "Department ", "Cross-functional ",
            "Engineering ", "Design ", "Product ", "Platform ", "Core ",
            "Internal ", "External ", "Client ", "Stakeholder ", "Leadership "
        ]

        # Different day-specific prefixes
        day_prefixes = {
            0: ["Weekly ", "Monday ", "Start-of-Week ", ""],  # Monday
            1: ["Sprint ", "Planning ", "Tuesday ", ""],  # Tuesday
            2: ["Mid-week ", "Project ", "Milestone ", ""],  # Wednesday
            3: ["Status ", "Review ", "Thursday ", ""],  # Thursday
            4: ["Weekly ", "Progress ", "End-of-Week ", ""],  # Friday
            5: ["Weekend ", "Saturday ", ""],  # Saturday
            6: ["Sunday ", "Prep ", "Pre-week ", ""],  # Sunday
        }

        # Role-specific prefix if role is provided
        role_prefix = f"{role.capitalize()} " if role else ""

        # Format date for inclusion in title
        date_str = meeting_date.strftime("%b %d")  # e.g. "Apr 22"

        # Select components based on date and complexity
        day_of_week = meeting_date.weekday()

        # Common meetings on consistent days - use process name and date to vary them
        process_keyword = process_title_base.split()[0] if process_title_base.split() else "Team"

        # Special cases based on day of week
        if day_of_week == 0 and random.random() < 0.5:  # Monday
            if random.random() < 0.5:
                return f"{role_prefix}{process_keyword} Planning - {date_str}"
            else:
                return f"{role_prefix}{process_keyword} Kickoff - {date_str}"
        elif day_of_week == 2 and random.random() < 0.4:  # Wednesday
            if random.random() < 0.5:
                return f"Mid-week {role_prefix}{process_keyword} Update - {date_str}"
            else:
                return f"{role_prefix}{process_keyword} Progress Check - {date_str}"
        elif day_of_week == 4 and complexity >= 3 and random.random() < 0.4:  # Friday
            if random.random() < 0.5:
                return f"{role_prefix}{process_keyword} Review - {date_str}"
            else:
                return f"End-of-Week {role_prefix}{process_keyword} Retrospective - {date_str}"

        # For other days, generate a more varied title
        day_prefix = random.choice(day_prefixes.get(day_of_week, ["", ""]))
        team_prefix = random.choice(team_prefixes)
        meeting_type = random.choice(meeting_types)

        # Various title generation strategies for variety
        if random.random() < 0.3:
            # Option 1: Use full process title with meeting type
            title = f"{day_prefix}{role_prefix}{team_prefix}{process_title_base} {meeting_type}"
        elif random.random() < 0.4 and len(process_title_base.split()) > 1:
            # Option 2: Use just part of the process title
            process_words = process_title_base.split()
            partial_title = " ".join(process_words[:2]) if len(process_words) > 2 else process_words[0]
            title = f"{day_prefix}{role_prefix}{team_prefix}{partial_title} {meeting_type}"
        else:
            # Option 3: Add focus area
            focus_areas = [
                "Strategy", "Review", "Status", "Planning", "Progress",
                "Implementation", "Design", "Development", "Testing"
            ]
            focus = random.choice(focus_areas)
            title = f"{day_prefix}{role_prefix}{team_prefix}{process_title_base} {focus} {meeting_type}"

        # Always add date for uniqueness if not already included
        if date_str not in title:
            title = f"{title} - {date_str}"

        return title.strip()

    @staticmethod
    def create_process_from_template(template_process: Process, user: User, db: Session) -> Optional[Process]:
        """Create a process instance from a template process.

        Args:
            template_process: The template process to create an instance from
            user: The user who will own the process instance
            db: Database session

        Returns:
            Process: The newly created process instance or None if creation failed
        """
        if not template_process:
            return None

        # Skip if this is already an instance, not a template
        if not template_process.is_template:
            return template_process

        try:
            # Check if an instance of this template already exists for this user
            existing_instance = (
                db.query(Process).filter(
                    Process.template_id == template_process.id,
                    Process.created_by_id == user.id,
                    Process.is_template == False
                ).first()
            )

            if existing_instance:
                return existing_instance

            # Create a new process instance based on the template
            process_metadata = template_process.process_metadata.copy() if template_process.process_metadata else {}

            # Add a reference to the template in the metadata
            if not process_metadata:
                process_metadata = {}
            process_metadata["template_id"] = str(template_process.id)
            process_metadata["template_title"] = template_process.title

            process_instance = Process(
                id=str(uuid.uuid4()),
                title=template_process.title,
                description=template_process.description,
                color=template_process.color,
                last_updated=datetime.utcnow().isoformat(),
                favorite=False,  # Instances aren't favorites by default
                category=template_process.category,
                created_by_id=user.id,
                directory_id=template_process.directory_id,
                is_template=False,  # This is an instance, not a template
                template_id=template_process.id,  # Reference to the template
                process_metadata=process_metadata,
            )
            db.add(process_instance)
            db.flush()  # Get ID without committing

            # Clone steps from template
            if template_process.steps:
                for i, template_step in enumerate(template_process.steps):
                    # Create a new step based on the template step
                    step = Step(
                        id=str(uuid.uuid4()),
                        content=template_step.content,
                        completed=False,  # New instances start uncompleted
                        order=template_step.order,
                        due_date=template_step.due_date,
                        process_id=process_instance.id,
                    )
                    db.add(step)
                    db.flush()

                    # Clone sub-steps if any
                    if template_step.sub_steps:
                        for sub_step in template_step.sub_steps:
                            new_sub_step = SubStep(
                                id=str(uuid.uuid4()),
                                content=sub_step.content,
                                completed=False,  # New instances start uncompleted
                                order=sub_step.order,
                                step_id=step.id,
                            )
                            db.add(new_sub_step)

            return process_instance

        except Exception as e:
            logger.error(f"Error creating process from template: {e}")
            return None

    @staticmethod
    def create_event_metadata(complexity: int, category: str, tags: List[str],
                             template_id: Optional[str] = None) -> Dict[str, Any]:
        """Create standardized event metadata.

        Args:
            complexity: The event complexity level (1-5)
            category: The event category (e.g., "Work", "Personal")
            tags: List of tags to associate with the event
            template_id: Optional template process ID if this event is based on a template

        Returns:
            Dict[str, Any]: The event metadata dictionary
        """
        metadata = {
            "importance": complexity,
            "category": category,
            "tags": tags
        }

        # Add template reference if provided
        if template_id:
            metadata["template_process_id"] = template_id

        return metadata
