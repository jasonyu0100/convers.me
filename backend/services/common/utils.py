"""
Utility functions for service layer.
"""

import uuid
from datetime import datetime
from typing import Any, Dict


def generate_id() -> str:
    """
    Generate a unique ID using UUID4.

    Returns:
        str: A unique ID string
    """
    return str(uuid.uuid4())


def current_timestamp() -> str:
    """
    Get the current timestamp in ISO format.

    Returns:
        str: Current timestamp in ISO format
    """
    return datetime.utcnow().isoformat()


def safe_get(obj: Dict[str, Any], *keys: str, default: Any = None) -> Any:
    """
    Safely get a nested key from a dictionary.

    Args:
        obj: The dictionary to get from
        keys: The nested keys to follow
        default: Default value if key doesn't exist

    Returns:
        The value at the nested key path, or the default
    """
    current = obj
    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return default
    return current


def merge_dicts(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deeply merge two dictionaries.

    Args:
        dict1: First dictionary
        dict2: Second dictionary (overrides values from dict1)

    Returns:
        A new dictionary with merged values
    """
    result = dict1.copy()
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = merge_dicts(result[key], value)
        else:
            result[key] = value
    return result
