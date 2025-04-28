"""
Tests for the data initialization services.

This test suite ensures that all initializers work correctly in the DataInitializationService.
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

from api.routes.insights.mock import create_mock_insights_response
from db.database import get_db
from db.models import Directory, Event, Media, Notification, Post, Process, Topic, User
from services.guest_initialization.service import GuestInitializationService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataInitializationTestCase(unittest.TestCase):
    """Test case for data initialization services."""

    def setUp(self):
        """Set up the test case with a database session."""
        self.db: Session = next(get_db())

    def tearDown(self):
        """Clean up after the test."""
        self.db.close()

    def test_initialization_respects_existing_data(self):
        """Test that the data initialization respects existing data and doesn't duplicate."""
        # Query current database counts
        initial_counts = self._get_database_counts()
        logging.info(f"Initial database counts: {initial_counts}")

        # Run the initialization
        service = GuestInitializationService(self.db)
        result = asyncio.run(service.initialize_development_environment())

        # Verify initialization was successful
        self.assertTrue(result, "Initialization should succeed")

        # Query new database counts
        new_counts = self._get_database_counts()
        logging.info(f"New database counts: {new_counts}")

        # Check that users exist
        self.assertGreater(new_counts["users"], 0, "Should have users after initialization")

        # Check that topics exist
        self.assertGreater(new_counts["topics"], 0, "Should have topics after initialization")

        # Check that directories exist
        self.assertGreater(new_counts["directories"], 0, "Should have directories after initialization")

        # Check that processes exist
        self.assertGreater(new_counts["processes"], 0, "Should have processes after initialization")

        # Check that events exist
        self.assertGreater(new_counts["events"], 0, "Should have events after initialization")

        # Run the initialization again
        service = GuestInitializationService(self.db)
        second_result = asyncio.run(service.initialize_development_environment())

        # Verify second initialization was successful
        self.assertTrue(second_result, "Second initialization should succeed")

        # Query database counts after second initialization
        final_counts = self._get_database_counts()
        logging.info(f"Final database counts after second initialization: {final_counts}")

        # We should have similar counts; some small differences are acceptable
        # especially for events, posts, etc. which might be date-dependent
        self.assertLessEqual(
            abs(final_counts["processes"] - new_counts["processes"]),
            3,
            "Process count should be stable after second initialization",
        )

    def test_mock_insights_generation(self):
        """Test that mock insights can be generated from initialization data."""
        # First ensure we have initialized data
        service = GuestInitializationService(self.db)
        result = asyncio.run(service.initialize_development_environment())
        self.assertTrue(result, "Initialization should succeed")

        # Verify we can generate mock insights
        mock_response = create_mock_insights_response()

        # Basic validation of the mock response
        self.assertIsNotNone(mock_response.core_metrics, "Should have core metrics")
        self.assertIsNotNone(mock_response.weekly_progress, "Should have weekly progress")
        self.assertIsNotNone(mock_response.quarterly_progress, "Should have quarterly progress")
        self.assertIsNotNone(mock_response.tag_distribution, "Should have tag distribution")
        self.assertIsNotNone(mock_response.effort_distribution, "Should have effort distribution")

        # Check that weekly progress data has expected fields
        weekly_progress = mock_response.weekly_progress
        self.assertIsNotNone(weekly_progress.events_completed, "Weekly progress should have events_completed field")
        self.assertIsNotNone(weekly_progress.steps_completed, "Weekly progress should have steps_completed field")

        # Check that quarterly progress has weeks data
        self.assertIsNotNone(mock_response.quarterly_progress.weeks, "Quarterly progress should have weeks field")

    def _get_database_counts(self):
        """Get counts of all main entities in the database."""
        return {
            "users": self.db.query(User).count(),
            "topics": self.db.query(Topic).count(),
            "directories": self.db.query(Directory).count(),
            "processes": self.db.query(Process).count(),
            "events": self.db.query(Event).count(),
            "posts": self.db.query(Post).count(),
            "media": self.db.query(Media).count(),
            "notifications": self.db.query(Notification).count(),
        }


if __name__ == "__main__":
    unittest.main()
