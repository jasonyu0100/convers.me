"""Feed schemas for the API."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import Field

from api.schemas.base import APIBaseModel
from api.schemas.events import SchemaEventOut
from api.schemas.posts import SchemaPostOut
from api.schemas.processes import SchemaProcessOut
from api.schemas.users import SchemaUserOut


class SchemaFeedItemType(str, Enum):
    """Types of items that can appear in a feed."""

    POST = "post"
    EVENT = "event"
    PROCESS = "process"
    ACTIVITY = "activity"


class SchemaFeedItem(APIBaseModel):
    """Base schema for a feed item."""

    id: str
    type: SchemaFeedItemType
    createdAt: datetime = Field()
    author: SchemaUserOut
    feedMetadata: Optional[Dict[str, Any]] = Field(default=None)
    authorId: Optional[str] = Field(default=None)


class SchemaPostFeedItem(SchemaFeedItem):
    """Schema for a post feed item."""

    type: SchemaFeedItemType = SchemaFeedItemType.POST
    post: SchemaPostOut


class SchemaEventFeedItem(SchemaFeedItem):
    """Schema for an event feed item."""

    type: SchemaFeedItemType = SchemaFeedItemType.EVENT
    event: SchemaEventOut


class SchemaProcessFeedItem(SchemaFeedItem):
    """Schema for a process feed item."""

    type: SchemaFeedItemType = SchemaFeedItemType.PROCESS
    process: SchemaProcessOut


class SchemaActivityFeedItem(SchemaFeedItem):
    """Schema for an activity feed item."""

    type: SchemaFeedItemType = SchemaFeedItemType.ACTIVITY
    activityType: str = Field()
    description: str
    targetId: Optional[str] = Field(default=None)
    targetType: Optional[str] = Field(default=None)


SchemaFeedItemUnion = Union[SchemaPostFeedItem, SchemaEventFeedItem, SchemaProcessFeedItem, SchemaActivityFeedItem]


class SchemaFeedResponse(APIBaseModel):
    """Schema for a feed response."""

    items: List[SchemaFeedItemUnion] = Field(default_factory=list)
    hasMore: bool = Field(default=False)
    nextCursor: Optional[str] = Field(default=None)
