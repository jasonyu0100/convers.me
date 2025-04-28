"""
Insight initialization module for sample data creation.
"""

import logging
from datetime import datetime
from typing import Dict

from sqlalchemy.orm import Session

from db.models import User

# Set up logging
logger = logging.getLogger(__name__)


class InsightInitializer:
    """Handles creation of sample insight data for users."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db

    async def create_insights_data(self, user: User, role: str) -> Dict:
        """
        Create role-specific insight data for a user.

        Args:
            user: The user to create insights for
            role: The role of the user (dev, designer, pm, etc.)

        Returns:
            Dict: Dictionary with created insight metrics
        """
        logger.info(f"Creating insights data for user {user.handle} with role {role}")

        # Generate role-specific metrics based on the user's role
        metrics = self._generate_role_metrics(role)

        # Create additional insights data that will be useful for rendering insights
        # This would involve setting up events, processes, and other data that
        # the insights API will query to generate metrics.

        # Connect the insights data to the user's processes and events
        await self._connect_insights_to_user_data(user, metrics)

        logger.info(f"Created insights data for user {user.handle}")
        return metrics

    async def create_role_insights_data(self, user: User, role: str) -> Dict:
        """
        Create role-specific insights data for a guest user.

        Args:
            user: The user to create insights for
            role: The role of the user

        Returns:
            Dict: Dictionary with created insight metrics
        """
        # Map frontend roles to more specific backend roles if needed
        role_mapping = {
            "dev": "developer",
            "pm": "product_manager",
            "designer": "designer",
            "ops": "operations",
            "intern": "intern",
            "leadership": "leadership",
            "marketing": "marketing",
        }

        internal_role = role_mapping.get(role, role)

        # Generate insights data based on the role
        metrics = self._generate_role_metrics(internal_role)

        # Connect the insights to the user's existing data
        await self._connect_insights_to_user_data(user, metrics)

        logger.info(f"Created role-specific insights for user {user.handle} with role {internal_role}")
        return metrics

    def _generate_role_metrics(self, role: str) -> Dict:
        """
        Generate role-specific metrics for the insights data.

        Args:
            role: The role of the user

        Returns:
            Dict: Dictionary with role-specific metrics
        """
        # Base metrics that apply to all roles
        metrics = {
            "completion_rate": 85,
            "events_completed": 24,
            "steps_completed": 120,
            "time_spent": 38,  # hours
            "avg_complexity": 3.2,
            "efficiency": 78,
        }

        # Role-specific adjustments
        if role == "developer":
            metrics.update(
                {
                    "completion_rate": 92,  # Developers tend to have high completion rates
                    "time_spent": 45,  # More hours spent
                    "avg_complexity": 4.1,  # Higher complexity
                    "tag_distribution": [
                        {"tag": "Frontend", "count": 12, "percentage": 35.3, "color": "bg-blue-500"},
                        {"tag": "Backend", "count": 10, "percentage": 29.4, "color": "bg-purple-500"},
                        {"tag": "DevOps", "count": 6, "percentage": 17.6, "color": "bg-orange-500"},
                        {"tag": "Testing", "count": 4, "percentage": 11.8, "color": "bg-green-500"},
                        {"tag": "Documentation", "count": 2, "percentage": 5.9, "color": "bg-gray-500"},
                    ],
                    "effort_distribution": [
                        {
                            "category": "Coding",
                            "value": 1800,
                            "total": 2700,
                            "percentage": 66.7,
                            "color": "bg-blue-500",
                        },
                        {
                            "category": "Code Review",
                            "value": 450,
                            "total": 2700,
                            "percentage": 16.7,
                            "color": "bg-purple-500",
                        },
                        {
                            "category": "Meetings",
                            "value": 300,
                            "total": 2700,
                            "percentage": 11.1,
                            "color": "bg-yellow-500",
                        },
                        {
                            "category": "Documentation",
                            "value": 150,
                            "total": 2700,
                            "percentage": 5.5,
                            "color": "bg-gray-500",
                        },
                    ],
                }
            )
        elif role == "designer":
            metrics.update(
                {
                    "completion_rate": 88,
                    "time_spent": 40,
                    "avg_complexity": 3.8,
                    "tag_distribution": [
                        {"tag": "UI Design", "count": 14, "percentage": 38.9, "color": "bg-purple-500"},
                        {"tag": "UX Research", "count": 9, "percentage": 25.0, "color": "bg-blue-500"},
                        {"tag": "Prototyping", "count": 8, "percentage": 22.2, "color": "bg-green-500"},
                        {"tag": "Design System", "count": 3, "percentage": 8.3, "color": "bg-yellow-500"},
                        {"tag": "User Testing", "count": 2, "percentage": 5.6, "color": "bg-orange-500"},
                    ],
                    "effort_distribution": [
                        {
                            "category": "Design Work",
                            "value": 1600,
                            "total": 2400,
                            "percentage": 66.7,
                            "color": "bg-purple-500",
                        },
                        {
                            "category": "Research",
                            "value": 400,
                            "total": 2400,
                            "percentage": 16.7,
                            "color": "bg-blue-500",
                        },
                        {
                            "category": "Feedback",
                            "value": 250,
                            "total": 2400,
                            "percentage": 10.4,
                            "color": "bg-green-500",
                        },
                        {
                            "category": "Meetings",
                            "value": 150,
                            "total": 2400,
                            "percentage": 6.2,
                            "color": "bg-yellow-500",
                        },
                    ],
                }
            )
        elif role == "product_manager":
            metrics.update(
                {
                    "completion_rate": 87,
                    "time_spent": 42,
                    "avg_complexity": 3.5,
                    "tag_distribution": [
                        {"tag": "Planning", "count": 12, "percentage": 30.0, "color": "bg-blue-500"},
                        {"tag": "Requirements", "count": 10, "percentage": 25.0, "color": "bg-green-500"},
                        {"tag": "Stakeholder", "count": 8, "percentage": 20.0, "color": "bg-purple-500"},
                        {"tag": "Roadmap", "count": 6, "percentage": 15.0, "color": "bg-yellow-500"},
                        {"tag": "User Research", "count": 4, "percentage": 10.0, "color": "bg-orange-500"},
                    ],
                    "effort_distribution": [
                        {
                            "category": "Planning",
                            "value": 1050,
                            "total": 2520,
                            "percentage": 41.7,
                            "color": "bg-blue-500",
                        },
                        {
                            "category": "Meetings",
                            "value": 840,
                            "total": 2520,
                            "percentage": 33.3,
                            "color": "bg-green-500",
                        },
                        {
                            "category": "Documentation",
                            "value": 380,
                            "total": 2520,
                            "percentage": 15.1,
                            "color": "bg-purple-500",
                        },
                        {
                            "category": "Research",
                            "value": 250,
                            "total": 2520,
                            "percentage": 9.9,
                            "color": "bg-yellow-500",
                        },
                    ],
                }
            )
        elif role == "operations":
            metrics.update(
                {
                    "completion_rate": 94,  # Ops teams often have high completion rates
                    "time_spent": 44,
                    "avg_complexity": 3.3,
                    "tag_distribution": [
                        {"tag": "Infrastructure", "count": 13, "percentage": 32.5, "color": "bg-blue-500"},
                        {"tag": "CI/CD", "count": 10, "percentage": 25.0, "color": "bg-green-500"},
                        {"tag": "Monitoring", "count": 9, "percentage": 22.5, "color": "bg-orange-500"},
                        {"tag": "Security", "count": 5, "percentage": 12.5, "color": "bg-red-500"},
                        {"tag": "Documentation", "count": 3, "percentage": 7.5, "color": "bg-gray-500"},
                    ],
                    "effort_distribution": [
                        {
                            "category": "Maintenance",
                            "value": 1100,
                            "total": 2640,
                            "percentage": 41.7,
                            "color": "bg-blue-500",
                        },
                        {
                            "category": "Deployment",
                            "value": 880,
                            "total": 2640,
                            "percentage": 33.3,
                            "color": "bg-green-500",
                        },
                        {
                            "category": "Monitoring",
                            "value": 440,
                            "total": 2640,
                            "percentage": 16.7,
                            "color": "bg-orange-500",
                        },
                        {
                            "category": "Meetings",
                            "value": 220,
                            "total": 2640,
                            "percentage": 8.3,
                            "color": "bg-yellow-500",
                        },
                    ],
                }
            )
        elif role == "intern":
            metrics.update(
                {
                    "completion_rate": 82,  # Interns may have slightly lower rates as they learn
                    "time_spent": 35,
                    "avg_complexity": 2.8,  # Lower complexity tasks typically
                    "tag_distribution": [
                        {"tag": "Learning", "count": 15, "percentage": 37.5, "color": "bg-blue-500"},
                        {"tag": "Development", "count": 10, "percentage": 25.0, "color": "bg-green-500"},
                        {"tag": "Research", "count": 8, "percentage": 20.0, "color": "bg-purple-500"},
                        {"tag": "Testing", "count": 4, "percentage": 10.0, "color": "bg-yellow-500"},
                        {"tag": "Documentation", "count": 3, "percentage": 7.5, "color": "bg-gray-500"},
                    ],
                    "effort_distribution": [
                        {
                            "category": "Learning",
                            "value": 1050,
                            "total": 2100,
                            "percentage": 50.0,
                            "color": "bg-blue-500",
                        },
                        {
                            "category": "Development",
                            "value": 630,
                            "total": 2100,
                            "percentage": 30.0,
                            "color": "bg-green-500",
                        },
                        {
                            "category": "Meetings",
                            "value": 210,
                            "total": 2100,
                            "percentage": 10.0,
                            "color": "bg-yellow-500",
                        },
                        {
                            "category": "Documentation",
                            "value": 210,
                            "total": 2100,
                            "percentage": 10.0,
                            "color": "bg-gray-500",
                        },
                    ],
                }
            )
        elif role == "leadership":
            metrics.update(
                {
                    "completion_rate": 90,
                    "time_spent": 46,
                    "avg_complexity": 3.9,
                    "tag_distribution": [
                        {"tag": "Strategy", "count": 14, "percentage": 35.0, "color": "bg-blue-500"},
                        {"tag": "Team", "count": 12, "percentage": 30.0, "color": "bg-green-500"},
                        {"tag": "Planning", "count": 8, "percentage": 20.0, "color": "bg-purple-500"},
                        {"tag": "Performance", "count": 4, "percentage": 10.0, "color": "bg-yellow-500"},
                        {"tag": "Hiring", "count": 2, "percentage": 5.0, "color": "bg-orange-500"},
                    ],
                    "effort_distribution": [
                        {
                            "category": "Meetings",
                            "value": 1380,
                            "total": 2760,
                            "percentage": 50.0,
                            "color": "bg-blue-500",
                        },
                        {
                            "category": "Strategy",
                            "value": 690,
                            "total": 2760,
                            "percentage": 25.0,
                            "color": "bg-green-500",
                        },
                        {
                            "category": "Reviews",
                            "value": 414,
                            "total": 2760,
                            "percentage": 15.0,
                            "color": "bg-purple-500",
                        },
                        {
                            "category": "Planning",
                            "value": 276,
                            "total": 2760,
                            "percentage": 10.0,
                            "color": "bg-yellow-500",
                        },
                    ],
                }
            )
        elif role == "marketing":
            metrics.update(
                {
                    "completion_rate": 88,
                    "time_spent": 39,
                    "avg_complexity": 3.4,
                    "tag_distribution": [
                        {"tag": "Content", "count": 11, "percentage": 28.2, "color": "bg-blue-500"},
                        {"tag": "Campaigns", "count": 10, "percentage": 25.6, "color": "bg-green-500"},
                        {"tag": "Analytics", "count": 8, "percentage": 20.5, "color": "bg-purple-500"},
                        {"tag": "Social Media", "count": 6, "percentage": 15.4, "color": "bg-yellow-500"},
                        {"tag": "SEO", "count": 4, "percentage": 10.3, "color": "bg-orange-500"},
                    ],
                    "effort_distribution": [
                        {
                            "category": "Content Creation",
                            "value": 1170,
                            "total": 2340,
                            "percentage": 50.0,
                            "color": "bg-blue-500",
                        },
                        {
                            "category": "Planning",
                            "value": 585,
                            "total": 2340,
                            "percentage": 25.0,
                            "color": "bg-green-500",
                        },
                        {
                            "category": "Analytics",
                            "value": 351,
                            "total": 2340,
                            "percentage": 15.0,
                            "color": "bg-purple-500",
                        },
                        {
                            "category": "Meetings",
                            "value": 234,
                            "total": 2340,
                            "percentage": 10.0,
                            "color": "bg-yellow-500",
                        },
                    ],
                }
            )
        else:
            # Default metrics
            metrics.update(
                {
                    "tag_distribution": [
                        {"tag": "General", "count": 10, "percentage": 41.7, "color": "bg-blue-500"},
                        {"tag": "Planning", "count": 8, "percentage": 33.3, "color": "bg-green-500"},
                        {"tag": "Execution", "count": 6, "percentage": 25.0, "color": "bg-yellow-500"},
                    ],
                    "effort_distribution": [
                        {"category": "Tasks", "value": 1500, "total": 2280, "percentage": 65.8, "color": "bg-blue-500"},
                        {
                            "category": "Meetings",
                            "value": 500,
                            "total": 2280,
                            "percentage": 21.9,
                            "color": "bg-green-500",
                        },
                        {
                            "category": "Admin",
                            "value": 280,
                            "total": 2280,
                            "percentage": 12.3,
                            "color": "bg-yellow-500",
                        },
                    ],
                }
            )

        return metrics

    async def _connect_insights_to_user_data(self, user: User, metrics: Dict) -> None:
        """
        Connect insights metrics to user's existing data (events, processes, etc.)

        Args:
            user: The user to connect insights for
            metrics: The metrics to associate with user data
        """
        # In a real implementation, we would modify the user's events, processes, etc.,
        # to align with the metrics we've generated. For example:
        # - Update event durations to match time spent metrics
        # - Set event complexity values to align with avg_complexity
        # - Adjust process completion status to match completion rate

        # This is a placeholder implementation focusing on storing
        # insights-related metadata in the user object

        # Store insight metrics in user metadata for future reference
        if not user.user_metadata:
            user.user_metadata = {}

        # Add or update insights metrics in user metadata
        if "insights" not in user.user_metadata:
            user.user_metadata["insights"] = {}

        user.user_metadata["insights"].update(
            {
                "last_updated": datetime.utcnow().isoformat(),
                "metrics": {
                    "completion_rate": metrics.get("completion_rate", 85),
                    "events_completed": metrics.get("events_completed", 24),
                    "steps_completed": metrics.get("steps_completed", 120),
                    "time_spent": metrics.get("time_spent", 38),
                    "avg_complexity": metrics.get("avg_complexity", 3.2),
                    "efficiency": metrics.get("efficiency", 78),
                },
            }
        )

        # Update user and commit changes
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
