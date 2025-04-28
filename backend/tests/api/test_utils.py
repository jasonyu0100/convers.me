"""
Enhanced utility functions for API testing.
This module provides common utilities for testing the API endpoints with better error handling,
fixtures, and test setup/teardown functionality.
"""

import json
import logging
import os
import time
from typing import Any, Callable, Dict, List, Optional, Tuple, TypeVar

import requests

# Default to http://localhost:8000 but allow override
BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")
TIMEOUT = 10  # seconds per request, increased for stability
AUTH_TOKEN = os.environ.get("AUTH_TOKEN")  # For authenticated requests
VERBOSE = os.environ.get("VERBOSE", "false").lower() == "true"
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

# Set up logger
logging.basicConfig(level=getattr(logging, LOG_LEVEL), format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("api_test")

# Type variable for generic functions
T = TypeVar("T")


class ApiTestClient:
    """A client for testing API endpoints with better error handling and testing utilities."""

    def __init__(self, base_url: str = BASE_URL, auth_token: Optional[str] = AUTH_TOKEN):
        self.base_url = base_url
        self.auth_token = auth_token
        self.session = requests.Session()
        self.resources_to_cleanup = []  # Store resources to clean up after tests

    def get_headers(self, auth_required: bool = True) -> Dict[str, str]:
        """Get request headers."""
        headers = {"Content-Type": "application/json", "Accept": "application/json"}

        if auth_required and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        return headers

    async def create_guest_account(self, role: str = "dev") -> Optional[str]:
        """Create a guest account and get an auth token."""
        url = f"{self.base_url}/guest"
        data = {"role": role}

        try:
            logger.info(f"Creating guest account with role '{role}'")
            response = self.session.post(url, json=data, headers={"Content-Type": "application/json"}, timeout=TIMEOUT)

            if response.status_code == 200:
                response_data = response.json()
                token = response_data.get("access_token")
                self.auth_token = token
                logger.info(f"Guest account created successfully with token: {token[:10]}...")
                return token
            else:
                logger.error(f"Error creating guest account: {response.status_code} - {response.text}")
                return None
        except requests.RequestException as e:
            logger.error(f"Error creating guest account: {str(e)}")
            return None

    def request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
        auth_required: bool = True,
        expected_status: Optional[int] = None,
        cleanup_callback: Optional[Callable] = None,
        register_for_cleanup: bool = False,
    ) -> Tuple[bool, Any, int, float]:
        """
        Make a request to the API with enhanced logging and cleanup options.

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint (without base URL)
            data: Request data for POST/PUT
            params: Query parameters
            auth_required: Whether authentication is required
            expected_status: Expected HTTP status code
            cleanup_callback: Function to call during cleanup phase for created resources
            register_for_cleanup: Whether to register resource for cleanup after tests

        Returns:
            Tuple of (success, response_data, status_code, response_time)
        """
        url = f"{self.base_url}{endpoint}"
        headers = self.get_headers(auth_required)

        # Only log in verbose debug mode for tests when explicitly requested
        # Removed verbose logging that isn't needed in normal operations

        try:
            start_time = time.time()

            if method == "GET":
                response = self.session.get(url, headers=headers, params=params, timeout=TIMEOUT)
            elif method == "POST":
                response = self.session.post(url, headers=headers, json=data, params=params, timeout=TIMEOUT)
            elif method == "PUT":
                response = self.session.put(url, headers=headers, json=data, params=params, timeout=TIMEOUT)
            elif method == "DELETE":
                response = self.session.delete(url, headers=headers, params=params, timeout=TIMEOUT)
            elif method == "PATCH":
                response = self.session.patch(url, headers=headers, json=data, params=params, timeout=TIMEOUT)
            else:
                raise ValueError(f"Unsupported method: {method}")

            response_time = time.time() - start_time

            # Check if status code matches expected status
            if expected_status and response.status_code != expected_status:
                if VERBOSE:
                    logger.error(f"Expected status {expected_status}, got {response.status_code}")

                try:
                    error_data = response.json()
                    if VERBOSE:
                        logger.error(f"Response: {json.dumps(error_data, indent=2)}")
                except:
                    if VERBOSE:
                        logger.error(f"Response text: {response.text[:200]}")

                return False, None, response.status_code, response_time

            # Process response
            if 200 <= response.status_code < 300:
                if response.status_code == 204 or not response.content:
                    return True, None, response.status_code, response_time

                try:
                    data = response.json()

                    # Register for cleanup if requested (usually for POST responses)
                    if register_for_cleanup and cleanup_callback and isinstance(data, dict) and "id" in data:
                        self.resources_to_cleanup.append((cleanup_callback, data["id"]))
                        logger.debug(f"Registered resource {endpoint}/{data['id']} for cleanup")

                    return True, data, response.status_code, response_time
                except json.JSONDecodeError:
                    return True, response.text, response.status_code, response_time
            else:
                if VERBOSE:
                    logger.error(f"HTTP Error {response.status_code}")
                    try:
                        error_data = response.json()
                        logger.error(f"Error data: {json.dumps(error_data, indent=2)}")
                    except:
                        logger.error(f"Response text: {response.text[:200]}")

                return False, None, response.status_code, response_time

        except requests.RequestException as e:
            logger.error(f"Request error: {str(e)}")
            return False, None, 0, response_time if "response_time" in locals() else 0

    def get(
        self,
        endpoint: str,
        params: Optional[Dict] = None,
        auth_required: bool = True,
        expected_status: Optional[int] = 200,
    ) -> Tuple[bool, Any, int, float]:
        """Make a GET request."""
        return self.request("GET", endpoint, params=params, auth_required=auth_required, expected_status=expected_status)

    def post(
        self,
        endpoint: str,
        data: Dict,
        params: Optional[Dict] = None,
        auth_required: bool = True,
        expected_status: Optional[int] = 200,
        cleanup_callback: Optional[Callable] = None,
        register_for_cleanup: bool = True,
    ) -> Tuple[bool, Any, int, float]:
        """Make a POST request with option to register for cleanup."""
        return self.request(
            "POST",
            endpoint,
            data=data,
            params=params,
            auth_required=auth_required,
            expected_status=expected_status,
            cleanup_callback=cleanup_callback,
            register_for_cleanup=register_for_cleanup,
        )

    def put(
        self,
        endpoint: str,
        data: Dict,
        params: Optional[Dict] = None,
        auth_required: bool = True,
        expected_status: Optional[int] = 200,
    ) -> Tuple[bool, Any, int, float]:
        """Make a PUT request."""
        return self.request("PUT", endpoint, data=data, params=params, auth_required=auth_required, expected_status=expected_status)

    def patch(
        self,
        endpoint: str,
        data: Dict,
        params: Optional[Dict] = None,
        auth_required: bool = True,
        expected_status: Optional[int] = 200,
    ) -> Tuple[bool, Any, int, float]:
        """Make a PATCH request."""
        return self.request("PATCH", endpoint, data=data, params=params, auth_required=auth_required, expected_status=expected_status)

    def delete(
        self,
        endpoint: str,
        params: Optional[Dict] = None,
        auth_required: bool = True,
        expected_status: Optional[int] = 204,
    ) -> Tuple[bool, Any, int, float]:
        """Make a DELETE request."""
        return self.request("DELETE", endpoint, params=params, auth_required=auth_required, expected_status=expected_status)

    async def cleanup_resources(self):
        """Clean up all created resources in reverse order."""
        logger.info(f"Cleaning up {len(self.resources_to_cleanup)} created resources")

        # Process cleanup in reverse order (LIFO) to handle dependencies
        for callback, resource_id in reversed(self.resources_to_cleanup):
            try:
                logger.debug(f"Cleaning up resource: {resource_id}")
                callback(resource_id)
            except Exception as e:
                logger.error(f"Error cleaning up resource {resource_id}: {str(e)}")

        # Clear the list after cleanup
        self.resources_to_cleanup = []

    def close(self):
        """Close the session and perform cleanup."""
        self.session.close()


class TestResult:
    """A class to store test results with enhanced reporting."""

    def __init__(self, name: str):
        self.name = name
        self.tests: List[Tuple[str, bool, str, float]] = []
        self.start_time = time.time()

    def add_result(self, test_name: str, success: bool, message: str, response_time: float = 0):
        """Add a test result."""
        self.tests.append((test_name, success, message, response_time))

        # Log result immediately for visibility
        status = "PASS" if success else "FAIL"
        time_info = f" ({response_time:.3f}s)" if response_time else ""
        logger.log(logging.INFO if success else logging.ERROR, f"{self.name} - {test_name}: {status}{time_info} - {message}")

    def passed(self) -> bool:
        """Check if all tests passed."""
        return all(result[1] for result in self.tests)

    def count(self) -> Tuple[int, int]:
        """Get the count of passed/total tests."""
        total = len(self.tests)
        passed = sum(1 for _, success, _, _ in self.tests if success)
        return passed, total

    def print_results(self):
        """Print the test results and return success status."""
        passed, total = self.count()
        elapsed = time.time() - self.start_time

        print(f"\n===== {self.name} Results =====")

        for test_name, success, message, response_time in self.tests:
            status = "✅ PASS" if success else "❌ FAIL"
            time_info = f" ({response_time:.3f}s)" if response_time else ""
            print(f"{test_name:.<50} {status}{time_info}")
            if message:
                print(f"  {message}")

        percent = (passed / total * 100) if total else 0
        print(f"\nPassed: {passed}/{total} ({percent:.1f}%)")
        print(f"Time: {elapsed:.2f}s")
        print("=" * (len(self.name) + 15))

        # Return success status
        return passed == total


class TestSuite:
    """A test suite for managing multiple test cases."""

    def __init__(self, name: str):
        self.name = name
        self.start_time = time.time()
        self.test_results: List[TestResult] = []

    def add_result(self, result: TestResult):
        """Add test result to the suite."""
        self.test_results.append(result)

    async def run_test(self, test_func, *args, **kwargs) -> TestResult:
        """Run a single test function and capture the result."""
        result = await test_func(*args, **kwargs)
        self.add_result(result)
        return result

    async def run_tests(self, test_funcs: List[Callable]) -> bool:
        """Run multiple test functions and capture all results."""
        for test_func in test_funcs:
            await self.run_test(test_func)
        return self.passed()

    def passed(self) -> bool:
        """Check if all tests in the suite passed."""
        return all(result.passed() for result in self.test_results)

    def print_summary(self) -> bool:
        """Print a summary of all test results and return overall success status."""
        total_passed = 0
        total_tests = 0

        print(f"\n{'='*50}")
        print(f"TEST SUITE: {self.name}")
        print(f"{'='*50}")

        for result in self.test_results:
            passed, total = result.count()
            total_passed += passed
            total_tests += total
            status = "✅ PASS" if result.passed() else "❌ FAIL"
            print(f"{result.name:.<40} {status} ({passed}/{total})")

        elapsed = time.time() - self.start_time
        percentage = (total_passed / total_tests * 100) if total_tests else 0

        print(f"\nTOTAL: {total_passed}/{total_tests} tests passed ({percentage:.1f}%)")
        print(f"Time: {elapsed:.2f}s")
        print(f"{'='*50}")

        return self.passed()


# Test Data Generators
def generate_process_data(template: bool = False, with_steps: bool = False) -> Dict[str, Any]:
    """Generate test data for a process."""
    timestamp = int(time.time())
    data = {
        "title": f"Test Process {timestamp}",
        "description": f"Test process created at {timestamp}",
        "color": "blue",
        "favorite": False,
        "category": "Test Category",
        "is_template": template,
        "metadata": {"test_id": timestamp, "importance": 2},
    }

    if with_steps:
        data["steps"] = [
            {"content": "Test Step 1", "completed": False, "order": 0, "due_date": "2025-01-01"},
            {"content": "Test Step 2", "completed": False, "order": 1},
        ]

    return data


def generate_directory_data() -> Dict[str, Any]:
    """Generate test data for a directory."""
    timestamp = int(time.time())
    return {
        "name": f"Test Directory {timestamp}",
        "description": f"Test directory created at {timestamp}",
        "color": "purple",
        "icon": "folder",
        "metadata": {"test_id": timestamp, "category_id": "test-category"},
    }


def generate_event_data(with_steps: bool = False) -> Dict[str, Any]:
    """Generate test data for an event."""
    timestamp = int(time.time())
    # Create an event for tomorrow to ensure it's in the future
    tomorrow = time.strftime("%Y-%m-%d", time.localtime(time.time() + 86400))

    data = {
        "title": f"Test Event {timestamp}",
        "description": f"Test event created at {timestamp}",
        "date": tomorrow,
        "time": "10:00",
        "duration": "1h",
        "color": "green",
        "location": "Virtual",
        "status": "pending",
        "metadata": {"test_id": timestamp, "test_created": True},
    }

    if with_steps:
        data["steps"] = [
            {"content": "Event Step 1", "completed": False, "order": 0},
            {"content": "Event Step 2", "completed": False, "order": 1},
        ]

    return data


def generate_step_data(parent_id: str, parent_type: str = "process") -> Dict[str, Any]:
    """Generate test data for a step."""
    timestamp = int(time.time())
    data = {"content": f"Test Step {timestamp}", "completed": False, "order": 0, "due_date": "2025-01-01"}

    if parent_type == "process":
        data["process_id"] = parent_id
    elif parent_type == "event":
        data["event_id"] = parent_id

    return data


def generate_substep_data(step_id: str) -> Dict[str, Any]:
    """Generate test data for a substep."""
    timestamp = int(time.time())
    return {"content": f"Test SubStep {timestamp}", "completed": False, "order": 0, "step_id": step_id}


def generate_post_data() -> Dict[str, Any]:
    """Generate test data for a post."""
    timestamp = int(time.time())
    return {"content": f"Test post created at {timestamp}", "visibility": "public"}


def generate_topic_data() -> Dict[str, Any]:
    """Generate test data for a topic."""
    timestamp = int(time.time())
    return {"name": f"Test Topic {timestamp}", "description": f"Test topic created at {timestamp}", "color": "indigo"}
