"""
Test health check endpoints for all routers.
This module verifies that all routers have working health check endpoints.
"""

import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

# Default to http://localhost:8000 but allow override
BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")
TIMEOUT = 5  # seconds per request

# Endpoints to check
ENDPOINTS = [
    "/processes/health",
    "/templates/health",
    "/live-processes/health",
    "/directories/health",
    "/health",
]  # Main API health check


def check_endpoint(endpoint):
    """Check if an endpoint is healthy.

    Args:
        endpoint: URL path to check

    Returns:
        tuple: (endpoint, success, response_data, error_message)
    """
    url = f"{BASE_URL}{endpoint}"
    try:
        start_time = time.time()
        response = requests.get(url, timeout=TIMEOUT)
        response_time = time.time() - start_time

        # Check response status
        if response.status_code == 200:
            try:
                data = response.json()
                return endpoint, True, data, response_time, None
            except json.JSONDecodeError:
                return endpoint, False, None, response_time, "Response not JSON"
        else:
            return endpoint, False, None, response_time, f"Status code: {response.status_code}"
    except requests.RequestException as e:
        return endpoint, False, None, None, str(e)


def run_health_checks():
    """Run health checks on all endpoints.

    Returns:
        tuple: (all_successful, results)
    """
    all_successful = True
    results = []

    # Use thread pool to check endpoints concurrently
    with ThreadPoolExecutor(max_workers=min(10, len(ENDPOINTS))) as executor:
        future_to_endpoint = {executor.submit(check_endpoint, endpoint): endpoint for endpoint in ENDPOINTS}

        for future in as_completed(future_to_endpoint):
            endpoint = future_to_endpoint[future]
            result = future.result()
            results.append(result)

            endpoint, success, data, response_time, error = result
            if not success:
                all_successful = False

    return all_successful, results


def print_results(results):
    """Print the results in a formatted way."""
    print("\n===== API Health Check Results =====")
    print(f"BASE URL: {BASE_URL}\n")

    for endpoint, success, data, response_time, error in sorted(results):
        status = "✅ HEALTHY" if success else "❌ UNHEALTHY"

        if response_time:
            response_time_str = f"{response_time:.3f}s"
        else:
            response_time_str = "N/A"

        print(f"{endpoint:.<30} {status} ({response_time_str})")

        if not success:
            print(f"  Error: {error}")
        elif data:
            if isinstance(data, dict) and "router" in data:
                print(f"  Router: {data.get('router')}")

    print("\n====================================")


if __name__ == "__main__":
    print(f"Running health checks against {BASE_URL}...")
    all_successful, results = run_health_checks()
    print_results(results)

    sys.exit(0 if all_successful else 1)
