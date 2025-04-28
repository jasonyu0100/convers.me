#!/usr/bin/env python3
"""
Run tests for a specific router or all routers.
This script allows running tests for a specific router or all routers.
"""

import argparse
import asyncio
import importlib
import sys

# Available routers that can be tested
AVAILABLE_ROUTERS = [
    "auth",
    "users",
    "processes",
    "templates",
    "directories",
    "events",
    "topics",
    "posts",
    "media",
    "notifications",
    "search",
    "calendar",
    "feed",
    "insights",
    "settings",
    "admin",
]


def get_router_test_module(router: str) -> str:
    """Get the test module name for a router."""
    return f"test_router_{router}"


def list_available_routers():
    """List available routers for testing."""
    print("Available routers:")
    for router in AVAILABLE_ROUTERS:
        print(f"  - {router}")


async def run_router_test(router: str):
    """Run tests for a specific router."""
    module_name = get_router_test_module(router)

    try:
        # Try to import the test module
        test_module = importlib.import_module(module_name)

        # Run the tests
        if hasattr(test_module, "main"):
            await test_module.main()
        else:
            print(f"Error: Module {module_name} does not have a main function")
            return False

        return True
    except ImportError:
        print(f"Error: Test module {module_name} not found")
        return False
    except Exception as e:
        print(f"Error running tests for router {router}: {str(e)}")
        return False


async def run_all_router_tests():
    """Run tests for all routers."""
    results = []

    for router in AVAILABLE_ROUTERS:
        print(f"\n{'='*50}")
        print(f"Testing router: {router}")
        print(f"{'='*50}")

        success = await run_router_test(router)
        results.append((router, success))

    # Print summary
    print(f"\n{'='*50}")
    print("ROUTER TEST SUMMARY")
    print(f"{'='*50}")

    passed = 0
    for router, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{router:.<30} {status}")
        if success:
            passed += 1

    print(f"\nPassed: {passed}/{len(results)} router tests")

    return passed == len(results)


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Run tests for specific routers")
    parser.add_argument("-r", "--router", help="Router to test")
    parser.add_argument("-a", "--all", action="store_true", help="Test all routers")
    parser.add_argument("-l", "--list", action="store_true", help="List available routers")
    args = parser.parse_args()

    if args.list:
        list_available_routers()
        return

    if args.router:
        if args.router not in AVAILABLE_ROUTERS:
            print(f"Error: Router '{args.router}' not available")
            list_available_routers()
            sys.exit(1)

        success = await run_router_test(args.router)
        sys.exit(0 if success else 1)
    elif args.all:
        success = await run_all_router_tests()
        sys.exit(0 if success else 1)
    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
