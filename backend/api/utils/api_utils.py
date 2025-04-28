"""Utility functions for API data processing."""

from datetime import datetime
from typing import Any, Dict, List, TypeVar, Union
from uuid import UUID

from pydantic import BaseModel

# Import the centralized UUID handling utility
from api.utils.uuid_utils import ensure_uuid_as_string

T = TypeVar("T", bound=BaseModel)


def convert_to_dict(obj: Any) -> Dict[str, Any]:
    """
    Convert SQLAlchemy model instances to dictionaries, properly handling UUID fields.
    This is needed because Pydantic v2 requires explicit string conversion for UUID fields.
    """
    # If the object has a to_dict method, use it
    if hasattr(obj, "to_dict"):
        return obj.to_dict()

    # If the object is already a dict, just return it
    if isinstance(obj, dict):
        return obj

    # Otherwise, create a dictionary manually
    result = {}
    for key, value in obj.__dict__.items():
        # Skip private attributes
        if key.startswith("_"):
            continue

        # Convert UUIDs to strings
        if isinstance(value, UUID):
            result[key] = str(value)
        # Handle metadata fields to ensure they're dictionaries
        elif key.endswith("_metadata") and value is not None:
            if isinstance(value, dict):
                result[key] = value
            else:
                result[key] = {}
        # Handle nested objects
        elif hasattr(value, "__dict__") and not isinstance(value, (str, int, float, bool, dict, list)):
            result[key] = convert_to_dict(value)
        # Handle lists of objects
        elif isinstance(value, list):
            result[key] = [convert_to_dict(item) if hasattr(item, "__dict__") else item for item in value]
        # Handle dates - convert to ISO format string
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        # Everything else
        else:
            result[key] = value

    return result


def add_camel_case_fields(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Add camelCase versions of snake_case fields to ensure compatibility with frontend.
    Automatically converts any snake_case key to camelCase format.

    Args:
        data: Dictionary with snake_case keys

    Returns:
        Dictionary with both snake_case and camelCase keys
    """
    # Create a copy of the dict to avoid modifying during iteration
    result = data.copy()

    # Ensure date fields are strings
    date_fields = ["created_at", "updated_at", "last_updated", "date"]
    for field in date_fields:
        if field in result and isinstance(result[field], datetime):
            result[field] = result[field].isoformat()

    camel_date_fields = ["createdAt", "updatedAt", "lastUpdated"]
    for field in camel_date_fields:
        if field in result and isinstance(result[field], datetime):
            result[field] = result[field].isoformat()

    # Special case: ensure snake_case fields exist that Pydantic models need
    required_snake_case = [
        "user_id",
        "created_at",
        "updated_at",
        "created_by_id",
        "directory_id",
        "sender_id",
        "reference_id",
        "reference_type",
        "last_updated",
        "process_metadata",
        "notification_metadata",
        "event_metadata",
        "media_metadata",
        "step_id",
    ]

    # First ensure we have the snake_case versions that Pydantic needs
    for field in required_snake_case:
        camel_field = convert_snake_to_camel(field)
        # If we have the camelCase but not the snake_case, add the snake_case
        if camel_field in data and field not in data:
            result[field] = data[camel_field]

    # Any field ending with _metadata will be mapped to 'metadata'
    # This is more flexible than hardcoding specific metadata fields

    # Process each key in the input dictionary
    for key in data.keys():
        # Skip keys that don't contain underscores (already camelCase or single words)
        if "_" not in key:
            continue

        # Handle metadata fields (any field ending with _metadata)
        if key.endswith("_metadata"):
            # Add both the generic 'metadata' field and the camelCase version
            result["metadata"] = data[key]

            # Also add the camelCase version of the original field
            # (e.g., process_metadata → processMetadata)
            camel_key = convert_snake_to_camel(key)
            if camel_key != key:
                result[camel_key] = data[key]
            continue

        # Convert snake_case to camelCase
        camel_key = convert_snake_to_camel(key)

        # Only add if the camelCase key is different from the original
        if camel_key != key:
            result[camel_key] = data[key]

    return result


def convert_snake_to_camel(snake_str: str) -> str:
    """
    Convert a snake_case string to camelCase.

    Args:
        snake_str: String in snake_case format

    Returns:
        String in camelCase format
    """
    # Split the string by underscore
    components = snake_str.split("_")

    # Capitalize all except the first one and join them
    return components[0] + "".join(x.title() for x in components[1:])


def process_api_json(data: Any) -> Any:
    """
    Process database results to ensure proper field naming and type conversion.
    Handles various data types including model objects, dictionaries, and lists.

    This function performs these main operations:
    1. Converts SQLAlchemy model objects to dictionaries
    2. Ensures all UUIDs are properly converted to strings
    3. Converts snake_case fields to camelCase format
    4. Handles proper metadata conversion

    Args:
        data: Any data type from DB responses including model objects, dictionaries, and lists

    Returns:
        Processed data with proper field naming and type conversion
    """
    # Handle None values
    if data is None:
        return None

    # Handle list data - process each item individually
    if isinstance(data, list):
        return [process_api_json(item) for item in data]

    # Handle UUID objects directly
    if isinstance(data, UUID):
        return str(data)

    # Handle primitive types
    if isinstance(data, (str, int, float, bool)):
        return data

    # Handle datetime objects directly
    if isinstance(data, datetime):
        return data.isoformat()

    # First ensure the data is a dictionary (converts SQLAlchemy models)
    if isinstance(data, dict):
        result_dict = data
    else:
        result_dict = convert_to_dict(data)

    # Then ensure all UUIDs are strings using the centralized utility
    uuid_safe_dict = ensure_uuid_as_string(result_dict)

    # Then ensure we have camelCase versions
    return to_camel_case(uuid_safe_dict)


def to_camel_case(data: Union[Dict[str, Any], List[Dict[str, Any]], Any]) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Convert all dictionary keys from snake_case to camelCase.
    Handles nested dictionaries and lists of dictionaries recursively.

    Args:
        data: Dictionary, list of dictionaries, or other data

    Returns:
        Data with all keys converted to camelCase
    """
    # Handle None
    if data is None:
        return None

    # Handle lists - recursively process each item
    if isinstance(data, list):
        return [to_camel_case(item) for item in data]

    # If not a dictionary, return as is
    if not isinstance(data, dict):
        return data

    # Process dictionary
    result = {}
    for key, value in data.items():
        # Convert key to camelCase
        camel_key = convert_snake_to_camel(key)

        # Process value recursively if it's a dict or list
        if isinstance(value, dict):
            result[camel_key] = to_camel_case(value)
        elif isinstance(value, list):
            result[camel_key] = to_camel_case(value)
        else:
            result[camel_key] = value

    return result


def check_router_health(router_name: str) -> Dict[str, Any]:
    """
    Check the health of a router.

    Args:
        router_name: Name of the router being checked

    Returns:
        Dictionary with health status information
    """
    return {"status": "healthy", "router": router_name, "timestamp": datetime.utcnow().isoformat()}


def create_model_validator(uuid_fields: List[str]):
    """
    Create a model_validate class method for Pydantic models to handle UUID conversions.

    Args:
        uuid_fields: List of field names that should be converted from UUID to string

    Returns:
        A model_validate method to be used as a classmethod in Pydantic models
    """

    def model_validate(cls, obj, *args, **kwargs):
        """Override validate to ensure UUIDs are converted to strings."""
        if isinstance(obj, dict):
            obj = obj.copy()
            for field in uuid_fields:
                if field in obj and obj[field] is not None and not isinstance(obj[field], str):
                    obj[field] = str(obj[field])
        return super(cls, cls).model_validate(obj, *args, **kwargs)

    return model_validate
