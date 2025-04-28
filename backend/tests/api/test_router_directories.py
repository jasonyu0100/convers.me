#!/usr/bin/env python3
"""
Enhanced tests for the directories router.

This module provides comprehensive testing for the directories API endpoints,
including CRUD operations for directories and relationship operations.
"""

import asyncio
import logging
import sys

from test_utils import ApiTestClient, TestResult, generate_directory_data, generate_process_data

# Configure logging
logger = logging.getLogger("directory_tests")

# Test endpoints
DIRECTORIES_ENDPOINT = "/directories"


async def test_directory_health_check() -> TestResult:
    """Test the directory health check endpoint."""
    client = ApiTestClient()
    result = TestResult("Directory Health Check")

    # Test health endpoint
    success, data, status, time_taken = client.get(f"{DIRECTORIES_ENDPOINT}/health", auth_required=False)
    result.add_result(
        "Directory router health check",
        success,
        f"Status: {status}" if not success else "Router is healthy",
        time_taken,
    )

    # Close the client session
    client.close()
    return result


async def test_directory_crud() -> TestResult:
    """Test CRUD operations for directories."""
    client = ApiTestClient()
    result = TestResult("Directory CRUD Operations")

    # Set up authentication
    if not client.auth_token:
        token = await client.create_guest_account()
        if not token:
            result.add_result("Authentication setup", False, "Failed to create guest account")
            return result

    try:
        # 1. Create parent directory
        parent_data = generate_directory_data()
        parent_data["name"] = f"Parent {parent_data['name']}"

        success, parent, status, time_taken = client.post(
            DIRECTORIES_ENDPOINT, parent_data, cleanup_callback=lambda id: client.delete(f"{DIRECTORIES_ENDPOINT}/{id}")
        )

        result.add_result(
            "Create parent directory",
            success,
            f"Parent Directory ID: {parent.get('id') if success else None} (Status: {status})",
            time_taken,
        )

        if not success:
            return result

        parent_id = parent.get("id")

        # 2. Create child directory
        child_data = generate_directory_data()
        child_data["name"] = f"Child {child_data['name']}"
        child_data["parent_id"] = parent_id

        success, child, status, time_taken = client.post(
            DIRECTORIES_ENDPOINT, child_data, cleanup_callback=lambda id: client.delete(f"{DIRECTORIES_ENDPOINT}/{id}")
        )

        result.add_result(
            "Create child directory",
            success,
            f"Child Directory ID: {child.get('id') if success else None} (Status: {status})",
            time_taken,
        )

        if not success:
            return result

        child_id = child.get("id")

        # 3. Get the parent directory
        success, get_parent, status, time_taken = client.get(f"{DIRECTORIES_ENDPOINT}/{parent_id}")
        result.add_result(
            "Get parent directory by ID",
            success,
            f"Retrieved directory with name: {get_parent.get('name') if success else None}",
            time_taken,
        )

        # 4. Verify retrieved parent directory matches what we created
        if success:
            matches = (
                get_parent.get("name") == parent_data["name"]
                and get_parent.get("description") == parent_data["description"]
                and get_parent.get("color") == parent_data["color"]
            )
            result.add_result(
                "Parent directory data integrity",
                matches,
                "Directory data matches what was created" if matches else "Directory data doesn't match",
            )

        # 5. Get child directory with parent relationship
        success, get_child, status, time_taken = client.get(f"{DIRECTORIES_ENDPOINT}/{child_id}")

        if success:
            # Verify parent-child relationship
            has_parent = get_child.get("parentId") == parent_id

            result.add_result(
                "Verify parent-child relationship",
                has_parent,
                ("Child directory correctly references parent" if has_parent else "Parent reference missing or incorrect"),
            )
        else:
            result.add_result("Get child directory", False, f"Failed to get child directory: {status}", time_taken)

        # 6. Update directory
        update_data = {
            "name": f"Updated {parent_data['name']}",
            "description": f"Updated {parent_data['description']}",
            "color": "red",
        }

        success, updated_dir, status, time_taken = client.put(f"{DIRECTORIES_ENDPOINT}/{parent_id}", update_data)

        result.add_result(
            "Update directory",
            success,
            f"Updated directory name: {updated_dir.get('name') if success else None}",
            time_taken,
        )

        # 7. Verify update was applied
        if success:
            success, get_updated, status, time_taken = client.get(f"{DIRECTORIES_ENDPOINT}/{parent_id}")

            if success:
                update_verified = (
                    get_updated.get("name") == update_data["name"]
                    and get_updated.get("description") == update_data["description"]
                    and get_updated.get("color") == update_data["color"]
                )

                result.add_result(
                    "Verify directory update",
                    update_verified,
                    "Directory updates were correctly applied" if update_verified else "Directory updates failed",
                )

        # 8. List all directories
        success, dir_list, status, time_taken = client.get(DIRECTORIES_ENDPOINT)

        if success:
            # Check if our directories are in the list
            our_parent = next((d for d in dir_list if d.get("id") == parent_id), None)

            our_child = next((d for d in dir_list if d.get("id") == child_id), None)

            found_both = our_parent is not None and our_child is not None

            result.add_result(
                "List directories",
                found_both,
                (f"Found our directories in list of {len(dir_list)} directories" if found_both else "One or both directories not found in list"),
                time_taken,
            )
        else:
            result.add_result("List directories", False, f"Failed to list directories: {status}", time_taken)

        # 9. Get directory details with processes
        success, parent_details, status, time_taken = client.get(f"{DIRECTORIES_ENDPOINT}/{parent_id}/details")

        result.add_result(
            "Get directory details",
            success,
            f"Retrieved directory details" if success else f"Failed to get directory details: {status}",
            time_taken,
        )

        # Check for subdirectories in the parent details
        if success:
            subdirs = parent_details.get("subdirectories", [])
            has_child = next((d for d in subdirs if d.get("id") == child_id), None) is not None

            result.add_result(
                "Parent details include child directory",
                has_child,
                ("Child directory found in parent's subdirectories" if has_child else "Child directory not found in parent's subdirectories"),
            )

        # 10. Create a process in the directory
        process_data = generate_process_data()
        process_data["directory_id"] = parent_id

        success, process, status, time_taken = client.post("/processes", process_data, cleanup_callback=lambda id: client.delete(f"/processes/{id}"))

        result.add_result(
            "Create process in directory",
            success,
            f"Process ID: {process.get('id') if success else None} (Status: {status})",
            time_taken,
        )

        if success:
            process_id = process.get("id")

            # 11. Get directory details again to check for processes
            success, updated_details, status, time_taken = client.get(f"{DIRECTORIES_ENDPOINT}/{parent_id}/details")

            if success:
                processes = updated_details.get("processes", [])
                has_process = next((p for p in processes if p.get("id") == process_id), None) is not None

                result.add_result(
                    "Directory details include process",
                    has_process,
                    ("Process found in directory's processes" if has_process else "Process not found in directory's processes"),
                )

        # 12. Delete child directory first
        success, _, status, time_taken = client.delete(f"{DIRECTORIES_ENDPOINT}/{child_id}")
        result.add_result("Delete child directory", success, f"Status: {status}", time_taken)

        # 13. Verify child deletion
        if success:
            success, _, status, time_taken = client.get(f"{DIRECTORIES_ENDPOINT}/{child_id}", expected_status=404)

            result.add_result(
                "Verify child directory deletion",
                status == 404,
                ("Child directory was successfully deleted" if status == 404 else f"Child directory still exists (status: {status})"),
                time_taken,
            )

        # 14. Delete parent directory (and any associated objects)
        success, _, status, time_taken = client.delete(f"{DIRECTORIES_ENDPOINT}/{parent_id}")
        result.add_result("Delete parent directory", success, f"Status: {status}", time_taken)

        # 15. Verify parent deletion
        if success:
            success, _, status, time_taken = client.get(f"{DIRECTORIES_ENDPOINT}/{parent_id}", expected_status=404)

            result.add_result(
                "Verify parent directory deletion",
                status == 404,
                ("Parent directory was successfully deleted" if status == 404 else f"Parent directory still exists (status: {status})"),
                time_taken,
            )

    except Exception as e:
        logger.error(f"Error during directory CRUD tests: {str(e)}")
        result.add_result("Directory CRUD test execution", False, f"Exception: {str(e)}")
    finally:
        # Cleanup
        await client.cleanup_resources()
        client.close()

    return result


async def test_directory_hierarchy() -> TestResult:
    """Test operations for directory hierarchies."""
    client = ApiTestClient()
    result = TestResult("Directory Hierarchies")

    # Set up authentication
    if not client.auth_token:
        token = await client.create_guest_account()
        if not token:
            result.add_result("Authentication setup", False, "Failed to create guest account")
            return result

    try:
        # Create a three-level hierarchy
        # Level 1: Root
        root_data = generate_directory_data()
        root_data["name"] = "Root Directory"
        root_data["color"] = "blue"

        success, root, status, time_taken = client.post(
            DIRECTORIES_ENDPOINT, root_data, cleanup_callback=lambda id: client.delete(f"{DIRECTORIES_ENDPOINT}/{id}")
        )

        result.add_result("Create root directory", success, f"Root Directory ID: {root.get('id') if success else None}", time_taken)

        if not success:
            return result

        root_id = root.get("id")

        # Level 2: Mid-level (2 directories)
        mid_dirs = []
        for i in range(2):
            mid_data = generate_directory_data()
            mid_data["name"] = f"Mid-Level Directory {i+1}"
            mid_data["color"] = "green"
            mid_data["parent_id"] = root_id

            success, mid, status, time_taken = client.post(
                DIRECTORIES_ENDPOINT,
                mid_data,
                cleanup_callback=lambda id: client.delete(f"{DIRECTORIES_ENDPOINT}/{id}"),
            )

            result.add_result(
                f"Create mid-level directory {i+1}",
                success,
                f"Mid-Level Directory ID: {mid.get('id') if success else None}",
                time_taken,
            )

            if success:
                mid_dirs.append(mid)

        if len(mid_dirs) != 2:
            result.add_result(
                "Create mid-level directories",
                False,
                f"Failed to create all mid-level directories. Only created {len(mid_dirs)} of 2",
            )
            return result

        # Level 3: Leaf directories (2 under each mid-level)
        leaf_dirs = []
        for i, mid_dir in enumerate(mid_dirs):
            for j in range(2):
                leaf_data = generate_directory_data()
                leaf_data["name"] = f"Leaf Directory {i+1}-{j+1}"
                leaf_data["color"] = "orange"
                leaf_data["parent_id"] = mid_dir.get("id")

                success, leaf, status, time_taken = client.post(
                    DIRECTORIES_ENDPOINT,
                    leaf_data,
                    cleanup_callback=lambda id: client.delete(f"{DIRECTORIES_ENDPOINT}/{id}"),
                )

                result.add_result(
                    f"Create leaf directory {i+1}-{j+1}",
                    success,
                    f"Leaf Directory ID: {leaf.get('id') if success else None}",
                    time_taken,
                )

                if success:
                    leaf_dirs.append(leaf)

        # Now test that we can retrieve the full hierarchy
        success, root_details, status, time_taken = client.get(f"{DIRECTORIES_ENDPOINT}/{root_id}/details")

        result.add_result(
            "Get root directory details",
            success,
            f"Retrieved root directory details" if success else f"Failed to get root details: {status}",
            time_taken,
        )

        if success:
            # Check that root has the correct mid-level directories as subdirectories
            subdirs = root_details.get("subdirectories", [])
            mid_ids = [mid.get("id") for mid in mid_dirs]
            found_mid_ids = [subdir.get("id") for subdir in subdirs]

            all_mid_found = all(mid_id in found_mid_ids for mid_id in mid_ids)

            result.add_result(
                "Root directory contains all mid-level directories",
                all_mid_found,
                (
                    f"Found {len(subdirs)} mid-level directories under root"
                    if all_mid_found
                    else f"Not all mid-level directories found. Found {len(subdirs)} of {len(mid_ids)}"
                ),
            )

            # Check one of the mid-level directories for its leaf directories
            if len(subdirs) > 0:
                mid_id = subdirs[0].get("id")

                success, mid_details, status, time_taken = client.get(f"{DIRECTORIES_ENDPOINT}/{mid_id}/details")

                result.add_result(
                    "Get mid-level directory details",
                    success,
                    (f"Retrieved mid-level directory details" if success else f"Failed to get mid-level details: {status}"),
                    time_taken,
                )

                if success:
                    # This mid-level should have 2 leaf directories
                    leaf_subdirs = mid_details.get("subdirectories", [])

                    result.add_result(
                        "Mid-level directory contains leaf directories",
                        len(leaf_subdirs) == 2,
                        (
                            f"Found {len(leaf_subdirs)} leaf directories under mid-level directory"
                            if len(leaf_subdirs) == 2
                            else f"Expected 2 leaf directories, found {len(leaf_subdirs)}"
                        ),
                    )

        # Test moving a directory (changing parent)
        # Move a leaf directory from mid1 to mid2
        if len(mid_dirs) >= 2 and len(leaf_dirs) >= 1:
            leaf_to_move = leaf_dirs[0]
            target_mid = mid_dirs[1].get("id")
            leaf_to_move.get("parentId")

            update_data = {"parent_id": target_mid}

            success, moved_leaf, status, time_taken = client.put(f"{DIRECTORIES_ENDPOINT}/{leaf_to_move.get('id')}", update_data)

            result.add_result(
                "Move leaf directory to new parent",
                success,
                (f"Moved leaf directory to new parent mid-level directory" if success else f"Failed to move directory: {status}"),
                time_taken,
            )

            if success:
                # Verify the move
                success, leaf_details, status, time_taken = client.get(f"{DIRECTORIES_ENDPOINT}/{leaf_to_move.get('id')}")

                if success:
                    new_parent_id = leaf_details.get("parentId")
                    move_verified = new_parent_id == target_mid

                    result.add_result(
                        "Verify directory move",
                        move_verified,
                        (
                            "Leaf directory now has correct new parent"
                            if move_verified
                            else f"Leaf has wrong parent: expected {target_mid}, got {new_parent_id}"
                        ),
                    )

    except Exception as e:
        logger.error(f"Error during directory hierarchy tests: {str(e)}")
        result.add_result("Directory hierarchy test execution", False, f"Exception: {str(e)}")
    finally:
        # Cleanup
        await client.cleanup_resources()
        client.close()

    return result


async def main():
    """Run all directory tests."""
    # Run health check
    health_result = await test_directory_health_check()
    health_result.print_results()

    # If health check passes, run other tests
    if health_result.passed():
        # Run CRUD tests
        crud_result = await test_directory_crud()
        crud_result.print_results()

        # Run hierarchy tests
        hierarchy_result = await test_directory_hierarchy()
        hierarchy_result.print_results()

        # Determine overall success
        success = all([health_result.passed(), crud_result.passed(), hierarchy_result.passed()])

        # Exit with appropriate code
        sys.exit(0 if success else 1)
    else:
        # Health check failed, exit with error
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
