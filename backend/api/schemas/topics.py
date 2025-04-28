"""Topic schemas for the API."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field

from api.schemas.base import APIBaseModel


class SchemaTopicBase(APIBaseModel):
    """Base topic model."""

    name: str
    category: Optional[str] = None
    color: Optional[str] = None
    topicMetadata: Optional[Dict[str, Any]] = Field(default=None)


class SchemaTopicCreate(SchemaTopicBase):
    """Topic creation model."""


class SchemaTopicUpdate(APIBaseModel):
    """Topic update model."""

    name: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    topicMetadata: Optional[Dict[str, Any]] = Field(default=None)


class SchemaTopicOut(SchemaTopicBase):
    """Topic output model."""

    id: str
    createdAt: datetime = Field()
    updatedAt: Optional[datetime] = Field(default=None)


class SchemaTopicWithSelection(SchemaTopicOut):
    """Topic output model with selection state for UI."""

    isSelected: bool = False


class SchemaTopicCategory(APIBaseModel):
    """Group of topics by category."""

    category: str
    topics: List[SchemaTopicOut]


class SchemaTopicStats(APIBaseModel):
    """Statistics about topics."""

    totalCount: int = Field()
    categories: Dict[str, int]  # Counts by category
    mostUsed: List[SchemaTopicOut] = Field(default=[])
