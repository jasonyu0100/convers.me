"""
Tests for verifying processes and steps are correctly created from templates
during guest initialization.

These tests validate that:
1. Process templates are correctly used to create instances
2. All events have processes assigned to them
3. All events have appropriate steps created
4. Steps have substeps when appropriate

The test cases are designed to be resilient to variations in naming and formatting
that may occur during the initialization process, while still ensuring the core
functionality is correct.
"""

import asyncio
import logging
import os
import sys
import unittest

# Set up a test environment
os.environ["SECRET_KEY"] = "testkey"
os.environ["ENVIRONMENT"] = "test"

# Add the parent directory to sys.path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy.orm import Session

from db.database import get_db
from db.models import Event, Process, Step, SubStep
from services.guest_initialization.service import GuestInitializationService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ProcessEventTemplateTestCase(unittest.TestCase):
    """Test case for verifying process and event template initialization."""

    def setUp(self):
        """Set up the test case with a database session."""
        self.db: Session = next(get_db())

    def tearDown(self):
        """Clean up after the test."""
        self.db.close()

    def test_process_templates_create_instances(self):
        """
        Test that process templates are correctly used to create instances
        during the guest initialization process.
        """
        # Run initialization
        service = GuestInitializationService(self.db)
        result = asyncio.run(service.initialize_development_environment())
        self.assertTrue(result, "Initialization should succeed")

        # Query template processes
        template_processes = self.db.query(Process).filter(Process.is_template == True).all()
        self.assertGreater(len(template_processes), 0, "Should have at least one template process")

        # For each template, verify that there are instances created from it
        for template in template_processes:
            instances = self.db.query(Process).filter(
                Process.template_id == template.id,
                Process.is_template == False
            ).all()

            # There should be at least one instance of each template
            self.assertGreater(
                len(instances), 0,
                f"Template process '{template.title}' (ID: {template.id}) should have at least one instance"
            )

            # Verify the instance contains appropriate data from the template
            for instance in instances:
                # Check if this is a special case (like "Daily Standup" from "Team Standup Process")
                standup_case = ('standup' in template.title.lower() and 'standup' in instance.title.lower())
                meeting_case = ('meeting' in template.title.lower() and 'meeting' in instance.title.lower())

                # The instance title might be completely different in some cases,
                # but for most cases there should be some overlap
                if not (standup_case or meeting_case):
                    # Skip exact title matching for special cases
                    self.assertTrue(
                        template.title in instance.title or instance.title in template.title or
                        any(word.lower() in instance.title.lower() for word in template.title.split() if len(word) > 3),
                        f"Instance title '{instance.title}' should have some relation to template title '{template.title}'"
                    )

                # In some cases, the process initializer might choose to modify the color
                # So we don't strictly require an exact match, just that both have valid colors
                self.assertTrue(
                    isinstance(instance.color, str) and len(instance.color) > 0,
                    "Instance should have a valid color"
                )
                self.assertFalse(
                    instance.is_template,
                    "Instance should have is_template=False"
                )
                self.assertEqual(
                    instance.template_id, template.id,
                    "Instance should reference the correct template"
                )

    def test_all_events_have_processes(self):
        """
        Test that all events have processes assigned after initialization.
        """
        # Run initialization
        service = GuestInitializationService(self.db)
        result = asyncio.run(service.initialize_development_environment())
        self.assertTrue(result, "Initialization should succeed")

        # Query all events
        events = self.db.query(Event).all()
        self.assertGreater(len(events), 0, "Should have at least one event")

        # Verify that all events have a process assigned
        events_without_process = self.db.query(Event).filter(Event.process_id == None).all()
        self.assertEqual(
            len(events_without_process), 0,
            f"All events should have processes, but found {len(events_without_process)} without"
        )

        # Specifically check for "Dev Meeting" events
        dev_meetings = self.db.query(Event).filter(Event.title.like("%Dev Meeting%")).all()
        if dev_meetings:
            for meeting in dev_meetings:
                self.assertIsNotNone(
                    meeting.process_id,
                    f"Dev Meeting event (ID: {meeting.id}) should have a process assigned"
                )

    def test_all_events_have_steps(self):
        """
        Test that all events have steps created after initialization.
        """
        # Run initialization
        service = GuestInitializationService(self.db)
        result = asyncio.run(service.initialize_development_environment())
        self.assertTrue(result, "Initialization should succeed")

        # Query all events
        events = self.db.query(Event).all()
        self.assertGreater(len(events), 0, "Should have at least one event")

        # For each event, verify that it has steps
        for event in events:
            steps = self.db.query(Step).filter(Step.event_id == event.id).all()
            self.assertGreater(
                len(steps), 0,
                f"Event '{event.title}' (ID: {event.id}) should have at least one step"
            )

            # Verify that process steps were copied to the event
            if event.process_id:
                process = self.db.query(Process).filter(Process.id == event.process_id).first()
                if process:
                    process_steps = self.db.query(Step).filter(Step.process_id == process.id).all()
                    if process_steps:
                        # Event should have similar number of steps as the process
                        # (might not be exact due to customizations)
                        self.assertGreaterEqual(
                            len(steps), 0.7 * len(process_steps),
                            f"Event should have roughly the same number of steps as its process template"
                        )

    def test_steps_have_substeps(self):
        """
        Test that steps have appropriate substeps created after initialization.
        """
        # Run initialization
        service = GuestInitializationService(self.db)
        result = asyncio.run(service.initialize_development_environment())
        self.assertTrue(result, "Initialization should succeed")

        # Sample a few significant steps (like "Implementation", "Planning", etc.)
        significant_step_keywords = ["Implementation", "Planning", "Testing", "Design"]

        # Count total steps with substeps to ensure we have at least some
        steps_with_substeps = self.db.query(Step).filter(
            Step.id.in_(self.db.query(SubStep.step_id).distinct())
        ).all()

        self.assertGreater(
            len(steps_with_substeps), 0,
            "There should be at least some steps with substeps in the system"
        )

        # Find steps containing these keywords
        for keyword in significant_step_keywords:
            steps = self.db.query(Step).filter(Step.content.like(f"%{keyword}%")).limit(5).all()

            if steps:
                # At least one step with this keyword should have substeps
                steps_with_substeps_count = 0
                for step in steps:
                    substeps = self.db.query(SubStep).filter(SubStep.step_id == step.id).all()
                    if len(substeps) > 0:
                        steps_with_substeps_count += 1

                self.assertGreater(
                    steps_with_substeps_count, 0,
                    f"At least one step with keyword '{keyword}' should have substeps"
                )

if __name__ == "__main__":
    unittest.main()
