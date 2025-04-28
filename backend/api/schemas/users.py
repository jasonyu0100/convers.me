"""User schemas for the API."""

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import EmailStr, Field
from pydantic.config import ConfigDict

from api.schemas.base import APIBaseModel


class SchemaUserBase(APIBaseModel):
    """Base user model."""

    email: EmailStr
    name: str
    handle: str


class SchemaUserCreate(SchemaUserBase):
    """User creation model."""

    password: str
    bio: Optional[str] = None
    profileImage: Optional[str] = Field(default=None)
    isGuest: Optional[bool] = Field(default=False)
    # For guest account role: dev, pm, designer, etc.
    guestRole: Optional[str] = Field(default=None)


class SchemaUserUpdate(APIBaseModel):
    """User update model."""

    name: Optional[str] = None
    email: Optional[EmailStr] = None
    handle: Optional[str] = None
    bio: Optional[str] = None
    profileImage: Optional[str] = Field(default=None)
    password: Optional[str] = None


class SchemaUserOut(SchemaUserBase):
    """User output model for API responses."""

    id: str  # Accepts UUID or string
    profileImage: Optional[str] = Field(default=None)
    bio: Optional[str] = None
    createdAt: Optional[datetime] = Field(default=None)
    updatedAt: Optional[datetime] = Field(default=None)
    userMetadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    isGuest: Optional[bool] = Field(default=False)
    guestRole: Optional[str] = Field(default=None)
    isAdmin: Optional[bool] = Field(default=False)

    # Custom model config to ensure validation works correctly
    model_config = ConfigDict(
        from_attributes=True,  # Allow validation from ORM model attributes
        populate_by_name=True  # Allow both alias and original field names
    )

    @classmethod
    def from_orm(cls, obj):
        """
        Utility method to create a schema instance from an ORM model.
        Uses to_dict() method if available to ensure proper UUID and metadata conversion.
        """
        if hasattr(obj, "to_dict") and callable(getattr(obj, "to_dict")):
            # Use to_dict() method which handles UUID and MetaData conversion
            return cls.model_validate(obj.to_dict())
        else:
            # Fall back to standard Pydantic validation
            return cls.model_validate(obj)


class SchemaUserWithOnlineStatus(SchemaUserOut):
    """User with online status for UI."""

    isOnline: bool = Field(default=False)

    model_config = ConfigDict(from_attributes=True)


class SchemaUserPreferencesBase(APIBaseModel):
    """Base user preferences model."""

    theme: Optional[str] = "system"  # 'light', 'dark', 'system'
    emailNotifications: Optional[bool] = Field(default=True)
    timeZone: Optional[str] = Field(default="UTC")
    language: Optional[str] = "en"
    additionalSettings: Optional[Dict[str, Any]] = Field(default_factory=dict)


class SchemaUserPreferencesUpdate(SchemaUserPreferencesBase):
    """User preferences update model."""


class SchemaUserPreferencesOut(SchemaUserPreferencesBase):
    """User preferences output model."""

    id: str
    userId: str = Field()
    createdAt: Optional[datetime] = Field(default=None)
    updatedAt: Optional[datetime] = Field(default=None)


class SchemaPasswordResetRequest(APIBaseModel):
    """Password reset request model."""

    email: EmailStr


class SchemaPasswordReset(APIBaseModel):
    """Password reset model."""

    token: str
    newPassword: str = Field()
