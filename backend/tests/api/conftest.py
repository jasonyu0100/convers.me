"""
Pytest configuration for API tests.
This module defines fixtures and configuration that can be used across all tests.
"""

import logging
import os

# Add the parent directory to sys.path to allow imports
import sys
import uuid
from typing import Dict, Generator

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from api.main import app
from api.security import create_access_token
from tests.api.test_utils import ApiTestClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@pytest.fixture(scope="session")
def test_app() -> TestClient:
    """Create a FastAPI TestClient for the app."""
    return TestClient(app)


@pytest.fixture(scope="session")
def api_client() -> Generator[ApiTestClient, None, None]:
    """Create an API client for testing."""
    client = ApiTestClient()
    yield client
    # Clean up resources
    client.close()


@pytest.fixture(scope="function")
async def authenticated_client() -> Generator[ApiTestClient, None, None]:
    """Create an authenticated API client using a guest account."""
    client = ApiTestClient()
    token = await client.create_guest_account(role="dev")
    if not token:
        pytest.fail("Failed to create guest account")

    # The client now has the token set
    yield client

    # Clean up resources created during the test
    await client.cleanup_resources()
    client.close()


@pytest.fixture(scope="function")
def auth_headers() -> Dict[str, str]:
    """Get authentication headers with a test token."""
    # Create a test token with a test user ID
    token_data = {"sub": "test@example.com"}
    token = create_access_token(token_data)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def process_data() -> Dict:
    """Generate test data for a process."""
    uid = str(uuid.uuid4())[:8]
    return {
        "title": f"Test Process {uid}",
        "description": f"Test process created for testing",
        "color": "blue",
        "favorite": False,
        "category": "Test Category",
        "is_template": False,
        "metadata": {"test_id": uid, "importance": 2},
    }


@pytest.fixture(scope="function")
def template_data() -> Dict:
    """Generate test data for a template process."""
    uid = str(uuid.uuid4())[:8]
    return {
        "title": f"Test Template {uid}",
        "description": f"Test template created for testing",
        "color": "green",
        "favorite": False,
        "category": "Test Category",
        "is_template": True,
        "metadata": {"test_id": uid, "importance": 2},
    }


@pytest.fixture(scope="function")
def step_data() -> Dict:
    """Generate test data for a step."""
    uid = str(uuid.uuid4())[:8]
    return {"content": f"Test Step {uid}", "completed": False, "order": 0, "due_date": "2025-01-01"}


@pytest.fixture(scope="function")
def directory_data() -> Dict:
    """Generate test data for a directory."""
    uid = str(uuid.uuid4())[:8]
    return {
        "name": f"Test Directory {uid}",
        "description": f"Test directory created for testing",
        "color": "purple",
        "icon": "folder",
        "metadata": {"test_id": uid, "category_id": "test-category"},
    }
