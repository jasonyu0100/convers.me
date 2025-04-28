"""Authentication schemas for the API."""

from typing import Optional

from pydantic import Field

from api.schemas.base import APIBaseModel


class SchemaToken(APIBaseModel):
    """Token model for authentication."""

    accessToken: str = Field()
    tokenType: str = Field()


class SchemaTokenData(APIBaseModel):
    """Token data model."""

    username: Optional[str] = None


class SchemaGuestLogin(APIBaseModel):
    """Guest login request model."""

    role: str = Field(
        ...,
        description="Role for the guest account",
        pattern="^(dev|pm|designer|ops|intern|leadership)$",
    )


class SchemaGuestLoginResponse(APIBaseModel):
    """Guest login response model."""

    accessToken: str = Field()
    tokenType: str = Field()
    email: str
    password: str
    name: str
    handle: str
    profileImage: Optional[str] = None
