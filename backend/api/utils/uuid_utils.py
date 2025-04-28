"""Utility functions for handling UUIDs."""

from typing import Any
from uuid import UUID


def ensure_uuid_as_string(data: Any) -> Any:
    """
    Recursively traverse data structures and convert all UUIDs to strings.
    Supports dictionaries, lists, and nested combinations of these types.

    Args:
        data: The data structure to process

    Returns:
        The processed data structure with UUIDs converted to strings
    """
    # Handle None
    if data is None:
        return None

    # Handle UUID objects directly
    if isinstance(data, UUID):
        return str(data)

    # Handle dictionaries (including model dictionaries)
    if isinstance(data, dict):
        return {key: ensure_uuid_as_string(value) for key, value in data.items()}

    # Handle lists/tuples
    if isinstance(data, (list, tuple)):
        return [ensure_uuid_as_string(item) for item in data]

    # Handle UUID object representation from SQLAlchemy
    if isinstance(data, object) and hasattr(data, "__class__") and getattr(data, "__class__", None) == "UUID":
        if hasattr(data, "hex"):
            return getattr(data, "hex")
        return str(data)

    # Return unchanged for other types
    return data
