"""Post schemas for the API."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field

from api.schemas.base import APIBaseModel
from db.models import MediaTypeEnum


class SchemaPostBase(APIBaseModel):
    """Base post model."""

    content: str
    visibility: Optional[str] = "public"  # 'public', 'private', 'team'


class SchemaPostCreate(SchemaPostBase):
    """Post creation model."""

    eventId: Optional[str] = Field(default=None)


class SchemaPostUpdate(APIBaseModel):
    """Post update model."""

    content: Optional[str] = None
    visibility: Optional[str] = None


class SchemaPostOut(SchemaPostBase):
    """Post output model."""

    id: str
    createdAt: datetime = Field()
    updatedAt: Optional[datetime] = Field(default=None)
    authorId: str = Field()
    eventId: Optional[str] = Field(default=None)
    author: Optional[Dict[str, Any]] = None
    media: Optional[List[Dict[str, Any]]] = None


class SchemaMediaBase(APIBaseModel):
    """Base media model."""

    type: MediaTypeEnum
    title: Optional[str] = None
    url: str
    duration: Optional[str] = None
    aspectRatio: Optional[str] = Field(default=None)
    fileSize: Optional[int] = Field(default=None)
    mimeType: Optional[str] = Field(default=None)
    thumbnailUrl: Optional[str] = Field(default=None)
    mediaMetadata: Optional[Dict[str, Any]] = Field(default=None)


class SchemaMediaCreate(SchemaMediaBase):
    """Media creation model."""

    postId: Optional[str] = Field(default=None)
    eventId: Optional[str] = Field(default=None)


class SchemaMediaUpdate(APIBaseModel):
    """Media update model."""

    title: Optional[str] = None
    url: Optional[str] = None
    duration: Optional[str] = None
    aspectRatio: Optional[str] = Field(default=None)
    fileSize: Optional[int] = Field(default=None)
    mimeType: Optional[str] = Field(default=None)
    thumbnailUrl: Optional[str] = Field(default=None)
    mediaMetadata: Optional[Dict[str, Any]] = Field(default=None)


class SchemaMediaOut(SchemaMediaBase):
    """Media output model."""

    id: str
    createdAt: datetime = Field()
    updatedAt: Optional[datetime] = Field(default=None)
    postId: Optional[str] = Field(default=None)
    eventId: Optional[str] = Field(default=None)
    createdById: Optional[str] = Field(default=None)
