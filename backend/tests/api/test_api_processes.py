"""
Test the processes API endpoints for compliance and functionality.
This test ensures that the processes API is working correctly.
"""

import json
import os
import sys
from typing import Any, Dict, List, Optional, Tuple

import requests

# Default to http://localhost:8000 but allow override
BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")
TIMEOUT = 5  # seconds per request
AUTH_TOKEN = os.environ.get("AUTH_TOKEN")  # For authenticated requests

# Test data
TEST_PROCESS = {
    "title": "Test Process",
    "description": "A test process for API testing",
    "color": "blue",
    "is_template": True,
}

TEST_STEP = {"content": "Test Step", "order": 0, "completed": False}

TEST_SUBSTEP = {"content": "Test SubStep", "order": 0, "completed": False}


def get_headers() -> Dict[str, str]:
    """Get the headers for API requests."""
    headers = {"Content-Type": "application/json"}

    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"

    return headers


def create_guest_account() -> Optional[str]:
    """Create a guest account and return the token."""
    url = f"{BASE_URL}/guest"
    data = {"role": "dev"}

    try:
        response = requests.post(url, json=data, timeout=TIMEOUT)
        if response.status_code == 200:
            response_data = response.json()
            return response_data.get("access_token")
        else:
            print(f"Error creating guest account: {response.status_code}")
            return None
    except requests.RequestException as e:
        print(f"Error creating guest account: {str(e)}")
        return None


def log_request(method: str, url: str, data: Any = None, response: Any = None, error: Optional[str] = None) -> None:
    """Log a request for debugging."""
    print(f"\n{method} {url}")
    if data:
        print(f"Request Data: {json.dumps(data, indent=2)}")

    if response:
        status = getattr(response, "status_code", "N/A")
        print(f"Response: {status}")

        try:
            print(f"Response Data: {json.dumps(response.json(), indent=2)}")
        except Exception:
            print(f"Response Text: {response.text[:200]}")

    if error:
        print(f"Error: {error}")


def test_process_endpoints() -> List[Tuple[str, bool, str]]:
    """Test the process endpoints."""
    results = []

    # Step 1: Configure authentication
    global AUTH_TOKEN

    if not AUTH_TOKEN:
        print("No auth token provided, trying to create guest account...")
        AUTH_TOKEN = create_guest_account()
        if not AUTH_TOKEN:
            results.append(("Authentication setup", False, "Failed to create guest account"))
            return results

    headers = get_headers()

    # Step 2: Test template creation
    process_id = None
    try:
        url = f"{BASE_URL}/templates"
        response = requests.post(url, json=TEST_PROCESS, headers=headers, timeout=TIMEOUT)
        log_request("POST", url, TEST_PROCESS, response)

        if response.status_code == 200:
            process_data = response.json()
            process_id = process_data.get("id")
            results.append(("Create template", True, f"Created template with ID: {process_id}"))
        else:
            results.append(("Create template", False, f"Failed: {response.status_code}"))

    except requests.RequestException as e:
        results.append(("Create template", False, f"Error: {str(e)}"))

    if not process_id:
        results.append(("Subsequent tests", False, "Skipped due to template creation failure"))
        return results

    # Step 3: Test step creation
    step_id = None
    try:
        url = f"{BASE_URL}/processes/{process_id}/steps"
        step_data = {**TEST_STEP, "process_id": process_id}
        response = requests.post(url, json=step_data, headers=headers, timeout=TIMEOUT)
        log_request("POST", url, step_data, response)

        if response.status_code == 200:
            step_data = response.json()
            step_id = step_data.get("id")
            results.append(("Create step", True, f"Created step with ID: {step_id}"))
        else:
            results.append(("Create step", False, f"Failed: {response.status_code}"))

    except requests.RequestException as e:
        results.append(("Create step", False, f"Error: {str(e)}"))

    if not step_id:
        results.append(("Substep tests", False, "Skipped due to step creation failure"))
        # Continue with other tests
    else:
        # Step 4: Test substep creation
        substep_id = None
        try:
            url = f"{BASE_URL}/processes/steps/{step_id}/substeps"
            substep_data = {**TEST_SUBSTEP, "step_id": step_id}
            response = requests.post(url, json=substep_data, headers=headers, timeout=TIMEOUT)
            log_request("POST", url, substep_data, response)

            if response.status_code == 200:
                substep_data = response.json()
                substep_id = substep_data.get("id")
                results.append(("Create substep", True, f"Created substep with ID: {substep_id}"))
            else:
                results.append(("Create substep", False, f"Failed: {response.status_code}"))

        except requests.RequestException as e:
            results.append(("Create substep", False, f"Error: {str(e)}"))

    # Step 5: Test getting the template with steps
    try:
        url = f"{BASE_URL}/templates/{process_id}"
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        log_request("GET", url, None, response)

        if response.status_code == 200:
            template_data = response.json()
            has_steps = "steps" in template_data and len(template_data["steps"]) > 0
            results.append(("Get template with steps", has_steps, "Steps included" if has_steps else "Steps missing"))
        else:
            results.append(("Get template with steps", False, f"Failed: {response.status_code}"))

    except requests.RequestException as e:
        results.append(("Get template with steps", False, f"Error: {str(e)}"))

    # Step 6: Test template deletion (cleanup)
    try:
        url = f"{BASE_URL}/templates/{process_id}"
        response = requests.delete(url, headers=headers, timeout=TIMEOUT)
        log_request("DELETE", url, None, response)

        if response.status_code == 204:
            results.append(("Delete template", True, "Template deleted successfully"))
        else:
            results.append(("Delete template", False, f"Failed: {response.status_code}"))

    except requests.RequestException as e:
        results.append(("Delete template", False, f"Error: {str(e)}"))

    return results


def test_directory_endpoints() -> List[Tuple[str, bool, str]]:
    """Test the directory endpoints."""
    results = []

    # Configure authentication
    global AUTH_TOKEN

    if not AUTH_TOKEN:
        print("No auth token provided, trying to create guest account...")
        AUTH_TOKEN = create_guest_account()
        if not AUTH_TOKEN:
            results.append(("Authentication setup", False, "Failed to create guest account"))
            return results

    headers = get_headers()

    # Test directory creation
    directory_id = None
    try:
        url = f"{BASE_URL}/directories"
        directory_data = {"name": "Test Directory", "description": "A test directory for API testing", "color": "green"}
        response = requests.post(url, json=directory_data, headers=headers, timeout=TIMEOUT)
        log_request("POST", url, directory_data, response)

        if response.status_code == 200:
            directory_data = response.json()
            directory_id = directory_data.get("id")
            results.append(("Create directory", True, f"Created directory with ID: {directory_id}"))
        else:
            results.append(("Create directory", False, f"Failed: {response.status_code}"))

    except requests.RequestException as e:
        results.append(("Create directory", False, f"Error: {str(e)}"))

    if not directory_id:
        results.append(("Subsequent directory tests", False, "Skipped due to directory creation failure"))
        return results

    # Create a template in the directory
    process_id = None
    try:
        url = f"{BASE_URL}/templates"
        process_data = {**TEST_PROCESS, "directory_id": directory_id}
        response = requests.post(url, json=process_data, headers=headers, timeout=TIMEOUT)
        log_request("POST", url, process_data, response)

        if response.status_code == 200:
            process_data = response.json()
            process_id = process_data.get("id")
            results.append(
                (
                    "Create template in directory",
                    True,
                    f"Created template with ID: {process_id} in directory: {directory_id}",
                )
            )
        else:
            results.append(("Create template in directory", False, f"Failed: {response.status_code}"))

    except requests.RequestException as e:
        results.append(("Create template in directory", False, f"Error: {str(e)}"))

    # Add step to the template
    if process_id:
        step_id = None
        try:
            url = f"{BASE_URL}/processes/{process_id}/steps"
            step_data = {**TEST_STEP, "process_id": process_id}
            response = requests.post(url, json=step_data, headers=headers, timeout=TIMEOUT)
            log_request("POST", url, step_data, response)

            if response.status_code == 200:
                step_data = response.json()
                step_id = step_data.get("id")
                results.append(("Create step in directory template", True, f"Created step with ID: {step_id}"))
            else:
                results.append(("Create step in directory template", False, f"Failed: {response.status_code}"))

        except requests.RequestException as e:
            results.append(("Create step in directory template", False, f"Error: {str(e)}"))

        # Add substep if step was created
        if step_id:
            try:
                url = f"{BASE_URL}/processes/steps/{step_id}/substeps"
                substep_data = {**TEST_SUBSTEP, "step_id": step_id}
                response = requests.post(url, json=substep_data, headers=headers, timeout=TIMEOUT)
                log_request("POST", url, substep_data, response)

                if response.status_code == 200:
                    substep_data = response.json()
                    substep_id = substep_data.get("id")
                    results.append(("Create substep in directory template", True, f"Created substep with ID: {substep_id}"))
                else:
                    results.append(
                        (
                            "Create substep in directory template",
                            False,
                            f"Failed: {response.status_code}",
                        )
                    )

            except requests.RequestException as e:
                results.append(("Create substep in directory template", False, f"Error: {str(e)}"))

    # Test getting directory with templates, steps and substeps
    try:
        url = f"{BASE_URL}/directories/{directory_id}"
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        log_request("GET", url, None, response)

        if response.status_code == 200:
            directory_data = response.json()

            # Check for processes in directory
            has_processes = "processes" in directory_data and len(directory_data["processes"]) > 0

            # Check for steps in processes
            has_steps = False
            has_substeps = False

            if has_processes:
                for process in directory_data["processes"]:
                    if "steps" in process and len(process["steps"]) > 0:
                        has_steps = True
                        for step in process["steps"]:
                            if "subSteps" in step and len(step["subSteps"]) > 0:
                                has_substeps = True
                                break
                        break

            results.append(
                (
                    "Get directory with processes",
                    has_processes,
                    "Processes included" if has_processes else "Processes missing",
                )
            )
            results.append(("Process steps in directory API", has_steps, "Steps included" if has_steps else "Steps missing"))
            results.append(
                (
                    "Process substeps in directory API",
                    has_substeps,
                    "Substeps included" if has_substeps else "Substeps missing",
                )
            )
        else:
            results.append(("Get directory with processes", False, f"Failed: {response.status_code}"))

    except requests.RequestException as e:
        results.append(("Get directory with processes", False, f"Error: {str(e)}"))

    # Clean up: Delete processes and directory
    if process_id:
        try:
            url = f"{BASE_URL}/templates/{process_id}"
            response = requests.delete(url, headers=headers, timeout=TIMEOUT)
            log_request("DELETE", url, None, response)

            if response.status_code == 204:
                results.append(("Delete directory template", True, "Template deleted successfully"))
            else:
                results.append(("Delete directory template", False, f"Failed: {response.status_code}"))

        except requests.RequestException as e:
            results.append(("Delete directory template", False, f"Error: {str(e)}"))

    if directory_id:
        try:
            url = f"{BASE_URL}/directories/{directory_id}"
            response = requests.delete(url, headers=headers, timeout=TIMEOUT)
            log_request("DELETE", url, None, response)

            if response.status_code == 204:
                results.append(("Delete directory", True, "Directory deleted successfully"))
            else:
                results.append(("Delete directory", False, f"Failed: {response.status_code}"))

        except requests.RequestException as e:
            results.append(("Delete directory", False, f"Error: {str(e)}"))

    return results


def print_results(results: List[Tuple[str, bool, str]], title: str) -> None:
    """Print test results in a formatted way."""
    print(f"\n===== {title} =====")

    total = len(results)
    passed = sum(1 for _, success, _ in results if success)

    for test_name, success, message in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name:.<40} {status}")
        print(f"  {message}")

    print(f"\nSummary: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print("=" * (len(title) + 12))


def run_all_tests() -> bool:
    """Run all tests and return overall success status."""
    process_results = test_process_endpoints()
    directory_results = test_directory_endpoints()

    print_results(process_results, "Process API Tests")
    print_results(directory_results, "Directory API Tests")

    # Overall success if all tests passed
    process_success = all(success for _, success, _ in process_results)
    directory_success = all(success for _, success, _ in directory_results)

    return process_success and directory_success


if __name__ == "__main__":
    print(f"Running API compliance tests against {BASE_URL}...")
    success = run_all_tests()
    sys.exit(0 if success else 1)
