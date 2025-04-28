#!/usr/bin/env python3
"""
Comprehensive test for all API routes.
This script tests the functionality of all API endpoints.
"""

import asyncio
import sys
import time

from test_utils import ApiTestClient, TestResult

# Test data for various endpoints
TEST_DATA = {
    # User data
    "user": {
        "email": f"test_{int(time.time())}@example.com",
        "password": "Password123!",
        "name": "Test User",
        "handle": f"test_user_{int(time.time())}",
    },
    # Process data
    "process": {
        "title": "Test Process",
        "description": "A test process for API testing",
        "color": "blue",
        "is_template": True,
    },
    # Step data
    "step": {"content": "Test Step", "order": 0, "completed": False},
    # Substep data
    "substep": {"content": "Test Substep", "order": 0, "completed": False},
    # Directory data
    "directory": {"name": "Test Directory", "description": "A test directory for API testing", "color": "green"},
    # Event data
    "event": {
        "title": "Test Event",
        "description": "A test event for API testing",
        "date": "2023-12-31",
        "time": "12:00:00",
        "status": "planning",
        "color": "blue",
    },
    # Topic data
    "topic": {"name": "Test Topic", "category": "test", "color": "red"},
    # Post data
    "post": {"content": "This is a test post for API testing", "visibility": "public"},
    # Media metadata (not actual upload)
    "media": {"type": "image", "title": "Test Image", "url": "https://example.com/test.jpg"},
    # Notification data
    "notification": {
        "type": "general",
        "title": "Test Notification",
        "message": "This is a test notification",
        "read": False,
    },
}


class ApiTestSuite:
    """Test suite for all API endpoints."""

    def __init__(self):
        self.client = ApiTestClient()
        self.created_entities = {
            "users": [],
            "processes": [],
            "templates": [],
            "directories": [],
            "events": [],
            "topics": [],
            "posts": [],
            "media": [],
        }

    async def setup(self):
        """Set up the test environment."""
        # Try to create a guest account if no auth token is provided
        if not self.client.auth_token:
            token = await self.client.create_guest_account()
            if not token:
                print("Failed to create guest account. Some tests will fail.")

    async def teardown(self):
        """Clean up test data."""
        # Delete created entities in reverse order of dependency
        for post_id in self.created_entities["posts"]:
            self.client.delete(f"/posts/{post_id}")

        for media_id in self.created_entities["media"]:
            self.client.delete(f"/media/{media_id}")

        for event_id in self.created_entities["events"]:
            self.client.delete(f"/events/{event_id}")

        for process_id in self.created_entities["processes"]:
            self.client.delete(f"/processes/{process_id}")

        for template_id in self.created_entities["templates"]:
            self.client.delete(f"/templates/{template_id}")

        for directory_id in self.created_entities["directories"]:
            self.client.delete(f"/directories/{directory_id}")

        for topic_id in self.created_entities["topics"]:
            self.client.delete(f"/topics/{topic_id}")

        # Close the client session
        self.client.close()

    async def run_tests(self):
        """Run all tests."""
        await self.setup()

        try:
            # Run tests for each module
            results = []

            # Basic health checks
            results.append(await self.test_health_checks())

            # Core features
            results.append(await self.test_auth())
            results.append(await self.test_users())
            results.append(await self.test_directories())
            results.append(await self.test_processes())
            results.append(await self.test_templates())
            results.append(await self.test_events())
            results.append(await self.test_topics())
            results.append(await self.test_posts())

            # Additional features
            results.append(await self.test_media())
            results.append(await self.test_search())
            results.append(await self.test_notifications())
            results.append(await self.test_calendar())
            results.append(await self.test_insights())
            results.append(await self.test_feed())
            results.append(await self.test_settings())

            # Print summary
            all_passed = all(result.passed() for result in results)
            total_passed = sum(result.count()[0] for result in results)
            total_tests = sum(result.count()[1] for result in results)

            print(f"\n{'='*50}")
            print(f"OVERALL SUMMARY: {total_passed}/{total_tests} tests passed")
            print(f"{'='*50}")

            return all_passed
        finally:
            await self.teardown()

    async def test_health_checks(self) -> TestResult:
        """Test health check endpoints."""
        result = TestResult("Health Checks")

        # Test main health endpoint
        success, data, status, time_taken = self.client.get("/health", auth_required=False)
        result.add_result("Main health check", success, f"Status: {status}" if not success else "API is healthy", time_taken)

        # Test router-specific health endpoints
        routers = [
            "/processes/health",
            "/templates/health",
            "/live-processes/health",
            "/directories/health",
            "/events/health",
            "/topics/health",
            "/users/health",
            "/posts/health",
        ]

        for endpoint in routers:
            success, data, status, time_taken = self.client.get(endpoint, auth_required=False)
            router_name = endpoint.split("/")[1]
            result.add_result(
                f"{router_name} health check",
                success,
                f"Status: {status}" if not success else f"{router_name} router is healthy",
                time_taken,
            )

        return result

    async def test_auth(self) -> TestResult:
        """Test authentication endpoints."""
        result = TestResult("Authentication")

        # Test /token endpoint (login)
        # We're using form data, not JSON for this endpoint
        token_url = f"{self.client.base_url}/token"
        form_data = {"username": TEST_DATA["user"]["email"], "password": TEST_DATA["user"]["password"]}

        # This endpoint might fail if the user doesn't exist, which is expected
        try:
            response = self.client.session.post(
                token_url,
                data=form_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=self.client.session.timeout,
            )

            if response.status_code == 200:
                response.json()
                result.add_result("Login with token endpoint", True, "Successfully logged in with credentials")
            else:
                result.add_result(
                    "Login with token endpoint",
                    False,
                    f"Status: {response.status_code} - This may be expected if the test user doesn't exist",
                )
        except Exception as e:
            result.add_result("Login with token endpoint", False, f"Error: {str(e)}")

        # Test guest login endpoint
        success, data, status, time_taken = self.client.post("/guest", {"role": "dev"}, auth_required=False)

        if success and data and "access_token" in data:
            result.add_result("Guest login", True, "Successfully created guest account", time_taken)
        else:
            result.add_result("Guest login", False, f"Failed to create guest account: {status}", time_taken)

        return result

    async def test_users(self) -> TestResult:
        """Test user-related endpoints."""
        result = TestResult("Users")

        # Test current user endpoint
        success, data, status, time_taken = self.client.get("/users/me")

        if success and data:
            user_id = data.get("id")
            result.add_result("Get current user", True, f"User ID: {user_id}", time_taken)

            # Test getting user by ID
            success, data, status, time_taken = self.client.get(f"/users/{user_id}")
            result.add_result("Get user by ID", success, f"Status: {status}", time_taken)

            # Test user preferences
            success, data, status, time_taken = self.client.get("/users/me/preferences")
            result.add_result("Get user preferences", success, f"Status: {status}", time_taken)

            # Test updating user preferences
            prefs_update = {"theme": "dark", "email_notifications": True}
            success, data, status, time_taken = self.client.put("/users/me/preferences", prefs_update)
            result.add_result("Update user preferences", success, f"Status: {status}", time_taken)
        else:
            result.add_result("Get current user", False, f"Failed to get current user: {status}", time_taken)

        # Test user listing endpoint
        success, data, status, time_taken = self.client.get("/users")
        result.add_result("List users", success, f"Status: {status}", time_taken)

        return result

    async def test_directories(self) -> TestResult:
        """Test directory-related endpoints."""
        result = TestResult("Directories")

        # Test directory creation
        success, data, status, time_taken = self.client.post("/directories", TEST_DATA["directory"])

        if success and data:
            directory_id = data.get("id")
            result.add_result("Create directory", True, f"Directory ID: {directory_id}", time_taken)
            self.created_entities["directories"].append(directory_id)

            # Test directory retrieval
            success, data, status, time_taken = self.client.get(f"/directories/{directory_id}")
            result.add_result("Get directory by ID", success, f"Status: {status}", time_taken)

            # Test directory update
            update_data = {"name": "Updated Directory Name"}
            success, data, status, time_taken = self.client.put(f"/directories/{directory_id}", update_data)
            result.add_result("Update directory", success, f"Status: {status}", time_taken)

            # Test directory listing
            success, data, status, time_taken = self.client.get("/directories")
            result.add_result("List directories", success, f"Status: {status}", time_taken)

            # Test directory deletion
            success, data, status, time_taken = self.client.delete(f"/directories/{directory_id}")
            result.add_result("Delete directory", success, f"Status: {status}", time_taken)
            if success:
                self.created_entities["directories"].remove(directory_id)
        else:
            result.add_result("Create directory", False, f"Failed to create directory: {status}", time_taken)

        # Test public directory test endpoint
        success, data, status, time_taken = self.client.get("/directories/test", auth_required=False)
        result.add_result("Directory test endpoint", success, f"Status: {status}", time_taken)

        return result

    async def test_processes(self) -> TestResult:
        """Test process-related endpoints."""
        result = TestResult("Processes")

        # Test process creation
        success, data, status, time_taken = self.client.post("/processes", TEST_DATA["process"])

        if success and data:
            process_id = data.get("id")
            result.add_result("Create process", True, f"Process ID: {process_id}", time_taken)
            self.created_entities["processes"].append(process_id)

            # Test step creation
            step_data = dict(TEST_DATA["step"])
            step_data["process_id"] = process_id
            success, step_data_resp, status, time_taken = self.client.post(f"/processes/{process_id}/steps", step_data)

            if success and step_data_resp:
                step_id = step_data_resp.get("id")
                result.add_result("Create step", True, f"Step ID: {step_id}", time_taken)

                # Test substep creation
                substep_data = dict(TEST_DATA["substep"])
                substep_data["step_id"] = step_id
                success, substep_data_resp, status, time_taken = self.client.post(f"/processes/steps/{step_id}/substeps", substep_data)

                if success and substep_data_resp:
                    substep_id = substep_data_resp.get("id")
                    result.add_result("Create substep", True, f"Substep ID: {substep_id}", time_taken)

                    # Test getting steps
                    success, data, status, time_taken = self.client.get(f"/processes/{process_id}/steps")
                    result.add_result("Get process steps", success, f"Status: {status}", time_taken)

                    # Test updating step
                    step_update = {"content": "Updated Step Content"}
                    success, data, status, time_taken = self.client.put(f"/processes/steps/{step_id}", step_update)
                    result.add_result("Update step", success, f"Status: {status}", time_taken)

                    # Test updating substep
                    substep_update = {"content": "Updated Substep Content"}
                    success, data, status, time_taken = self.client.put(f"/processes/substeps/{substep_id}", substep_update)
                    result.add_result("Update substep", success, f"Status: {status}", time_taken)

                    # Test getting substeps
                    success, data, status, time_taken = self.client.get(f"/processes/steps/{step_id}/substeps")
                    result.add_result("Get step substeps", success, f"Status: {status}", time_taken)

                    # Test deleting substep
                    success, data, status, time_taken = self.client.delete(f"/processes/substeps/{substep_id}")
                    result.add_result("Delete substep", success, f"Status: {status}", time_taken)
                else:
                    result.add_result("Create substep", False, f"Failed to create substep: {status}", time_taken)

                # Test deleting step
                success, data, status, time_taken = self.client.delete(f"/processes/steps/{step_id}")
                result.add_result("Delete step", success, f"Status: {status}", time_taken)
            else:
                result.add_result("Create step", False, f"Failed to create step: {status}", time_taken)

            # Test process retrieval
            success, data, status, time_taken = self.client.get(f"/processes/{process_id}")
            result.add_result("Get process by ID", success, f"Status: {status}", time_taken)

            # Test process update
            update_data = {"title": "Updated Process Title"}
            success, data, status, time_taken = self.client.put(f"/processes/{process_id}", update_data)
            result.add_result("Update process", success, f"Status: {status}", time_taken)

            # Test process listing
            success, data, status, time_taken = self.client.get("/processes")
            result.add_result("List processes", success, f"Status: {status}", time_taken)

            # Test process deletion
            success, data, status, time_taken = self.client.delete(f"/processes/{process_id}")
            result.add_result("Delete process", success, f"Status: {status}", time_taken)
            if success:
                self.created_entities["processes"].remove(process_id)
        else:
            result.add_result("Create process", False, f"Failed to create process: {status}", time_taken)

        return result

    async def test_templates(self) -> TestResult:
        """Test template-related endpoints."""
        result = TestResult("Templates")

        # Create a template
        template_data = dict(TEST_DATA["process"])
        template_data["is_template"] = True
        success, data, status, time_taken = self.client.post("/templates", template_data)

        if success and data:
            template_id = data.get("id")
            result.add_result("Create template", True, f"Template ID: {template_id}", time_taken)
            self.created_entities["templates"].append(template_id)

            # Test template retrieval
            success, data, status, time_taken = self.client.get(f"/templates/{template_id}")
            result.add_result("Get template by ID", success, f"Status: {status}", time_taken)

            # Test template update
            update_data = {"title": "Updated Template Title"}
            success, data, status, time_taken = self.client.put(f"/templates/{template_id}", update_data)
            result.add_result("Update template", success, f"Status: {status}", time_taken)

            # Test template listing
            success, data, status, time_taken = self.client.get("/templates")
            result.add_result("List templates", success, f"Status: {status}", time_taken)

            # Test template deletion
            success, data, status, time_taken = self.client.delete(f"/templates/{template_id}")
            result.add_result("Delete template", success, f"Status: {status}", time_taken)
            if success:
                self.created_entities["templates"].remove(template_id)
        else:
            result.add_result("Create template", False, f"Failed to create template: {status}", time_taken)

        # Test public template test endpoint
        success, data, status, time_taken = self.client.get("/templates/test", auth_required=False)
        result.add_result("Template test endpoint", success, f"Status: {status}", time_taken)

        return result

    async def test_events(self) -> TestResult:
        """Test event-related endpoints."""
        result = TestResult("Events")

        # Create an event
        success, data, status, time_taken = self.client.post("/events", TEST_DATA["event"])

        if success and data:
            event_id = data.get("id")
            result.add_result("Create event", True, f"Event ID: {event_id}", time_taken)
            self.created_entities["events"].append(event_id)

            # Test event retrieval
            success, data, status, time_taken = self.client.get(f"/events/{event_id}")
            result.add_result("Get event by ID", success, f"Status: {status}", time_taken)

            # Test event update
            update_data = {"title": "Updated Event Title"}
            success, data, status, time_taken = self.client.put(f"/events/{event_id}", update_data)
            result.add_result("Update event", success, f"Status: {status}", time_taken)

            # Test event listing
            success, data, status, time_taken = self.client.get("/events")
            result.add_result("List events", success, f"Status: {status}", time_taken)

            # Test adding participants if API supports it
            try:
                participant_data = {"user_id": "current"}  # Use current user
                success, data, status, time_taken = self.client.post(f"/events/{event_id}/participants", participant_data)
                result.add_result("Add event participant", success, f"Status: {status}", time_taken)

                # Test getting participants
                success, data, status, time_taken = self.client.get(f"/events/{event_id}/participants")
                result.add_result("Get event participants", success, f"Status: {status}", time_taken)
            except:
                # This might not be implemented
                pass

            # Test event deletion
            success, data, status, time_taken = self.client.delete(f"/events/{event_id}")
            result.add_result("Delete event", success, f"Status: {status}", time_taken)
            if success:
                self.created_entities["events"].remove(event_id)
        else:
            result.add_result("Create event", False, f"Failed to create event: {status}", time_taken)

        # Test calendar events endpoint
        params = {"start_date": "2023-01-01", "end_date": "2023-12-31"}
        success, data, status, time_taken = self.client.get("/events/calendar", params=params)
        result.add_result("Get calendar events", success, f"Status: {status}", time_taken)

        return result

    async def test_topics(self) -> TestResult:
        """Test topic-related endpoints."""
        result = TestResult("Topics")

        # Create a topic
        success, data, status, time_taken = self.client.post("/topics", TEST_DATA["topic"])

        if success and data:
            topic_id = data.get("id")
            result.add_result("Create topic", True, f"Topic ID: {topic_id}", time_taken)
            self.created_entities["topics"].append(topic_id)

            # Test topic retrieval
            success, data, status, time_taken = self.client.get(f"/topics/{topic_id}")
            result.add_result("Get topic by ID", success, f"Status: {status}", time_taken)

            # Test topic update
            update_data = {"name": "Updated Topic Name"}
            success, data, status, time_taken = self.client.put(f"/topics/{topic_id}", update_data)
            result.add_result("Update topic", success, f"Status: {status}", time_taken)

            # Test topic listing
            success, data, status, time_taken = self.client.get("/topics")
            result.add_result("List topics", success, f"Status: {status}", time_taken)

            # Test topic deletion
            success, data, status, time_taken = self.client.delete(f"/topics/{topic_id}")
            result.add_result("Delete topic", success, f"Status: {status}", time_taken)
            if success:
                self.created_entities["topics"].remove(topic_id)
        else:
            result.add_result("Create topic", False, f"Failed to create topic: {status}", time_taken)

        return result

    async def test_posts(self) -> TestResult:
        """Test post-related endpoints."""
        result = TestResult("Posts")

        # Create a post
        post_data = dict(TEST_DATA["post"])
        success, data, status, time_taken = self.client.post("/posts", post_data)

        if success and data:
            post_id = data.get("id")
            result.add_result("Create post", True, f"Post ID: {post_id}", time_taken)
            self.created_entities["posts"].append(post_id)

            # Test post retrieval
            success, data, status, time_taken = self.client.get(f"/posts/{post_id}")
            result.add_result("Get post by ID", success, f"Status: {status}", time_taken)

            # Test post update
            update_data = {"content": "Updated post content"}
            success, data, status, time_taken = self.client.put(f"/posts/{post_id}", update_data)
            result.add_result("Update post", success, f"Status: {status}", time_taken)

            # Test post listing
            success, data, status, time_taken = self.client.get("/posts")
            result.add_result("List posts", success, f"Status: {status}", time_taken)

            # Test post deletion
            success, data, status, time_taken = self.client.delete(f"/posts/{post_id}")
            result.add_result("Delete post", success, f"Status: {status}", time_taken)
            if success:
                self.created_entities["posts"].remove(post_id)
        else:
            result.add_result("Create post", False, f"Failed to create post: {status}", time_taken)

        return result

    async def test_media(self) -> TestResult:
        """Test media-related endpoints."""
        result = TestResult("Media")

        # Since we can't easily test actual file uploads, test the simpler endpoints

        # Test media listing
        success, data, status, time_taken = self.client.get("/media")
        result.add_result("List media", success, f"Status: {status}", time_taken)

        # Test media metadata update if necessary
        # This is a placeholder - actual API may differ
        try:
            media_data = dict(TEST_DATA["media"])
            success, data, status, time_taken = self.client.post("/media/metadata", media_data)
            result.add_result("Create media metadata", success, f"Status: {status}", time_taken)

            if success and data and "id" in data:
                media_id = data["id"]
                self.created_entities["media"].append(media_id)

                # Test media deletion
                success, data, status, time_taken = self.client.delete(f"/media/{media_id}")
                result.add_result("Delete media", success, f"Status: {status}", time_taken)
                if success:
                    self.created_entities["media"].remove(media_id)
        except:
            # This might not be implemented or works differently
            pass

        return result

    async def test_search(self) -> TestResult:
        """Test search-related endpoints."""
        result = TestResult("Search")

        # Test basic search functionality
        search_query = "test"
        success, data, status, time_taken = self.client.get(f"/search?query={search_query}")
        result.add_result("Basic search", success, f"Status: {status}", time_taken)

        # Test entity-specific search if supported
        for entity in ["users", "events", "processes", "posts"]:
            try:
                success, data, status, time_taken = self.client.get(f"/search/{entity}?query={search_query}")
                result.add_result(f"Search {entity}", success, f"Status: {status}", time_taken)
            except:
                # This might not be implemented
                pass

        return result

    async def test_notifications(self) -> TestResult:
        """Test notification-related endpoints."""
        result = TestResult("Notifications")

        # Test notification listing
        success, data, status, time_taken = self.client.get("/notifications")
        result.add_result("List notifications", success, f"Status: {status}", time_taken)

        # Test notification creation if applicable
        try:
            notification_data = dict(TEST_DATA["notification"])
            success, data, status, time_taken = self.client.post("/notifications", notification_data)
            result.add_result("Create notification", success, f"Status: {status}", time_taken)

            if success and data and "id" in data:
                notification_id = data["id"]

                # Test notification update
                update_data = {"read": True}
                success, data, status, time_taken = self.client.put(f"/notifications/{notification_id}", update_data)
                result.add_result("Update notification", success, f"Status: {status}", time_taken)

                # Test notification deletion if applicable
                success, data, status, time_taken = self.client.delete(f"/notifications/{notification_id}")
                result.add_result("Delete notification", success, f"Status: {status}", time_taken)
        except:
            # This might not be implemented or works differently
            pass

        # Test mark all as read endpoint if applicable
        try:
            success, data, status, time_taken = self.client.post("/notifications/read-all", {})
            result.add_result("Mark all notifications as read", success, f"Status: {status}", time_taken)
        except:
            # This might not be implemented
            pass

        return result

    async def test_calendar(self) -> TestResult:
        """Test calendar-related endpoints."""
        result = TestResult("Calendar")

        # Test calendar listing with date range
        params = {"start_date": "2023-01-01", "end_date": "2023-12-31"}
        success, data, status, time_taken = self.client.get("/calendar", params=params)
        result.add_result("Get calendar data", success, f"Status: {status}", time_taken)

        # Test additional calendar views if applicable
        for view in ["month", "week", "day"]:
            try:
                success, data, status, time_taken = self.client.get(f"/calendar/{view}", params=params)
                result.add_result(f"Get calendar {view} view", success, f"Status: {status}", time_taken)
            except:
                # This might not be implemented
                pass

        return result

    async def test_insights(self) -> TestResult:
        """Test insights-related endpoints."""
        result = TestResult("Insights")

        # Test main insights endpoint
        success, data, status, time_taken = self.client.get("/insights")
        result.add_result("Get insights data", success, f"Status: {status}", time_taken)

        # Test specific insight types if applicable
        for insight_type in ["performance", "activity", "progress"]:
            try:
                success, data, status, time_taken = self.client.get(f"/insights/{insight_type}")
                result.add_result(f"Get {insight_type} insights", success, f"Status: {status}", time_taken)
            except:
                # This might not be implemented
                pass

        return result

    async def test_feed(self) -> TestResult:
        """Test feed-related endpoints."""
        result = TestResult("Feed")

        # Test main feed endpoint
        success, data, status, time_taken = self.client.get("/feed")
        result.add_result("Get feed data", success, f"Status: {status}", time_taken)

        # Test feed filtering if applicable
        for filter_type in ["user", "team", "all"]:
            try:
                success, data, status, time_taken = self.client.get(f"/feed?filter={filter_type}")
                result.add_result(f"Get {filter_type} feed", success, f"Status: {status}", time_taken)
            except:
                # This might not be implemented
                pass

        return result

    async def test_settings(self) -> TestResult:
        """Test settings-related endpoints."""
        result = TestResult("Settings")

        # Test settings retrieval
        success, data, status, time_taken = self.client.get("/settings")
        result.add_result("Get settings", success, f"Status: {status}", time_taken)

        # Test specific settings categories if applicable
        for category in ["profile", "notifications", "security"]:
            try:
                success, data, status, time_taken = self.client.get(f"/settings/{category}")
                result.add_result(f"Get {category} settings", success, f"Status: {status}", time_taken)
            except:
                # This might not be implemented
                pass

        # Test settings update if applicable
        try:
            settings_data = {"theme": "dark"}
            success, data, status, time_taken = self.client.put("/settings", settings_data)
            result.add_result("Update settings", success, f"Status: {status}", time_taken)
        except:
            # This might not be implemented
            pass

        return result


async def main():
    """Main entry point."""
    test_suite = ApiTestSuite()
    success = await test_suite.run_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
