"""Media schemas for the API."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import Field

from api.schemas.base import APIBaseModel


class SchemaMediaType(str, Enum):
    """Types of media."""

    VIDEO = "video"
    IMAGE = "image"
    AUDIO = "audio"
    QUOTE = "quote"
    EVENT = "event"


class SchemaMediaBase(APIBaseModel):
    """Base schema for media."""

    type: SchemaMediaType
    title: Optional[str] = None
    url: str
    duration: Optional[str] = None
    aspectRatio: Optional[str] = Field(default=None)
    fileSize: Optional[int] = Field(default=None)
    mimeType: Optional[str] = Field(default=None)
    thumbnailUrl: Optional[str] = Field(default=None)
    mediaMetadata: Optional[Dict[str, Any]] = Field(default=None)


class SchemaMediaCreate(SchemaMediaBase):
    """Schema for creating media."""

    postId: Optional[str] = Field(default=None)
    eventId: Optional[str] = Field(default=None)


class SchemaMediaOut(SchemaMediaBase):
    """Schema for media output."""

    id: str
    createdById: Optional[str] = Field(default=None)
    postId: Optional[str] = Field(default=None)
    eventId: Optional[str] = Field(default=None)
    createdAt: datetime = Field()
    updatedAt: Optional[datetime] = Field(default=None)


class SchemaMediaUploadResponse(APIBaseModel):
    """Schema for media upload response."""

    id: str
    url: str
    type: str
    title: Optional[str] = None
    mimeType: Optional[str] = Field(default=None)
    fileSize: Optional[int] = Field(default=None)
