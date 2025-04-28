#!/usr/bin/env python3
"""
Enhanced tests for the processes router.

This module provides comprehensive testing for the processes API endpoints,
including CRUD operations for processes, steps, and substeps.
"""

import asyncio
import logging
import sys

from test_utils import ApiTestClient, TestResult, generate_directory_data, generate_process_data, generate_step_data, generate_substep_data

# Configure logging
logger = logging.getLogger("process_tests")

# Test endpoints
PROCESSES_ENDPOINT = "/processes"
PROCESS_TEMPLATES_ENDPOINT = "/processes/templates"


async def test_process_health_check() -> TestResult:
    """Test the process health check endpoint."""
    client = ApiTestClient()
    result = TestResult("Process Health Check")

    # Test health endpoint
    success, data, status, time_taken = client.get(f"{PROCESSES_ENDPOINT}/health", auth_required=False)
    result.add_result("Process router health check", success, f"Status: {status}" if not success else "Router is healthy", time_taken)

    # Close the client session
    client.close()
    return result


async def test_process_crud() -> TestResult:
    """Test CRUD operations for processes."""
    client = ApiTestClient()
    result = TestResult("Process CRUD Operations")

    # Set up authentication
    if not client.auth_token:
        token = await client.create_guest_account()
        if not token:
            result.add_result("Authentication setup", False, "Failed to create guest account")
            return result

    try:
        # 1. Create a directory to hold our process
        directory_data = generate_directory_data()
        success, directory, status, time_taken = client.post("/directories", directory_data, cleanup_callback=lambda id: client.delete(f"/directories/{id}"))

        result.add_result(
            "Create directory for process tests",
            success,
            f"Created directory: {directory.get('id') if success else None}",
            time_taken,
        )

        directory_id = directory.get("id") if success else None

        # 2. Create process without steps
        process_data = generate_process_data()
        if directory_id:
            process_data["directory_id"] = directory_id

        success, process, status, time_taken = client.post(
            PROCESSES_ENDPOINT, process_data, cleanup_callback=lambda id: client.delete(f"{PROCESSES_ENDPOINT}/{id}")
        )

        result.add_result(
            "Create process",
            success,
            f"Process ID: {process.get('id') if success else None} (Status: {status})",
            time_taken,
        )

        if not success:
            return result

        process_id = process.get("id")

        # 3. Get the created process
        success, get_process, status, time_taken = client.get(f"{PROCESSES_ENDPOINT}/{process_id}")
        result.add_result(
            "Get process by ID",
            success,
            f"Retrieved process with title: {get_process.get('title') if success else None}",
            time_taken,
        )

        # 4. Verify retrieved process matches what we created
        if success:
            matches = (
                get_process.get("title") == process_data["title"]
                and get_process.get("description") == process_data["description"]
                and get_process.get("color") == process_data["color"]
            )
            result.add_result(
                "Process data integrity",
                matches,
                "Process data matches what was created" if matches else "Process data doesn't match",
            )

        # 5. Update process
        update_data = {
            "title": f"Updated {process_data['title']}",
            "description": f"Updated {process_data['description']}",
            "favorite": True,
        }

        success, updated_process, status, time_taken = client.put(f"{PROCESSES_ENDPOINT}/{process_id}", update_data)

        result.add_result(
            "Update process",
            success,
            f"Updated process title: {updated_process.get('title') if success else None}",
            time_taken,
        )

        # 6. Verify update was applied
        if success:
            success, get_updated, status, time_taken = client.get(f"{PROCESSES_ENDPOINT}/{process_id}")

            if success:
                update_verified = (
                    get_updated.get("title") == update_data["title"]
                    and get_updated.get("description") == update_data["description"]
                    and get_updated.get("favorite") == update_data["favorite"]
                )

                result.add_result(
                    "Verify process update",
                    update_verified,
                    "Process updates were correctly applied" if update_verified else "Process updates failed",
                )

        # 7. List all processes
        success, processes_list, status, time_taken = client.get(PROCESSES_ENDPOINT)

        if success:
            # Check if our process is in the list
            our_process = next((p for p in processes_list if p.get("id") == process_id), None)

            result.add_result(
                "List processes",
                our_process is not None,
                (f"Found our process in list of {len(processes_list)} processes" if our_process else "Our process not found in list"),
                time_taken,
            )
        else:
            result.add_result("List processes", False, f"Failed to list processes: {status}", time_taken)

        # 8. Delete process
        success, _, status, time_taken = client.delete(f"{PROCESSES_ENDPOINT}/{process_id}")
        result.add_result("Delete process", success, f"Status: {status}", time_taken)

        # 9. Verify deletion
        if success:
            success, _, status, time_taken = client.get(f"{PROCESSES_ENDPOINT}/{process_id}", expected_status=404)

            result.add_result(
                "Verify process deletion",
                status == 404,
                "Process was successfully deleted" if status == 404 else f"Process still exists (status: {status})",
                time_taken,
            )

    except Exception as e:
        logger.error(f"Error during process CRUD tests: {str(e)}")
        result.add_result("Process CRUD test execution", False, f"Exception: {str(e)}")
    finally:
        # Cleanup
        await client.cleanup_resources()
        client.close()

    return result


async def test_process_steps() -> TestResult:
    """Test operations for process steps."""
    client = ApiTestClient()
    result = TestResult("Process Steps")

    # Set up authentication
    if not client.auth_token:
        token = await client.create_guest_account()
        if not token:
            result.add_result("Authentication setup", False, "Failed to create guest account")
            return result

    try:
        # 1. Create a process to add steps to
        process_data = generate_process_data()
        success, process, status, time_taken = client.post(
            PROCESSES_ENDPOINT, process_data, cleanup_callback=lambda id: client.delete(f"{PROCESSES_ENDPOINT}/{id}")
        )

        if not success:
            result.add_result("Create process for step tests", False, f"Failed to create process: {status}", time_taken)
            return result

        process_id = process.get("id")
        result.add_result("Create process for step tests", True, f"Process ID: {process_id}", time_taken)

        # 2. Create a step
        step_data = generate_step_data(process_id)
        success, step, status, time_taken = client.post(
            f"{PROCESSES_ENDPOINT}/{process_id}/steps",
            step_data,
            cleanup_callback=lambda id: client.delete(f"{PROCESSES_ENDPOINT}/steps/{id}"),
        )

        result.add_result(
            "Create process step",
            success,
            f"Step ID: {step.get('id') if success else None} (Status: {status})",
            time_taken,
        )

        if not success:
            return result

        step_id = step.get("id")

        # 3. Get the step
        success, get_step, status, time_taken = client.get(f"{PROCESSES_ENDPOINT}/steps/{step_id}")
        result.add_result(
            "Get step by ID",
            success,
            f"Retrieved step with content: {get_step.get('content') if success else None}",
            time_taken,
        )

        # 4. List all steps for the process
        success, steps_list, status, time_taken = client.get(f"{PROCESSES_ENDPOINT}/{process_id}/steps")

        if success:
            # Check if our step is in the list
            our_step = next((s for s in steps_list if s.get("id") == step_id), None)

            result.add_result(
                "List process steps",
                our_step is not None,
                f"Found our step in list of {len(steps_list)} steps" if our_step else "Our step not found in list",
                time_taken,
            )
        else:
            result.add_result("List process steps", False, f"Failed to list steps: {status}", time_taken)

        # 5. Update step
        step_update = {"content": f"Updated {step_data['content']}", "completed": True}

        success, updated_step, status, time_taken = client.put(f"{PROCESSES_ENDPOINT}/steps/{step_id}", step_update)

        result.add_result(
            "Update step",
            success,
            f"Updated step content: {updated_step.get('content') if success else None}",
            time_taken,
        )

        # 6. Verify update was applied
        if success:
            success, get_updated, status, time_taken = client.get(f"{PROCESSES_ENDPOINT}/steps/{step_id}")

            if success:
                update_verified = get_updated.get("content") == step_update["content"] and get_updated.get("completed") == step_update["completed"]

                result.add_result(
                    "Verify step update",
                    update_verified,
                    "Step updates were correctly applied" if update_verified else "Step updates failed",
                )

        # 7. Delete step
        success, _, status, time_taken = client.delete(f"{PROCESSES_ENDPOINT}/steps/{step_id}")
        result.add_result("Delete step", success, f"Status: {status}", time_taken)

        # 8. Verify deletion
        if success:
            success, _, status, time_taken = client.get(f"{PROCESSES_ENDPOINT}/steps/{step_id}", expected_status=404)

            result.add_result(
                "Verify step deletion",
                status == 404,
                "Step was successfully deleted" if status == 404 else f"Step still exists (status: {status})",
                time_taken,
            )

    except Exception as e:
        logger.error(f"Error during process step tests: {str(e)}")
        result.add_result("Process step test execution", False, f"Exception: {str(e)}")
    finally:
        # Cleanup
        await client.cleanup_resources()
        client.close()

    return result


async def test_process_substeps() -> TestResult:
    """Test operations for process substeps."""
    client = ApiTestClient()
    result = TestResult("Process Substeps")

    # Set up authentication
    if not client.auth_token:
        token = await client.create_guest_account()
        if not token:
            result.add_result("Authentication setup", False, "Failed to create guest account")
            return result

    try:
        # 1. Create a process
        process_data = generate_process_data()
        success, process, status, time_taken = client.post(
            PROCESSES_ENDPOINT, process_data, cleanup_callback=lambda id: client.delete(f"{PROCESSES_ENDPOINT}/{id}")
        )

        if not success:
            result.add_result("Create process for substep tests", False, f"Failed to create process: {status}", time_taken)
            return result

        process_id = process.get("id")
        result.add_result("Create process for substep tests", True, f"Process ID: {process_id}", time_taken)

        # 2. Create a step to add substeps to
        step_data = generate_step_data(process_id)
        success, step, status, time_taken = client.post(
            f"{PROCESSES_ENDPOINT}/{process_id}/steps",
            step_data,
            cleanup_callback=lambda id: client.delete(f"{PROCESSES_ENDPOINT}/steps/{id}"),
        )

        if not success:
            result.add_result("Create step for substep tests", False, f"Failed to create step: {status}", time_taken)
            return result

        step_id = step.get("id")
        result.add_result("Create step for substep tests", True, f"Step ID: {step_id}", time_taken)

        # 3. Create a substep
        substep_data = generate_substep_data(step_id)
        success, substep, status, time_taken = client.post(
            f"{PROCESSES_ENDPOINT}/steps/{step_id}/substeps",
            substep_data,
            cleanup_callback=lambda id: client.delete(f"{PROCESSES_ENDPOINT}/substeps/{id}"),
        )

        result.add_result(
            "Create substep",
            success,
            f"Substep ID: {substep.get('id') if success else None} (Status: {status})",
            time_taken,
        )

        if not success:
            return result

        substep_id = substep.get("id")

        # 4. Get the substep
        success, get_substep, status, time_taken = client.get(f"{PROCESSES_ENDPOINT}/substeps/{substep_id}")
        result.add_result(
            "Get substep by ID",
            success,
            f"Retrieved substep with content: {get_substep.get('content') if success else None}",
            time_taken,
        )

        # 5. List all substeps for the step
        success, substeps_list, status, time_taken = client.get(f"{PROCESSES_ENDPOINT}/steps/{step_id}/substeps")

        if success:
            # Check if our substep is in the list
            our_substep = next((s for s in substeps_list if s.get("id") == substep_id), None)

            result.add_result(
                "List step substeps",
                our_substep is not None,
                (f"Found our substep in list of {len(substeps_list)} substeps" if our_substep else "Our substep not found in list"),
                time_taken,
            )
        else:
            result.add_result("List step substeps", False, f"Failed to list substeps: {status}", time_taken)

        # 6. Update substep
        substep_update = {"content": f"Updated {substep_data['content']}", "completed": True}

        success, updated_substep, status, time_taken = client.put(f"{PROCESSES_ENDPOINT}/substeps/{substep_id}", substep_update)

        result.add_result(
            "Update substep",
            success,
            f"Updated substep content: {updated_substep.get('content') if success else None}",
            time_taken,
        )

        # 7. Verify update was applied
        if success:
            success, get_updated, status, time_taken = client.get(f"{PROCESSES_ENDPOINT}/substeps/{substep_id}")

            if success:
                update_verified = get_updated.get("content") == substep_update["content"] and get_updated.get("completed") == substep_update["completed"]

                result.add_result(
                    "Verify substep update",
                    update_verified,
                    "Substep updates were correctly applied" if update_verified else "Substep updates failed",
                )

        # 8. Delete substep
        success, _, status, time_taken = client.delete(f"{PROCESSES_ENDPOINT}/substeps/{substep_id}")
        result.add_result("Delete substep", success, f"Status: {status}", time_taken)

        # 9. Verify deletion
        if success:
            success, _, status, time_taken = client.get(f"{PROCESSES_ENDPOINT}/substeps/{substep_id}", expected_status=404)

            result.add_result(
                "Verify substep deletion",
                status == 404,
                "Substep was successfully deleted" if status == 404 else f"Substep still exists (status: {status})",
                time_taken,
            )

    except Exception as e:
        logger.error(f"Error during process substep tests: {str(e)}")
        result.add_result("Process substep test execution", False, f"Exception: {str(e)}")
    finally:
        # Cleanup
        await client.cleanup_resources()
        client.close()

    return result


async def test_process_templates() -> TestResult:
    """Test operations for process templates."""
    client = ApiTestClient()
    result = TestResult("Process Templates")

    # Set up authentication
    if not client.auth_token:
        token = await client.create_guest_account()
        if not token:
            result.add_result("Authentication setup", False, "Failed to create guest account")
            return result

    try:
        # 1. Create a process template
        template_data = generate_process_data(template=True, with_steps=True)
        success, template, status, time_taken = client.post(
            PROCESSES_ENDPOINT, template_data, cleanup_callback=lambda id: client.delete(f"{PROCESSES_ENDPOINT}/{id}")
        )

        result.add_result(
            "Create process template",
            success,
            f"Template ID: {template.get('id') if success else None} (Status: {status})",
            time_taken,
        )

        if not success:
            return result

        template_id = template.get("id")

        # 2. Verify template flag
        if success:
            is_template = template.get("isTemplate", False)
            result.add_result(
                "Verify process is template",
                is_template,
                "Process created as template" if is_template else "Process not created as template",
            )

        # 3. List all templates
        success, templates_list, status, time_taken = client.get(PROCESS_TEMPLATES_ENDPOINT)

        if success:
            # Check if our template is in the list
            our_template = next((t for t in templates_list if t.get("id") == template_id), None)

            result.add_result(
                "List process templates",
                our_template is not None,
                (f"Found our template in list of {len(templates_list)} templates" if our_template else "Our template not found in list"),
                time_taken,
            )
        else:
            result.add_result("List process templates", False, f"Failed to list templates: {status}", time_taken)

        # 4. Create instance from template
        instance_data = {
            "title": f"Instance of {template_data['title']}",
            "description": f"Instance created from template {template_id}",
            "template_id": template_id,
        }

        success, instance, status, time_taken = client.post(
            f"{PROCESSES_ENDPOINT}/instances",
            instance_data,
            cleanup_callback=lambda id: client.delete(f"{PROCESSES_ENDPOINT}/{id}"),
        )

        result.add_result(
            "Create instance from template",
            success,
            f"Instance ID: {instance.get('id') if success else None} (Status: {status})",
            time_taken,
        )

        if not success:
            return result

        instance_id = instance.get("id")

        # 5. Verify instance properties
        if success:
            is_template = instance.get("isTemplate", True)
            template_ref = instance.get("templateId")

            template_verified = not is_template and template_ref == template_id

            result.add_result(
                "Verify instance properties",
                template_verified,
                ("Instance correctly references template" if template_verified else "Instance doesn't correctly reference template"),
            )

            # 6. Check that template has this instance in its instances list
            success, template_detail, status, time_taken = client.get(f"{PROCESSES_ENDPOINT}/{template_id}")

            if success:
                instance_ids = template_detail.get("instanceIds", [])
                has_instance = instance_id in instance_ids

                result.add_result(
                    "Template references instance",
                    has_instance,
                    ("Template correctly references its instance" if has_instance else "Template doesn't reference instance"),
                )

        # 7. Get instance details to verify steps were copied
        success, instance_detail, status, time_taken = client.get(f"{PROCESSES_ENDPOINT}/{instance_id}")

        if success:
            steps = instance_detail.get("steps", [])

            result.add_result(
                "Instance has steps from template",
                len(steps) > 0,
                (f"Instance has {len(steps)} steps from template" if len(steps) > 0 else "Instance doesn't have steps from template"),
                time_taken,
            )

    except Exception as e:
        logger.error(f"Error during process template tests: {str(e)}")
        result.add_result("Process template test execution", False, f"Exception: {str(e)}")
    finally:
        # Cleanup
        await client.cleanup_resources()
        client.close()

    return result


async def main():
    """Run all process tests."""
    # Run health check
    health_result = await test_process_health_check()
    health_result.print_results()

    # If health check passes, run other tests
    if health_result.passed():
        # Run CRUD tests
        crud_result = await test_process_crud()
        crud_result.print_results()

        # Run step tests
        steps_result = await test_process_steps()
        steps_result.print_results()

        # Run substep tests
        substeps_result = await test_process_substeps()
        substeps_result.print_results()

        # Run template tests
        templates_result = await test_process_templates()
        templates_result.print_results()

        # Determine overall success
        success = all(
            [
                health_result.passed(),
                crud_result.passed(),
                steps_result.passed(),
                substeps_result.passed(),
                templates_result.passed(),
            ]
        )

        # Exit with appropriate code
        sys.exit(0 if success else 1)
    else:
        # Health check failed, exit with error
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
