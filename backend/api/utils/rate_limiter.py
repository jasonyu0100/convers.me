"""
Rate limiting utility for the API.

This module provides rate limiting functionality to protect API endpoints
from abuse and ensure fair resource allocation.
"""

import logging
import os
import time
from collections import defaultdict
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)

# Configuration
DEFAULT_RATE_LIMIT = 300  # requests per minute
DEFAULT_BURST_LIMIT = 60  # requests per 10 seconds
ADMIN_RATE_LIMIT = 500  # higher limit for admin users
IP_RATE_LIMIT = 500  # per-IP rate limit

# Check if we're in development mode and use higher limits
if os.environ.get("DEBUG", "False").lower() == "true":
    # In development mode, use higher limits but still restrictive enough to test
    DEFAULT_RATE_LIMIT = 600
    DEFAULT_BURST_LIMIT = 100
    ADMIN_RATE_LIMIT = 800
    IP_RATE_LIMIT = 800

# In-memory storage for request counts
# In production, consider using Redis or another distributed cache
class RateLimitStorage:
    """In-memory storage for rate limiting data."""

    def __init__(self):
        """Initialize the storage."""
        # Structure: {key: [(timestamp, count), ...]}
        self.storage: Dict[str, List[Tuple[float, int]]] = defaultdict(list)

    def add_request(self, key: str, timestamp: float) -> None:
        """Add a request to the storage."""
        self.storage[key].append((timestamp, 1))

    def clean_old_entries(self, key: str, window_seconds: int) -> None:
        """Remove entries older than the window."""
        if key not in self.storage:
            return

        now = time.time()
        cutoff = now - window_seconds
        self.storage[key] = [
            entry for entry in self.storage[key]
            if entry[0] >= cutoff
        ]

    def get_request_count(self, key: str, window_seconds: int) -> int:
        """Get the number of requests in the time window."""
        if key not in self.storage:
            return 0

        self.clean_old_entries(key, window_seconds)
        return sum(count for _, count in self.storage[key])


# Global storage instance
rate_limit_storage = RateLimitStorage()


async def check_rate_limit(
    request: str,
    ip: str,
    user_id: str = None,
    is_admin: bool = False,
) -> Tuple[bool, str, int]:
    """
    Check if a request should be rate limited.

    Args:
        request: The request path
        ip: Client IP address
        user_id: Optional user ID for authenticated requests
        is_admin: Whether the user is an admin

    Returns:
        Tuple of (is_allowed, reason, retry_after)
    """
    now = time.time()

    # Define limits based on user type
    minute_limit = ADMIN_RATE_LIMIT if is_admin else DEFAULT_RATE_LIMIT
    burst_limit = ADMIN_RATE_LIMIT // 5 if is_admin else DEFAULT_BURST_LIMIT

    # Check IP-based rate limiting (60 second window)
    ip_key = f"ip:{ip}"
    rate_limit_storage.clean_old_entries(ip_key, 60)
    ip_count = rate_limit_storage.get_request_count(ip_key, 60)

    if ip_count >= IP_RATE_LIMIT:
        retry_after = 60
        return False, "IP rate limit exceeded", retry_after

    # For authenticated users, also check user-based limits
    if user_id:
        # Check minute limit (60 second window)
        user_minute_key = f"user:{user_id}:minute"
        rate_limit_storage.clean_old_entries(user_minute_key, 60)
        minute_count = rate_limit_storage.get_request_count(user_minute_key, 60)

        if minute_count >= minute_limit:
            retry_after = 60
            return False, "Rate limit exceeded", retry_after

        # Check burst limit (10 second window)
        user_burst_key = f"user:{user_id}:burst"
        rate_limit_storage.clean_old_entries(user_burst_key, 10)
        burst_count = rate_limit_storage.get_request_count(user_burst_key, 10)

        if burst_count >= burst_limit:
            retry_after = 10
            return False, "Burst limit exceeded", retry_after

        # Record the request
        rate_limit_storage.add_request(user_minute_key, now)
        rate_limit_storage.add_request(user_burst_key, now)

    # Record the request for IP limiting
    rate_limit_storage.add_request(ip_key, now)

    # Not rate limited
    return True, "", 0


def get_rate_limit_headers(
    user_id: str = None,
    is_admin: bool = False,
    ip: str = None,
) -> Dict[str, str]:
    """
    Generate rate limit headers to include in responses.

    Args:
        user_id: Optional user ID for authenticated requests
        is_admin: Whether the user is an admin
        ip: Client IP address

    Returns:
        Dictionary of headers to add to the response
    """
    headers = {}

    # Define limits based on user type
    minute_limit = ADMIN_RATE_LIMIT if is_admin else DEFAULT_RATE_LIMIT
    ADMIN_RATE_LIMIT // 5 if is_admin else DEFAULT_BURST_LIMIT

    # Add standard rate limit headers
    headers["X-RateLimit-Limit"] = str(minute_limit)

    # Add remaining counts if we have user info
    if user_id:
        user_minute_key = f"user:{user_id}:minute"
        minute_count = rate_limit_storage.get_request_count(user_minute_key, 60)
        headers["X-RateLimit-Remaining"] = str(max(0, minute_limit - minute_count))

        # Add reset time (approximate)
        if minute_count > 0:
            oldest_timestamp = min(ts for ts, _ in rate_limit_storage.storage.get(user_minute_key, [(time.time(), 0)]))
            reset_time = int(oldest_timestamp + 60 - time.time())
            headers["X-RateLimit-Reset"] = str(max(0, reset_time))

    # Add IP rate limit info
    if ip:
        ip_key = f"ip:{ip}"
        ip_count = rate_limit_storage.get_request_count(ip_key, 60)
        headers["X-RateLimit-IP-Limit"] = str(IP_RATE_LIMIT)
        headers["X-RateLimit-IP-Remaining"] = str(max(0, IP_RATE_LIMIT - ip_count))

    return headers
