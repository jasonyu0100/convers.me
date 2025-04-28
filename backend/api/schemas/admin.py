"""Admin schemas for the API."""

from typing import List, Optional

from pydantic import Field

from api.schemas.base import APIBaseModel


class UserCreateAdmin(APIBaseModel):
    """Admin user creation model."""

    name: str = Field(..., description="Full name of the user")
    handle: str = Field(..., description="Unique username for the user", min_length=3, max_length=30)
    email: str = Field(..., description="Email address of the user")
    password: str = Field(..., description="Password for the user account", min_length=8)
    profileImage: Optional[str] = Field(default=None, description="URL to the user's profile image")
    bio: Optional[str] = Field(default=None, description="User's biography or description")
    isAdmin: bool = Field(default=False, description="Whether the user has admin privileges")


class UserUpdateAdmin(APIBaseModel):
    """Admin user update model."""

    name: Optional[str] = Field(default=None, description="Full name of the user")
    handle: Optional[str] = Field(default=None, description="Unique username for the user", min_length=3, max_length=30)
    email: Optional[str] = Field(default=None, description="Email address of the user")
    profileImage: Optional[str] = Field(default=None, description="URL to the user's profile image")
    bio: Optional[str] = Field(default=None, description="User's biography or description")
    isAdmin: Optional[bool] = Field(default=None, description="Whether the user has admin privileges")


class UserResponseAdmin(APIBaseModel):
    """Admin user response model."""

    id: str = Field(..., description="Unique identifier for the user")
    name: str = Field(..., description="Full name of the user")
    handle: str = Field(..., description="Unique username for the user")
    email: str = Field(..., description="Email address of the user")
    profileImage: Optional[str] = Field(default=None, description="URL to the user's profile image")
    bio: Optional[str] = Field(default=None, description="User's biography or description")
    isAdmin: bool = Field(default=False, description="Whether the user has admin privileges")
    createdAt: str = Field(..., description="Timestamp when the user was created")
    updatedAt: Optional[str] = Field(default=None, description="Timestamp when the user was last updated")


class DatabaseInitResponse(APIBaseModel):
    """Database initialization response."""

    success: bool = Field(..., description="Whether the initialization was successful")
    actions: List[str] = Field(default_factory=list, description="List of actions performed during initialization")
    errors: List[str] = Field(default_factory=list, description="List of errors encountered during initialization")
    message: Optional[str] = Field(default=None, description="Optional message providing additional information")


class DatabaseResetResponse(APIBaseModel):
    """Database reset response."""

    status: str = Field(..., description="Status message of the reset operation")
    tables_cleared: List[str] = Field(..., description="List of database tables that were cleared")
    tables_found: List[str] = Field(..., description="List of all database tables that were found")
