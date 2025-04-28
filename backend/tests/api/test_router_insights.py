"""
Tests for the insights router endpoints.
"""

import logging
import os
import sys
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

# Add the parent directory to sys.path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from api.main import app
from api.schemas.insights import TimeFrameType
from api.security import create_access_token

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = TestClient(app)


def get_auth_headers():
    """Get authentication headers with test token."""
    # Create a test token with a test user ID
    token_data = {"sub": "test@example.com"}
    token = create_access_token(token_data)
    return {"Authorization": f"Bearer {token}"}


def test_insights_health_endpoint():
    """Test the insights health check endpoint."""
    response = client.get("/insights/health")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "healthy"
    assert data["router"] == "insights"
    assert "timestamp" in data

    # Verify timestamp format (ISO format)
    timestamp = data["timestamp"]
    try:
        datetime.fromisoformat(timestamp)
    except ValueError:
        pytest.fail(f"Invalid timestamp format: {timestamp}")


def test_insights_test_endpoint():
    """Test the unauthenticated test endpoint for insights."""
    # Create a request for weekly insights data
    request_data = {"timeFrame": TimeFrameType.WEEK, "tab": "kpi", "tag": None}

    response = client.post("/insights/test", json=request_data)
    assert response.status_code == 200
    data = response.json()

    # Check that response contains all expected sections
    assert "coreMetrics" in data
    assert "weeklyProgress" in data
    assert "quarterlyProgress" in data
    assert "dailyActivities" in data
    assert "activeProcesses" in data
    assert "completedProcesses" in data
    assert "tagDistribution" in data
    assert "effortDistribution" in data
    assert "helpTopics" in data
    assert "dailyBurnup" in data
    assert "quarterlyBurnup" in data

    # Check that weeklyProgress contains the expected fields
    weekly_progress = data["weeklyProgress"]
    assert "week" in weekly_progress
    assert "startDate" in weekly_progress
    assert "endDate" in weekly_progress
    assert "eventsCompleted" in weekly_progress
    assert "stepsCompleted" in weekly_progress
    assert "totalTimeSpent" in weekly_progress
    assert "efficiency" in weekly_progress
    assert "progress" in weekly_progress


# Skip authenticated tests for now as they require DB setup
@pytest.mark.skip(reason="Requires DB setup with authenticated user")
def test_authenticated_insights_endpoint():
    """Test the authenticated insights endpoint."""
    auth_headers = get_auth_headers()

    # Create a request for weekly insights data
    request_data = {"timeFrame": TimeFrameType.WEEK, "tab": "kpi", "tag": None}

    response = client.post("/insights", json=request_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()

    # Check that response contains all expected sections
    assert "weeklyProgress" in data

    # Check that weeklyProgress contains the expected fields
    weekly_progress = data["weeklyProgress"]
    assert "week" in weekly_progress
    assert "startDate" in weekly_progress
    assert "endDate" in weekly_progress
    assert "eventsCompleted" in weekly_progress
    assert "stepsCompleted" in weekly_progress
    assert "totalTimeSpent" in weekly_progress
    assert "efficiency" in weekly_progress
    assert "progress" in weekly_progress


@pytest.mark.skip(reason="Requires DB setup with authenticated user")
def test_insights_monthly_view():
    """Test the insights endpoint with monthly time frame."""
    auth_headers = get_auth_headers()

    # Get the current date
    datetime.now().date()

    # Create a request for monthly insights data
    request_data = {"timeFrame": TimeFrameType.MONTH, "tab": "work", "tag": None}

    response = client.post("/insights", json=request_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()

    # Check quarterly progress and weekly burnup data for monthly view
    assert "quarterlyProgress" in data
    assert "quarterlyBurnup" in data

    quarterly_progress = data["quarterlyProgress"]
    assert "weeks" in quarterly_progress
    assert isinstance(quarterly_progress["weeks"], list)

    # Check that we have weeks data in the quarterly progress
    if quarterly_progress["weeks"]:
        first_week = quarterly_progress["weeks"][0]
        assert "eventsCompleted" in first_week
        assert "stepsCompleted" in first_week
        assert "totalTimeSpent" in first_week


@pytest.mark.skip(reason="Requires DB setup with authenticated user")
def test_insights_custom_date_range():
    """Test the insights endpoint with custom date range."""
    auth_headers = get_auth_headers()

    # Define a custom date range (last 14 days)
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=14)

    # Create a request with custom date range
    request_data = {
        "timeFrame": TimeFrameType.CUSTOM,
        "tab": "time",
        "tag": None,
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
    }

    response = client.post("/insights", json=request_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()

    # Check that the response contains data for the custom time frame
    assert "weeklyProgress" in data
    assert "quarterlyProgress" in data

    # Custom range should include daily activities
    assert "dailyActivities" in data
    assert isinstance(data["dailyActivities"], list)

    # Verify that we have the expected number of days in the daily activities
    # (may be less due to filtering for data presence)
    assert len(data["dailyActivities"]) > 0


if __name__ == "__main__":
    # Run the tests
    pytest.main(["-v", __file__])
