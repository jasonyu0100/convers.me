"""
Topic initialization module for sample topic creation.
"""

import logging
import uuid
from typing import Dict, List

from sqlalchemy.orm import Session

from db.models import Topic

# Set up logging
logger = logging.getLogger(__name__)


class TopicInitializer:
    """Handles creation of topics for the application."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db

    async def create_default_topics(self) -> List[Topic]:
        """
        Create default topics for the application.

        Returns:
            List[Topic]: Created topics
        """
        default_topics = [
            {"name": "Development", "category": "Work", "color": "blue"},
            {"name": "Design", "category": "Work", "color": "purple"},
            {"name": "Planning", "category": "Work", "color": "green"},
            {"name": "Marketing", "category": "Work", "color": "orange"},
            {"name": "Research", "category": "Work", "color": "teal"},
            {"name": "Testing", "category": "Work", "color": "red"},
            {"name": "Product", "category": "Work", "color": "indigo"},
            {"name": "Management", "category": "Work", "color": "amber"},
        ]

        return await self._create_topics(default_topics)

    async def create_work_topics(self) -> List[Topic]:
        """
        Create realistic work-focused topics matching frontend data.

        Returns:
            List[Topic]: Created topics
        """
        # Get default topics first
        topics = await self.create_default_topics()

        # Topic data from frontend mockTopics
        work_topics = [
            {
                "id": "topic-1",
                "name": "Frontend",
                "category": "Technical",
                "color": "blue",
            },
            {
                "id": "topic-2",
                "name": "Backend",
                "category": "Technical",
                "color": "indigo",
            },
            {
                "id": "topic-3",
                "name": "Database",
                "category": "Technical",
                "color": "red",
            },
            {"id": "topic-4", "name": "API", "category": "Technical", "color": "teal"},
            {
                "id": "topic-5",
                "name": "CI/CD",
                "category": "Technical",
                "color": "amber",
            },
            {
                "id": "topic-6",
                "name": "Testing",
                "category": "Technical",
                "color": "red",
            },
            {
                "id": "topic-7",
                "name": "DevOps",
                "category": "Technical",
                "color": "teal",
            },
            {
                "id": "topic-8",
                "name": "Security",
                "category": "Technical",
                "color": "amber",
            },
            {
                "id": "topic-9",
                "name": "Bug Fix",
                "category": "Work Type",
                "color": "red",
            },
            {
                "id": "topic-10",
                "name": "Feature",
                "category": "Work Type",
                "color": "blue",
            },
            {
                "id": "topic-11",
                "name": "Refactoring",
                "category": "Work Type",
                "color": "indigo",
            },
            {
                "id": "topic-12",
                "name": "Documentation",
                "category": "Work Type",
                "color": "green",
            },
            {
                "id": "topic-13",
                "name": "Code Review",
                "category": "Work Type",
                "color": "purple",
            },
            {
                "id": "topic-14",
                "name": "Performance",
                "category": "Work Type",
                "color": "orange",
            },
            {
                "id": "topic-15",
                "name": "React",
                "category": "Technology",
                "color": "blue",
            },
            {
                "id": "topic-16",
                "name": "Node.js",
                "category": "Technology",
                "color": "green",
            },
            {
                "id": "topic-17",
                "name": "TypeScript",
                "category": "Technology",
                "color": "blue",
            },
            {
                "id": "topic-18",
                "name": "Python",
                "category": "Technology",
                "color": "teal",
            },
            {
                "id": "topic-19",
                "name": "Docker",
                "category": "Technology",
                "color": "blue",
            },
            {
                "id": "topic-20",
                "name": "AWS",
                "category": "Technology",
                "color": "orange",
            },
        ]

        # Add additional topics
        additional_topics = await self._create_topics(work_topics)
        topics.extend(additional_topics)

        logger.info(f"Created {len(topics)} total topics")
        return topics

    async def _create_topics(self, topic_data_list: List[Dict[str, str]]) -> List[Topic]:
        """
        Helper method to create topics from a list of topic data.

        Args:
            topic_data_list: List of topic data dictionaries

        Returns:
            List[Topic]: Created topics
        """
        topics = []
        for topic_data in topic_data_list:
            # Check if topic exists
            existing = self.db.query(Topic).filter(Topic.name == topic_data["name"]).first()
            if existing:
                topics.append(existing)
                continue

            # Always use UUID for database compatibility
            topic_id = uuid.uuid4()

            topic = Topic(
                id=topic_id,
                name=topic_data["name"],
                category=topic_data.get("category", "General"),
                color=topic_data.get("color", "blue"),
            )
            self.db.add(topic)
            topics.append(topic)

        self.db.commit()
        for topic in topics:
            self.db.refresh(topic)

        return topics
