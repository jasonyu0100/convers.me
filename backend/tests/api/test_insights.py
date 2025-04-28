"""Tests for the insights API."""

from fastapi.testclient import TestClient

from app import app

client = TestClient(app)


def test_insights_health():
    """Test the insights health endpoint."""
    response = client.get("/insights/health")
    assert response.status_code == 200


def test_insights_test_endpoint():
    """Test the insights test endpoint."""
    response = client.post("/insights/test", json={"timeFrame": "quarter"})
    assert response.status_code == 200
    data = response.json()

    # Check the structure of the response
    assert "core_metrics" in data
    assert "weekly_progress" in data
    assert "quarterly_progress" in data

    # Check field access that was previously failing
    weekly_progress = data["weekly_progress"]
    assert "eventsCompleted" in weekly_progress  # This was failing before

    # Access the weeks in quarterly progress
    quarterly_progress = data["quarterly_progress"]
    assert "weeks" in quarterly_progress
    for week in quarterly_progress["weeks"]:
        assert "eventsCompleted" in week
