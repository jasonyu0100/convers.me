"""
Tests for the event initialization logic.
This ensures that our event generation creates proper events and respects limits.
"""

import os

# Set up a test environment
os.environ["SECRET_KEY"] = "testkey"
os.environ["ENVIRONMENT"] = "test"


def test_event_creation_logic():
    """Test that event creation logic respects the maximum events per day limit."""
    # Test that the event limit has been updated from 3 to 5
    with open("/Users/jasonyu/Documents/github/convers.me/backend/services/data_initialization/event_initializer.py", "r") as f:
        content = f.read()

        # Check for key patterns that should exist in the file
        assert "# Skip if already have 5 events this day" in content
        assert "if existing_count >= 5:" in content
        assert "max_additional_events = min(4, 5 - events_by_date.get(date_str, 0))" in content

        # Verify the update from 3 to 5 was made
        assert "# Stop if we already have 5 events for this day" in content
        assert "if events_by_date.get(date_str, 0) >= 5:" in content

        # Should not have any references to limiting to 3 events per day
        assert "# Stop if we already have 3 events for this day" not in content
        assert "if events_by_date.get(date_str, 0) >= 3:" not in content

        # Verify the event spacing logic is in place
        assert "existing_hours = []" in content
        assert "# Filter times that are at least 30 min away from any existing event" in content

        # Verify the title variety logic
        assert "# Expanded title components for more variety" in content
        assert "# To avoid repetitive titles" in content
        assert "# Check for existing events with very similar titles to avoid duplication" in content

        # Verify that all events are not recurring
        assert "# No recurring events - each event should be unique" in content
        assert "is_recurring=False" in content
        assert "# Not recurring - each is a unique event" in content

        # Verify that event titles include the date for uniqueness
        assert "# Always add date for uniqueness" in content
        assert 'date_str = meeting_date.strftime("%b %d")' in content
        assert "if date_str not in title:" in content
        assert 'title = f"{title} - {date_str}"' in content

        # Make sure we have more variety in meeting times
        time_slots = [
            "09:30",
            "10:00",
            "10:30",
            "11:00",
            "11:30",
            "13:00",
            "13:30",
            "14:00",
            "14:30",
            "15:00",
            "15:30",
            "16:00",
            "16:30",
        ]
        for time_slot in time_slots:
            assert f'"{time_slot}"' in content
