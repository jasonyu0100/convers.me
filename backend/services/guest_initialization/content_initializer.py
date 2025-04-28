"""
Content initialization module for connecting content across entities.
"""

import logging
import random
from typing import List

from sqlalchemy.orm import Session

from db.models import Event, EventStatusEnum, Media, MediaTypeEnum, Post, Process, Topic, User

# Set up logging
logger = logging.getLogger(__name__)


class ContentInitializer:
    """Handles creation of relationships between different content types."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db

    async def connect_processes_to_events(self, processes: List[Process], events: List[Event], topics: List[Topic]) -> None:
        """
        Connect processes to relevant events based on topics and categories.

        Args:
            processes: List of processes to connect
            events: List of events to connect to
            topics: List of topics for matching
        """
        # Match processes to events based on categories and topics
        for event in events:
            # Skip events that already have a process
            if event.process_id:
                continue

            event_tags = [topic.name for topic in event.topics]

            # Find a matching process based on category or topics
            matching_process = None

            for process in processes:
                # Try to match based on category overlap with event tags
                if process.category in event_tags:
                    matching_process = process
                    break

                # Try to match based on title similarity
                for tag in event_tags:
                    if tag.lower() in process.title.lower() or process.title.lower() in event.title.lower():
                        matching_process = process
                        break

            # If we found a match, connect the event to the process
            if matching_process:
                event.process_id = matching_process.id

                # Also adopt some steps from the process if the event doesn't have steps
                if not event.steps and matching_process.steps:
                    step_count = min(len(matching_process.steps), 3)
                    process_steps = sorted(matching_process.steps, key=lambda s: s.order)[:step_count]

                    for i, process_step in enumerate(process_steps):
                        # Copy the step for this event
                        from db.models import Step

                        step = Step(
                            content=process_step.content,
                            completed=False,
                            order=i + 1,
                            event_id=event.id,
                        )
                        self.db.add(step)

        self.db.commit()
        logger.info("Connected processes to relevant events")

    async def create_content_relationships(self, users: List[User], events: List[Event], posts: List[Post], media: List[Media]) -> None:
        """
        Create relationships between different types of content.

        Args:
            users: List of users
            events: List of events
            posts: List of posts
            media: List of media
        """
        try:
            # Associate some events with user posts
            if events and posts:
                completed_events = [e for e in events if e.status == EventStatusEnum.DONE]
                if completed_events:
                    for post in random.sample(posts, min(5, len(posts))):
                        if not post.event_id:  # Only process posts not already assigned to events
                            random_event = random.choice(completed_events)
                            post.event_id = random_event.id

            # Create media attachments for events without media
            if events:
                for event in events:
                    # Add media to events that don't have associated media
                    if not any(m.event_id == event.id for m in media):
                        # 70% chance to add media to an event
                        if random.random() < 0.7:
                            media_type = random.choice([MediaTypeEnum.IMAGE, MediaTypeEnum.AUDIO, MediaTypeEnum.VIDEO])

                            new_media = Media(
                                type=media_type,
                                title=f"Media for {event.title}",
                                url=self._get_media_url(media_type),
                                duration=(
                                    f"{random.randint(1, 60)}:{random.randint(10, 59)}" if media_type in [MediaTypeEnum.AUDIO, MediaTypeEnum.VIDEO] else None
                                ),
                                aspect_ratio=("16/9" if media_type in [MediaTypeEnum.IMAGE, MediaTypeEnum.VIDEO] else None),
                                event_id=event.id,
                                created_by_id=event.created_by_id,
                                media_metadata={
                                    "category": "Event Media",
                                    "aspectRatio": ("16/9" if media_type in [MediaTypeEnum.IMAGE, MediaTypeEnum.VIDEO] else None),
                                    "isEvent": True,
                                },
                            )
                            self.db.add(new_media)
                            media.append(new_media)

            self.db.commit()
            logger.info("Created content relationships")
        except Exception as e:
            logger.error(f"Error creating content relationships: {e}")
            self.db.rollback()

    def _get_media_url(self, media_type: MediaTypeEnum) -> str:
        """
        Get a media URL for the given media type.

        Args:
            media_type: The type of media

        Returns:
            str: The media URL
        """
        if media_type == MediaTypeEnum.IMAGE:
            return f"/image/stock-image-{random.randint(1, 4)}.jpg"
        elif media_type == MediaTypeEnum.AUDIO:
            return f"/audio/stock-audio-{random.randint(1, 4)}.mp3"
        elif media_type == MediaTypeEnum.VIDEO:
            return f"/video/stock-video-{random.randint(1, 4)}.mp4"
        else:
            return "#"
