"""Base models and utilities for all schemas."""

from typing import Any, Dict, List, Type, TypeVar, Union
from uuid import UUID

from pydantic import BaseModel, field_serializer, model_validator
from pydantic.config import ConfigDict

# NOTE: To avoid circular imports, api.utils.api_utils functions are
# imported within methods rather than at module level

T = TypeVar("T", bound="APIBaseModel")


class APIBaseModel(BaseModel):
    """
    Base model with common serialization logic for all models.

    This model provides:
    1. UUID serialization to string
    2. Default configuration for ORM mode and alias generation
    3. Common validation and conversion methods
    4. Automatic camelCase conversion for responses
    """

    @field_serializer("*")
    def serialize_fields(self, value: Any, _info) -> Any:
        """Serialize special fields like UUID to appropriate values."""
        if isinstance(value, UUID):
            return str(value)
        if hasattr(value, "to_dict") and callable(getattr(value, "to_dict")):
            return value.to_dict()
        # Convert SQLAlchemy MetaData to dict
        if value is not None and str(type(value).__name__) == "MetaData":
            return {}
        # Handle UUID objects in lists
        if isinstance(value, list):
            return [str(item) if isinstance(item, UUID) else item for item in value]
        # Handle None values for dictionaries
        if value is None and _info.field_name in (
            "userMetadata",
            "notificationMetadata",
            "eventMetadata",
            "processMetadata",
            "mediaMetadata",
            "directoryMetadata",
            "insightMetadata",
            "reportMetadata",
            "feedMetadata",
            "calendarMetadata",
            "topicMetadata",
            "additionalSettings",
            "metadata",
        ):
            return {}
        return value

    @model_validator(mode="after")
    def metadata_to_dict(self) -> "APIBaseModel":
        """Convert metadata fields from SQLAlchemy MetaData objects to dictionaries and handle UUIDs."""
        # Standard metadata field names in camelCase
        metadata_fields = [
            "metadata",  # Generic metadata field
            "userMetadata",  # User-specific metadata
            "notificationMetadata",  # Notification-specific metadata
            "eventMetadata",  # Event-specific metadata
            "processMetadata",  # Process-specific metadata
            "mediaMetadata",  # Media-specific metadata
            "directoryMetadata",  # Directory-specific metadata
            "insightMetadata",  # Insight-specific metadata
            "reportMetadata",  # Report-specific metadata
            "feedMetadata",  # Feed-specific metadata
            "calendarMetadata",  # Calendar-specific metadata
            "topicMetadata",  # Topic-specific metadata
            "additionalSettings",  # Settings data
        ]

        # Common ID fields that should be strings
        id_fields = [
            "id", "userId", "createdById", "directoryId", "senderId",
            "referenceId", "eventId", "processId", "stepId", "parentId",
            "templateId", "roomId", "topicId", "postId", "mediaId"
        ]

        # Ensure all metadata fields are dictionaries
        for field in metadata_fields:
            if hasattr(self, field):
                value = getattr(self, field)
                # Convert to dict if it's not already one or is None
                if value is None or not isinstance(value, dict):
                    # Special handling for SQLAlchemy MetaData objects
                    if value is not None and str(type(value).__name__) == "MetaData":
                        setattr(self, field, {})
                    # Handle dict representation of MetaData
                    elif isinstance(value, dict) and value.get("__class__") == "MetaData":
                        setattr(self, field, {})
                    else:
                        setattr(self, field, {})

        # Ensure all ID fields are proper strings
        for field in id_fields:
            if hasattr(self, field):
                value = getattr(self, field)
                if value is not None:
                    # Direct UUID instance
                    if isinstance(value, UUID):
                        setattr(self, field, str(value))
                    # Dictionary representation of UUID
                    elif isinstance(value, dict) and value.get("__class__") == "UUID" and "hex" in value:
                        setattr(self, field, str(value.get("hex", "")))
                    # Already a string, but make sure it's not "None" or "undefined"
                    elif isinstance(value, str) and value.lower() in ["none", "undefined", "null"]:
                        setattr(self, field, None)

        # Ensure all UUID fields are converted to strings
        for field_name, field_value in self.__dict__.items():
            # Convert direct UUID fields
            if isinstance(field_value, UUID):
                setattr(self, field_name, str(field_value))
            # Handle UUID dict representation
            elif isinstance(field_value, dict) and field_value.get("__class__") == "UUID" and "hex" in field_value:
                setattr(self, field_name, str(field_value.get("hex", "")))
            # Handle UUID objects in lists
            elif isinstance(field_value, list):
                # Convert any UUIDs in the list to strings
                new_list = []
                for item in field_value:
                    if isinstance(item, UUID):
                        new_list.append(str(item))
                    elif isinstance(item, dict):
                        # Handle UUID dict representation in list
                        if item.get("__class__") == "UUID" and "hex" in item:
                            new_list.append(str(item.get("hex", "")))
                        else:
                            # Process nested dictionaries recursively
                            processed_item = {}
                            for k, v in item.items():
                                if isinstance(v, UUID):
                                    processed_item[k] = str(v)
                                elif isinstance(v, dict) and v.get("__class__") == "UUID" and "hex" in v:
                                    processed_item[k] = str(v.get("hex", ""))
                                else:
                                    processed_item[k] = v
                            new_list.append(processed_item)
                    else:
                        new_list.append(item)
                setattr(self, field_name, new_list)
            # Handle UUID objects in dictionaries
            elif isinstance(field_value, dict):
                # Process each key-value pair in the dictionary
                for k, v in field_value.items():
                    if isinstance(v, UUID):
                        field_value[k] = str(v)
                    elif isinstance(v, dict) and v.get("__class__") == "UUID" and "hex" in v:
                        field_value[k] = str(v.get("hex", ""))

        return self

    @classmethod
    def from_orm_obj(cls: Type[T], obj: Any) -> T:
        """
        Convert an ORM object to this schema model with proper camelCase conversion.

        Args:
            obj: SQLAlchemy model or dictionary

        Returns:
            Instance of this model with camelCase field names
        """
        # Import here to avoid circular imports
        from api.utils.api_utils import process_api_json

        # First convert the ORM object to a dict with camelCase keys
        processed_data = process_api_json(obj)
        # Then create an instance of this model from the processed data
        return cls.model_validate(processed_data)

    @classmethod
    def process_response(cls, data: Union[Any, List[Any]]) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Process data for API response, ensuring proper camelCase conversion.
        Use this instead of importing process_api_json directly in route handlers.

        Args:
            data: Data to process (ORM object, dict, or list)

        Returns:
            Processed data with camelCase keys
        """
        # Import here to avoid circular imports
        from api.utils.api_utils import process_api_json

        return process_api_json(data)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
