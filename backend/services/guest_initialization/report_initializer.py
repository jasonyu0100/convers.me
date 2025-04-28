"""
Report initialization module for creating sample reports.
"""

import random
import uuid
from datetime import datetime, timedelta
from typing import List

from db.models import Report, User

from .base_initializer import BaseInitializer


class ReportInitializer(BaseInitializer):
    """Handles creation of sample reports."""

    async def create_sample_reports(self, user: User) -> List[Report]:
        """
        Create sample reports for a user.

        Args:
            user: The user to create reports for

        Returns:
            List[Report]: Created reports
        """
        # Define role-specific report types
        role = user.guest_role if user.is_guest else "default"

        role_reports = {
            "dev": ["Code Quality Analysis", "Sprint Velocity Analysis", "Bug Tracking Summary", "Release Impact Report"],
            "pm": ["Project Timeline Forecast", "Feature Adoption Analysis", "Customer Feedback Summary", "Quarterly Planning Overview"],
            "designer": ["User Testing Results", "Design System Usage", "UI Component Analysis", "Accessibility Audit"],
            "ops": ["System Performance Metrics", "Deployment Frequency Analysis", "Infrastructure Cost Report", "Security Audit Results"],
            "leadership": ["Executive Summary", "Team Performance Overview", "Strategic Initiatives Report", "Resource Allocation Analysis"],
            "intern": ["Learning Progress Report", "Project Contributions", "Skill Development Summary", "Weekly Tasks Summary"],
            "default": ["Performance Summary", "Project Summary", "Team Metrics Report", "Weekly Activity Report"],
        }

        # Get specific report types for the user's role
        report_types = role_reports.get(role, role_reports["default"])

        reports = []
        now = datetime.utcnow()

        # Create sample weekly reports (4-6 weeks)
        for i in range(random.randint(4, 6)):
            week_date = now - timedelta(days=7 * i)
            week_num = int(week_date.strftime("%W"))
            week_year = week_date.strftime("%Y")
            week_str = f"Week {week_num}, {week_year}"

            report_type = random.choice(report_types)
            title = f"Weekly {report_type} - {week_str}"

            # Create a sample report
            report = Report(
                id=uuid.uuid4(),
                title=title,
                description=f"Weekly {report_type.lower()} covering {week_str}.",
                file_url="/report/report.pdf",
                report_type="weekly",
                date_range=week_str,
                size=random.randint(50000, 2000000),  # 50KB to 2MB
                user_id=user.id,
                report_metadata={
                    "pages": random.randint(1, 5),
                    "generated_by": "system",
                    "topics": [t.lower() for t in random.sample(report_types, k=min(2, len(report_types)))],
                    "category": role.upper(),
                },
            )

            report = self.add_and_flush(report, f"Error creating weekly report for user {user.handle}")
            if report:
                reports.append(report)

        # Create sample quarterly reports (1-2 quarters)
        for i in range(random.randint(1, 2)):
            quarter_date = now - timedelta(days=90 * i)
            quarter = (quarter_date.month - 1) // 3 + 1
            quarter_year = quarter_date.strftime("%Y")
            quarter_str = f"Q{quarter} {quarter_year}"

            report_type = random.choice(report_types)
            title = f"Quarterly {report_type} - {quarter_str}"

            # Create a sample report
            report = Report(
                id=uuid.uuid4(),
                title=title,
                description=f"Quarterly {report_type.lower()} summary covering {quarter_str}.",
                file_url="/report/report.pdf",
                report_type="quarterly",
                date_range=quarter_str,
                size=random.randint(1000000, 5000000),  # 1MB to 5MB
                user_id=user.id,
                report_metadata={
                    "pages": random.randint(5, 20),
                    "generated_by": "system",
                    "topics": [t.lower() for t in random.sample(report_types, k=min(3, len(report_types)))],
                    "category": role.upper(),
                    "includes_charts": True,
                },
            )

            report = self.add_and_flush(report, f"Error creating quarterly report for user {user.handle}")
            if report:
                reports.append(report)

        # Create sample yearly report (if appropriate based on current date)
        if random.random() < 0.7:  # 70% chance to have a yearly report
            prev_year = now.year - 1
            report_type = random.choice(report_types)
            title = f"Annual {report_type} - {prev_year}"

            # Create a sample report
            report = Report(
                id=uuid.uuid4(),
                title=title,
                description=f"Annual {report_type.lower()} summary for {prev_year}.",
                file_url="/report/report.pdf",
                report_type="yearly",
                date_range=str(prev_year),
                size=random.randint(5000000, 15000000),  # 5MB to 15MB
                user_id=user.id,
                report_metadata={
                    "pages": random.randint(15, 40),
                    "generated_by": "system",
                    "topics": [t.lower() for t in report_types],
                    "category": role.upper(),
                    "includes_charts": True,
                    "includes_executive_summary": True,
                },
            )

            report = self.add_and_flush(report, f"Error creating annual report for user {user.handle}")
            if report:
                reports.append(report)

        # Log the creation
        self.log_creation(f"reports for {user.handle}", len(reports))
        return reports
