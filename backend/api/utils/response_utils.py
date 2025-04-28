"""
Utilities for formatting API responses.
These functions help ensure consistent response formatting across all endpoints.
"""

import logging
from typing import Any
from uuid import UUID

from api.utils.api_utils import ensure_uuid_as_string, process_api_json

logger = logging.getLogger(__name__)

def handle_metadata_objects(data: Any) -> Any:
    """
    Handle SQLAlchemy MetaData objects by converting them to empty dictionaries.
    Also handles UUID objects by converting them to strings.

    Args:
        data: Any data structure that may contain MetaData objects or UUIDs

    Returns:
        Data with MetaData objects converted to empty dictionaries and UUIDs to strings
    """
    # Handle None case
    if data is None:
        return None

    # Handle primitive types
    if isinstance(data, (str, int, float, bool)):
        return data

    # Handle UUID objects explicitly
    if isinstance(data, UUID):
        return str(data)

    # Handle lists
    if isinstance(data, list):
        return [handle_metadata_objects(item) for item in data]

    # Handle dictionaries
    if isinstance(data, dict):
        result = {}
        for key, value in data.items():
            # Check if value is a SQLAlchemy MetaData object by type name
            if value is not None and str(type(value).__name__) == "MetaData":
                result[key] = {}
            # Check if value is a UUID object by class dict representation
            elif isinstance(value, dict) and value.get("__class__") == "UUID" and "hex" in value:
                result[key] = str(value.get("hex", ""))
            # Check if value is a MetaData object by class dict representation
            elif isinstance(value, dict) and value.get("__class__") == "MetaData":
                result[key] = {}
            else:
                result[key] = handle_metadata_objects(value)
        return result

    # Handle SQLAlchemy model objects
    if hasattr(data, "__dict__"):
        # Check if object itself is a MetaData object
        if str(type(data).__name__) == "MetaData":
            return {}

        # Create a dictionary to return instead of modifying the object
        obj_dict = {}
        for key, value in data.__dict__.items():
            if key.startswith("_"):  # Skip private attributes
                continue

            if value is not None and str(type(value).__name__) == "MetaData":
                obj_dict[key] = {}
            elif isinstance(value, UUID):
                obj_dict[key] = str(value)
            else:
                obj_dict[key] = handle_metadata_objects(value)

        return obj_dict

    # Return processed or original data
    return data


def format_response(data: Any) -> Any:
    """
    Format data for API response.

    This function:
    1. Handles SQLAlchemy MetaData objects
    2. Ensures all UUIDs are converted to strings
    3. Converts snake_case to camelCase

    Args:
        data: The data to format

    Returns:
        The formatted data
    """
    try:
        # Special case for None
        if data is None:
            return None

        # First process the data in the most direct way to handle UUIDs and MetaData objects
        # Check if this is a direct UUID object
        if isinstance(data, UUID):
            return str(data)

        # Check for direct 'id' field which is likely a UUID
        if isinstance(data, dict) and 'id' in data and isinstance(data['id'], dict) and data['id'].get('__class__') == 'UUID':
            data['id'] = str(data['id'].get('hex', ''))

        # Check for metadata fields that need special handling
        if isinstance(data, dict) and 'metadata' in data and isinstance(data['metadata'], dict) and data['metadata'].get('__class__') == 'MetaData':
            data['metadata'] = {}

        # Then handle any MetaData objects recursively
        metadata_handled = handle_metadata_objects(data)

        # Then ensure all UUIDs are strings recursively
        stringified_data = ensure_uuid_as_string(metadata_handled)

        # Then convert to camelCase and handle any remaining model conversions
        result = process_api_json(stringified_data)

        # Final safety check for any remaining UUID or MetaData objects
        # This is a last resort check for problematic fields
        if isinstance(result, dict):
            for key in list(result.keys()):
                value = result[key]
                # Check for UUID dict representation
                if isinstance(value, dict) and value.get('__class__') == 'UUID' and 'hex' in value:
                    result[key] = str(value.get('hex', ''))
                # Check for MetaData dict representation
                if isinstance(value, dict) and value.get('__class__') == 'MetaData':
                    result[key] = {}

        return result
    except Exception as e:
        # Log the error with detailed information and traceback
        import traceback
        logger.error(f"Error formatting response: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        logger.error(f"Data type: {type(data)}")

        # If data is a dict or has __dict__, print keys to help debug
        if isinstance(data, dict):
            logger.error(f"Dict keys: {list(data.keys())}")
            # Look for problematic fields that might be causing issues
            for key, value in data.items():
                if isinstance(value, UUID) or (isinstance(value, dict) and value.get('__class__') == 'UUID'):
                    logger.error(f"Found UUID field '{key}': {value}")
                if isinstance(value, dict) and value.get('__class__') == 'MetaData':
                    logger.error(f"Found MetaData field '{key}'")
        elif hasattr(data, "__dict__"):
            logger.error(f"Object __dict__ keys: {list(data.__dict__.keys())}")

        # Try to fix the data directly in the error handler
        try:
            # For dictionaries we can attempt direct fixes
            if isinstance(data, dict):
                result = {}
                for key, value in data.items():
                    # Fix UUIDs
                    if isinstance(value, UUID):
                        result[key] = str(value)
                    # Fix UUID dict representation
                    elif isinstance(value, dict) and value.get('__class__') == 'UUID' and 'hex' in value:
                        result[key] = str(value.get('hex', ''))
                    # Fix MetaData dict representation
                    elif isinstance(value, dict) and value.get('__class__') == 'MetaData':
                        result[key] = {}
                    # Everything else
                    else:
                        result[key] = value
                logger.info("Successfully repaired data structure in error handler")
                return result
        except Exception as repair_error:
            logger.error(f"Error repairing data in error handler: {str(repair_error)}")

        # Return the original data if processing failed
        # This will bypass the middleware formatting but at least return something to the client
        return data
