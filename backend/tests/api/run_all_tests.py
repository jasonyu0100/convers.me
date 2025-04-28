#!/usr/bin/env python3
"""
Script to run all API tests using pytest.

This script provides a programmatic way to run tests and collect results.
"""

import argparse
import subprocess
import sys
import time


def run_tests(router=None, verbose=False):
    """Run tests using pytest."""
    start_time = time.time()

    # Set up base command
    cmd = ["python", "-m", "pytest"]

    # Add verbosity flag if requested
    if verbose:
        cmd.append("-v")

    # Add test path based on type
    if router:
        cmd.append(f"tests/api/test_router_{router}.py")
    else:
        cmd.append("tests/api")

    print(f"Running command: {' '.join(cmd)}")

    # Run pytest command
    result = subprocess.run(cmd, capture_output=True, text=True)

    # Calculate time
    end_time = time.time()
    elapsed = end_time - start_time

    # Print results
    print("\n" + "=" * 50)
    print(f"Test Results ({elapsed:.2f}s)")
    print("=" * 50)

    # Output from pytest
    if result.stdout:
        print(result.stdout)

    if result.stderr:
        print("Errors:")
        print(result.stderr)

    # Return exit code
    return result.returncode


def main():
    """Parse arguments and run tests."""
    parser = argparse.ArgumentParser(description="Run API tests")
    parser.add_argument("-r", "--router", help="Specific router to test (e.g., processes)")
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose output")

    args = parser.parse_args()

    # Run tests with router specified or all API tests
    return run_tests(router=args.router, verbose=args.verbose)


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
