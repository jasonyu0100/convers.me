"""
Test the public endpoints that don't require authentication.
This is useful for basic API compliance checks without needing to set up auth.
"""

import json
import os
import sys
import time

import requests

# Default to http://localhost:8000 but allow override
BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")
TIMEOUT = 5  # seconds per request

# Public endpoints to test
ENDPOINTS = [
    "/health",
    "/templates/health",
    "/templates/test",
    "/processes/health",
    "/live-processes/health",
    "/directories/health",
    "/directories/test",
]


def test_endpoint(endpoint):
    """Test an endpoint and return the result."""
    url = f"{BASE_URL}{endpoint}"
    print(f"\nTesting: {url}")

    try:
        start_time = time.time()
        response = requests.get(url, timeout=TIMEOUT)
        elapsed = time.time() - start_time

        print(f"Status: {response.status_code}")
        print(f"Time: {elapsed:.3f}s")

        if response.status_code == 200:
            try:
                data = response.json()

                # If this is a /test endpoint, check for steps and substeps
                if endpoint.endswith("/test"):
                    validate_test_endpoint(endpoint, data)

                # Pretty print the first part of the response
                print("Response preview:")
                print(json.dumps(data, indent=2)[:300] + "..." if len(json.dumps(data)) > 300 else json.dumps(data, indent=2))
                return True
            except json.JSONDecodeError:
                print("Error: Response is not valid JSON")
                print(f"Response: {response.text[:100]}...")
                return False
        else:
            print(f"Error: Unexpected status code {response.status_code}")
            print(f"Response: {response.text[:100]}...")
            return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False


def validate_test_endpoint(endpoint, data):
    """Validate the data from a test endpoint."""
    if "templates/test" in endpoint:
        # Validate template test endpoint
        if "steps" not in data or not isinstance(data["steps"], list):
            print("Error: Template missing steps array")
            return False

        for step in data["steps"]:
            if "subSteps" not in step:
                print(f"Error: Step {step.get('id', '?')} missing subSteps array")
                return False

        print("✅ Template structure valid with steps and substeps")
        return True

    elif "directories/test" in endpoint:
        # Validate directory test endpoint
        if "processes" not in data or not isinstance(data["processes"], list):
            print("Error: Directory missing processes array")
            return False

        for process in data["processes"]:
            if "steps" not in process or not isinstance(process["steps"], list):
                print(f"Error: Process {process.get('id', '?')} missing steps array")
                return False

            for step in process["steps"]:
                if "subSteps" not in step:
                    print(f"Error: Step {step.get('id', '?')} missing subSteps array")
                    return False

        print("✅ Directory structure valid with processes, steps and substeps")
        return True

    return True


def run_tests():
    """Run all tests and return the overall result."""
    results = []

    for endpoint in ENDPOINTS:
        print(f"\n{'='*60}")
        print(f"Testing endpoint: {endpoint}")
        print(f"{'='*60}")

        result = test_endpoint(endpoint)
        results.append((endpoint, result))

    return results


def print_summary(results):
    """Print a summary of test results."""
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    passed = 0
    for endpoint, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{endpoint:.<40} {status}")
        if result:
            passed += 1

    print("-" * 60)
    print(f"Passed: {passed}/{len(results)} ({passed/len(results)*100:.1f}%)")
    print("=" * 60)

    return passed == len(results)


if __name__ == "__main__":
    print(f"Testing public endpoints at {BASE_URL}")
    results = run_tests()
    success = print_summary(results)
    sys.exit(0 if success else 1)
