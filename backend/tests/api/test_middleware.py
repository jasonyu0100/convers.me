"""Test the middleware functionality."""

import os
import uuid
from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient
from pydantic import UUID4, BaseModel

from api.main import app
from api.utils.response_utils import format_response

# Set the SECRET_KEY for testing
os.environ["SECRET_KEY"] = "test-secret-key"


@pytest.fixture
def test_client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


def test_middleware_uuid_conversion(test_client: TestClient):
    """
    Test that the middleware correctly converts UUIDs to strings.
    """
    # Create a temporary route for testing
    test_id = uuid.uuid4()

    @app.get("/test-uuid-response")
    def test_uuid_response():
        return {"id": test_id, "name": "Test Item"}

    # Test the route
    response = test_client.get("/test-uuid-response")
    assert response.status_code == 200

    # Check that the UUID was converted to a string
    data = response.json()
    assert "id" in data
    assert isinstance(data["id"], str)
    assert data["id"] == str(test_id)

    # Check that keys are in camelCase
    assert "name" in data


def test_middleware_metadata_handling(test_client: TestClient):
    """
    Test that the middleware correctly handles metadata objects.
    """
    # Define a model with metadata for testing
    class TestMetadata(BaseModel):
        id: UUID4
        metadata: Dict[str, Any] = {}

    # Create a temporary route that returns a model with metadata
    test_id = uuid.uuid4()

    @app.get("/test-metadata-response")
    def test_metadata_response():
        # Use our format_response function to simulate what the middleware does
        # This tests that our format_response handles metadata properly
        return format_response({
            "id": test_id,
            "metadata": {"key": "value"}
        })

    # Test the route
    response = test_client.get("/test-metadata-response")
    assert response.status_code == 200

    # Check the response
    data = response.json()
    assert "id" in data
    assert isinstance(data["id"], str)
    assert "metadata" in data
    assert isinstance(data["metadata"], dict)
    assert data["metadata"]["key"] == "value"


def test_middleware_snake_to_camel(test_client: TestClient):
    """
    Test that the middleware correctly converts snake_case to camelCase.
    """
    @app.get("/test-snake-case")
    def test_snake_case():
        return {
            "user_id": str(uuid.uuid4()),
            "first_name": "John",
            "last_name": "Doe",
            "created_at": "2023-01-01T00:00:00",
            "nested_object": {
                "some_key": "some_value",
                "another_key": 123
            }
        }

    # Test the route
    response = test_client.get("/test-snake-case")
    assert response.status_code == 200

    # Check that the keys were converted to camelCase
    data = response.json()
    assert "userId" in data
    assert "firstName" in data
    assert "lastName" in data
    assert "createdAt" in data
    assert "nestedObject" in data
    assert "someKey" in data["nestedObject"]
    assert "anotherKey" in data["nestedObject"]
