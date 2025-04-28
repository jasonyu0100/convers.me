#!/usr/bin/env python3
"""
Tests for the templates router.
This script tests the API endpoints related to templates.
"""

import asyncio
import sys

from test_utils import ApiTestClient, TestResult

# Test data
TEST_TEMPLATE = {
    "title": "Test Template",
    "description": "A test template for API testing",
    "color": "green",
    "is_template": True,
}

TEST_STEP = {"content": "Test Template Step", "order": 0, "completed": False}


async def test_templates():
    """Test templates router endpoints."""
    client = ApiTestClient()
    result = TestResult("Templates Router")

    # Set up authentication if needed
    if not client.auth_token:
        token = await client.create_guest_account()
        if not token:
            result.add_result("Authentication setup", False, "Failed to create guest account")
            result.print_results()
            return False

    # Test template endpoints

    # Health check
    success, data, status, time_taken = client.get("/templates/health", auth_required=False)
    result.add_result("Health check", success, f"Status: {status}" if not success else "Router is healthy", time_taken)

    # Test endpoint (no auth required)
    success, data, status, time_taken = client.get("/templates/test", auth_required=False)
    result.add_result("Test endpoint", success, f"Status: {status}" if not success else "Returns sample template data", time_taken)

    # If test endpoint succeeded, verify it has steps and substeps
    if success and data:
        has_steps = "steps" in data and isinstance(data["steps"], list)
        result.add_result("Test endpoint steps", has_steps, "Has steps array" if has_steps else "Missing steps array")

        if has_steps:
            has_substeps = False
            for step in data["steps"]:
                if "subSteps" in step and isinstance(step["subSteps"], list) and step["subSteps"]:
                    has_substeps = True
                    break

            result.add_result(
                "Test endpoint substeps",
                has_substeps,
                "Has substeps array" if has_substeps else "Missing substeps array",
            )

    # Template CRUD operations

    # Create template
    success, data, status, time_taken = client.post("/templates", TEST_TEMPLATE)

    if success and data:
        template_id = data.get("id")
        result.add_result("Create template", True, f"Template ID: {template_id}", time_taken)

        # Add a step to the template
        step_data = dict(TEST_STEP)
        step_data["process_id"] = template_id
        success, step_data_resp, status, time_taken = client.post(f"/processes/{template_id}/steps", step_data)

        if success and step_data_resp:
            step_id = step_data_resp.get("id")
            result.add_result("Add step to template", True, f"Step ID: {step_id}", time_taken)
        else:
            result.add_result("Add step to template", False, f"Failed to add step: {status}", time_taken)

        # Get template by ID
        success, data, status, time_taken = client.get(f"/templates/{template_id}")
        result.add_result("Get template by ID", success, f"Status: {status}", time_taken)

        # Verify template has steps array if available
        if success and data:
            has_steps = "steps" in data and isinstance(data["steps"], list)
            result.add_result("Template has steps array", has_steps, "Has steps array" if has_steps else "Missing steps array")

        # Update template
        template_update = {"title": "Updated Template Title"}
        success, data, status, time_taken = client.put(f"/templates/{template_id}", template_update)
        result.add_result("Update template", success, f"Status: {status}", time_taken)

        # List templates
        success, data, status, time_taken = client.get("/templates")
        result.add_result("List templates", success, f"Status: {status}", time_taken)

        # Delete template
        success, data, status, time_taken = client.delete(f"/templates/{template_id}")
        result.add_result("Delete template", success, f"Status: {status}", time_taken)
    else:
        result.add_result("Create template", False, f"Failed to create template: {status}", time_taken)

    # Close the client session
    client.close()

    # Print results and return success status
    success = result.print_results()
    return success


async def main():
    """Main entry point."""
    success = await test_templates()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
