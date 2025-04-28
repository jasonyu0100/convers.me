"""
Directory initialization module for organizing processes.
"""

import logging
import uuid
from typing import List

from sqlalchemy.orm import Session

from db.models import Directory, User

# Set up logging
logger = logging.getLogger(__name__)


class DirectoryInitializer:
    """Handles creation of directories for organizing processes."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db

    async def create_directories(self, users: List[User], directory_count: int = 4) -> List[Directory]:
        """
        Create directories for organizing processes.

        Args:
            users: List of users to assign directories to
            directory_count: Number of top-level directories to create (default: 4)

        Returns:
            List[Directory]: Created directories
        """
        # Define directory structure with main directories and subdirectories
        directory_definitions = [
            {
                "name": "Feature Development",
                "description": "Processes for developing new features",
                "color": "blue",
                "owner": "jasonyu",
                "category_id": "feature-development",
                "subdirectories": [
                    {"name": "Frontend Features", "description": "Processes for frontend feature development", "color": "blue"},
                    {"name": "Backend APIs", "description": "Processes for API development", "color": "indigo"},
                    {"name": "Mobile Apps", "description": "Processes for mobile app development", "color": "emerald"},
                ],
            },
            {
                "name": "Code Quality & Testing",
                "description": "Processes for ensuring code quality",
                "color": "purple",
                "owner": "mchen",
                "category_id": "code-quality",
                "subdirectories": [
                    {"name": "Unit Testing", "description": "Processes for unit test development", "color": "purple"},
                    {"name": "Integration Tests", "description": "Processes for integration testing", "color": "pink"},
                ],
            },
            {
                "name": "Agile Ceremonies",
                "description": "Processes for agile ceremonies",
                "color": "green",
                "owner": "sarahj",
                "category_id": "agile-ceremonies",
                "subdirectories": [
                    {"name": "Sprint Planning", "description": "Processes for sprint planning sessions", "color": "green"},
                    {"name": "Retrospectives", "description": "Processes for retrospective meetings", "color": "teal"},
                    {"name": "Standups", "description": "Processes for daily standup meetings", "color": "emerald"},
                ],
            },
            {
                "name": "DevOps Processes",
                "description": "Processes for DevOps",
                "color": "orange",
                "owner": "carlos",
                "category_id": "devops-processes",
                "subdirectories": [
                    {"name": "CI/CD Pipelines", "description": "Processes for continuous integration and deployment", "color": "orange"},
                    {"name": "Infrastructure", "description": "Processes for infrastructure management", "color": "amber"},
                    {"name": "Monitoring", "description": "Processes for system monitoring", "color": "red"},
                ],
            },
            {
                "name": "Product Management",
                "description": "Processes for product management",
                "color": "teal",
                "owner": "sarahj",
                "category_id": "product-management",
                "subdirectories": [
                    {"name": "User Stories", "description": "Processes for creating user stories", "color": "teal"},
                    {"name": "Roadmap Planning", "description": "Processes for roadmap development", "color": "green"},
                    {"name": "Customer Feedback", "description": "Processes for gathering customer feedback", "color": "cyan"},
                ],
            },
            {
                "name": "Design Workflows",
                "description": "Processes for design work",
                "color": "pink",
                "owner": "aishap",
                "category_id": "design-workflows",
                "subdirectories": [
                    {"name": "UI Design", "description": "Processes for user interface design", "color": "pink"},
                    {"name": "UX Research", "description": "Processes for user experience research", "color": "purple"},
                    {"name": "Design Systems", "description": "Processes for creating design systems", "color": "fuchsia"},
                ],
            },
            {
                "name": "Data Analysis",
                "description": "Processes for data analysis",
                "color": "amber",
                "owner": "alexb",
                "category_id": "data-analysis",
                "subdirectories": [
                    {"name": "Data Collection", "description": "Processes for collecting data", "color": "amber"},
                    {"name": "Data Processing", "description": "Processes for processing and cleaning data", "color": "yellow"},
                    {"name": "Insights & Reporting", "description": "Processes for generating insights", "color": "orange"},
                ],
            },
            {
                "name": "Content Creation",
                "description": "Processes for content creation",
                "color": "indigo",
                "owner": "emmaw",
                "category_id": "content-creation",
                "subdirectories": [
                    {"name": "Blog Articles", "description": "Processes for writing blog posts", "color": "indigo"},
                    {"name": "Social Media", "description": "Processes for social media content", "color": "blue"},
                    {"name": "Documentation", "description": "Processes for technical documentation", "color": "violet"},
                ],
            },
            {
                "name": "Customer Success",
                "description": "Processes for customer success",
                "color": "emerald",
                "owner": "alexb",
                "category_id": "customer-success",
                "subdirectories": [
                    {"name": "Onboarding", "description": "Processes for customer onboarding", "color": "emerald"},
                    {"name": "Support Workflows", "description": "Processes for customer support", "color": "green"},
                    {"name": "Customer Retention", "description": "Processes for improving retention", "color": "lime"},
                ],
            },
            {
                "name": "Team Building",
                "description": "Processes for team building",
                "color": "red",
                "owner": "jasonyu",
                "category_id": "team-building",
                "subdirectories": [
                    {"name": "Team Activities", "description": "Processes for team building activities", "color": "red"},
                    {"name": "Performance Reviews", "description": "Processes for performance assessment", "color": "rose"},
                    {"name": "Skill Development", "description": "Processes for skill building", "color": "pink"},
                ],
            },
        ]

        # Take only the requested number of directories
        directory_definitions = directory_definitions[:directory_count]

        all_directories = []
        for dir_def in directory_definitions:
            # Find user by handle
            created_by = next((u for u in users if u.handle == dir_def["owner"]), users[0])

            # Check if directory exists
            existing = self.db.query(Directory).filter(Directory.name == dir_def["name"], Directory.created_by_id == created_by.id).first()

            if existing:
                all_directories.append(existing)

                # Check if subdirectories exist
                if "subdirectories" in dir_def:
                    for subdir_def in dir_def["subdirectories"]:
                        existing_subdir = self.db.query(Directory).filter(Directory.name == subdir_def["name"], Directory.parent_id == existing.id).first()

                        if not existing_subdir:
                            # Create subdirectory
                            subdirectory = Directory(
                                id=str(uuid.uuid4()),
                                name=subdir_def["name"],
                                description=subdir_def["description"],
                                color=subdir_def["color"],
                                created_by_id=created_by.id,
                                parent_id=existing.id,
                                directory_metadata={"category_id": dir_def["category_id"], "public": True},
                            )
                            self.db.add(subdirectory)
                            all_directories.append(subdirectory)

                continue

            # Create directory
            directory = Directory(
                id=str(uuid.uuid4()),
                name=dir_def["name"],
                description=dir_def["description"],
                color=dir_def["color"],
                created_by_id=created_by.id,
                parent_id=None,
                directory_metadata={"category_id": dir_def["category_id"], "public": True},
            )
            self.db.add(directory)
            self.db.flush()  # Get ID without committing
            all_directories.append(directory)

            # Create subdirectories if defined
            if "subdirectories" in dir_def:
                for subdir_def in dir_def["subdirectories"]:
                    subdirectory = Directory(
                        id=str(uuid.uuid4()),
                        name=subdir_def["name"],
                        description=subdir_def["description"],
                        color=subdir_def["color"],
                        created_by_id=created_by.id,
                        parent_id=directory.id,
                        directory_metadata={"category_id": dir_def["category_id"], "public": True},
                    )
                    self.db.add(subdirectory)
                    all_directories.append(subdirectory)

        self.db.commit()
        for directory in all_directories:
            self.db.refresh(directory)

        logger.info(f"Created {len(all_directories)} directories and subdirectories")
        return all_directories

    async def create_role_directories(self, user: User, role: str) -> List[Directory]:
        """
        Create role-specific directories for a guest user.

        Args:
            user: The user to create directories for
            role: The role of the user

        Returns:
            List[Directory]: Created directories
        """
        # Define role-specific directory structures with subdirectories
        role_directory_templates = {
            "dev": [
                {
                    "name": "Development Processes",
                    "description": "Processes for software development",
                    "color": "blue",
                    "category_id": "feature-development",
                    "subdirectories": [
                        {"name": "Feature Development", "description": "Processes for feature implementation", "color": "blue"},
                        {"name": "Code Refactoring", "description": "Processes for code improvement", "color": "indigo"},
                    ],
                },
                {
                    "name": "Testing & QA",
                    "description": "Processes for testing and quality assurance",
                    "color": "purple",
                    "category_id": "code-quality",
                    "subdirectories": [
                        {"name": "Automated Testing", "description": "Processes for test automation", "color": "purple"},
                        {"name": "Manual Testing", "description": "Processes for manual QA", "color": "pink"},
                    ],
                },
                {
                    "name": "Team Meetings",
                    "description": "Processes for team meetings",
                    "color": "green",
                    "category_id": "agile-ceremonies",
                    "subdirectories": [
                        {"name": "Daily Standups", "description": "Processes for daily team meetings", "color": "green"},
                        {"name": "Code Reviews", "description": "Processes for code review sessions", "color": "emerald"},
                    ],
                },
            ],
            "designer": [
                {
                    "name": "Design Processes",
                    "description": "Processes for design work",
                    "color": "purple",
                    "category_id": "feature-development",
                    "subdirectories": [
                        {"name": "UI Design", "description": "Processes for interface design", "color": "purple"},
                        {"name": "Visual Design", "description": "Processes for visual elements", "color": "pink"},
                    ],
                },
                {
                    "name": "Research",
                    "description": "Processes for user research",
                    "color": "indigo",
                    "category_id": "code-quality",
                    "subdirectories": [
                        {"name": "User Testing", "description": "Processes for user testing sessions", "color": "indigo"},
                        {"name": "Data Analysis", "description": "Processes for analyzing research data", "color": "blue"},
                    ],
                },
                {
                    "name": "Team Collaboration",
                    "description": "Processes for team collaboration",
                    "color": "green",
                    "category_id": "agile-ceremonies",
                    "subdirectories": [
                        {"name": "Design Reviews", "description": "Processes for design critique sessions", "color": "green"},
                        {"name": "Dev Handoffs", "description": "Processes for handing designs to developers", "color": "teal"},
                    ],
                },
            ],
            "pm": [
                {
                    "name": "Product Planning",
                    "description": "Processes for product planning",
                    "color": "green",
                    "category_id": "feature-development",
                    "subdirectories": [
                        {"name": "Feature Definition", "description": "Processes for defining product features", "color": "green"},
                        {"name": "Requirements Gathering", "description": "Processes for gathering requirements", "color": "emerald"},
                    ],
                },
                {
                    "name": "User Feedback",
                    "description": "Processes for gathering user feedback",
                    "color": "amber",
                    "category_id": "code-quality",
                    "subdirectories": [
                        {"name": "Customer Interviews", "description": "Processes for interviewing customers", "color": "amber"},
                        {"name": "Beta Programs", "description": "Processes for beta testing", "color": "yellow"},
                    ],
                },
                {
                    "name": "Roadmap Planning",
                    "description": "Processes for roadmap planning",
                    "color": "blue",
                    "category_id": "agile-ceremonies",
                    "subdirectories": [
                        {"name": "Quarterly Planning", "description": "Processes for quarterly roadmap sessions", "color": "blue"},
                        {"name": "Long-term Vision", "description": "Processes for long-term product vision", "color": "indigo"},
                    ],
                },
            ],
            "marketing": [
                {
                    "name": "Marketing Campaigns",
                    "description": "Processes for marketing campaigns",
                    "color": "orange",
                    "category_id": "feature-development",
                    "subdirectories": [
                        {"name": "Campaign Planning", "description": "Processes for planning campaigns", "color": "orange"},
                        {"name": "Campaign Execution", "description": "Processes for executing campaigns", "color": "amber"},
                    ],
                },
                {
                    "name": "Content Creation",
                    "description": "Processes for content creation",
                    "color": "blue",
                    "category_id": "code-quality",
                    "subdirectories": [
                        {"name": "Blog Articles", "description": "Processes for creating blog content", "color": "blue"},
                        {"name": "Social Media", "description": "Processes for social media content", "color": "indigo"},
                    ],
                },
                {
                    "name": "Analytics",
                    "description": "Processes for analytics",
                    "color": "indigo",
                    "category_id": "agile-ceremonies",
                    "subdirectories": [
                        {"name": "Performance Tracking", "description": "Processes for tracking campaign performance", "color": "indigo"},
                        {"name": "Reporting", "description": "Processes for creating analytics reports", "color": "violet"},
                    ],
                },
            ],
            "ops": [
                {
                    "name": "Operations Processes",
                    "description": "Processes for operations and infrastructure",
                    "color": "orange",
                    "category_id": "devops-processes",
                    "subdirectories": [
                        {"name": "Infrastructure Management", "description": "Processes for managing infrastructure", "color": "orange"},
                        {"name": "Cloud Resources", "description": "Processes for cloud resource management", "color": "amber"},
                    ],
                },
                {
                    "name": "System Monitoring",
                    "description": "Processes for system monitoring and maintenance",
                    "color": "red",
                    "category_id": "code-quality",
                    "subdirectories": [
                        {"name": "Alerts", "description": "Processes for alert management", "color": "red"},
                        {"name": "Dashboards", "description": "Processes for monitoring dashboards", "color": "pink"},
                    ],
                },
                {
                    "name": "Deployment Pipelines",
                    "description": "Processes for CI/CD pipelines",
                    "color": "blue",
                    "category_id": "feature-development",
                    "subdirectories": [
                        {"name": "CI Pipelines", "description": "Processes for continuous integration", "color": "blue"},
                        {"name": "CD Processes", "description": "Processes for continuous deployment", "color": "indigo"},
                    ],
                },
            ],
            "intern": [
                {
                    "name": "Learning Resources",
                    "description": "Processes for skill development",
                    "color": "green",
                    "category_id": "code-quality",
                    "subdirectories": [
                        {"name": "Training Materials", "description": "Processes for training content", "color": "green"},
                        {"name": "Skill Tracks", "description": "Processes for skill development paths", "color": "emerald"},
                    ],
                },
                {
                    "name": "Project Tasks",
                    "description": "Processes for assigned projects",
                    "color": "blue",
                    "category_id": "feature-development",
                    "subdirectories": [
                        {"name": "Current Projects", "description": "Processes for active projects", "color": "blue"},
                        {"name": "Project Ideas", "description": "Processes for potential projects", "color": "indigo"},
                    ],
                },
                {
                    "name": "Documentation",
                    "description": "Processes for creating documentation",
                    "color": "purple",
                    "category_id": "agile-ceremonies",
                    "subdirectories": [
                        {"name": "Code Documentation", "description": "Processes for documenting code", "color": "purple"},
                        {"name": "User Guides", "description": "Processes for creating user guides", "color": "pink"},
                    ],
                },
            ],
            "leadership": [
                {
                    "name": "Strategic Initiatives",
                    "description": "Processes for strategic planning",
                    "color": "indigo",
                    "category_id": "feature-development",
                    "subdirectories": [
                        {"name": "Vision Planning", "description": "Processes for long-term vision", "color": "indigo"},
                        {"name": "Strategic Projects", "description": "Processes for key initiatives", "color": "violet"},
                    ],
                },
                {
                    "name": "Team Management",
                    "description": "Processes for team leadership",
                    "color": "blue",
                    "category_id": "agile-ceremonies",
                    "subdirectories": [
                        {"name": "Team Building", "description": "Processes for building strong teams", "color": "blue"},
                        {"name": "One-on-Ones", "description": "Processes for individual meetings", "color": "sky"},
                    ],
                },
                {
                    "name": "Performance Reviews",
                    "description": "Processes for performance evaluation",
                    "color": "amber",
                    "category_id": "code-quality",
                    "subdirectories": [
                        {"name": "Quarterly Reviews", "description": "Processes for regular reviews", "color": "amber"},
                        {"name": "Goal Setting", "description": "Processes for setting performance goals", "color": "yellow"},
                    ],
                },
            ],
        }

        # Default to dev role if not specified
        role = role.lower() if role in role_directory_templates else "dev"
        directory_templates = role_directory_templates.get(role, role_directory_templates["dev"])

        # Create directories for the user
        all_directories = []
        for template in directory_templates:
            # Create parent directory
            directory = Directory(
                id=str(uuid.uuid4()),
                name=template["name"],
                description=template["description"],
                color=template["color"],
                created_by_id=user.id,
                parent_id=None,
                directory_metadata={"category_id": template["category_id"], "public": True},
            )
            self.db.add(directory)
            self.db.flush()  # Get ID without committing
            all_directories.append(directory)

            # Create subdirectories if defined
            if "subdirectories" in template:
                for subdir_def in template["subdirectories"]:
                    subdirectory = Directory(
                        id=str(uuid.uuid4()),
                        name=subdir_def["name"],
                        description=subdir_def["description"],
                        color=subdir_def["color"],
                        created_by_id=user.id,
                        parent_id=directory.id,
                        directory_metadata={"category_id": template["category_id"], "public": True},
                    )
                    self.db.add(subdirectory)
                    all_directories.append(subdirectory)

        self.db.commit()
        for directory in all_directories:
            self.db.refresh(directory)

        logger.info(f"Created {len(all_directories)} {role} role directories and subdirectories for user {user.handle}")
        return all_directories
