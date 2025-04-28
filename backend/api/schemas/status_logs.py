"""Status log schemas for the API."""

from datetime import datetime
from typing import List, Optional

from api.schemas.base import APIBaseModel
from api.schemas.users import SchemaUserOut
from db.models import EventStatusEnum


class SchemaStatusLogBase(APIBaseModel):
    """Base status log model."""

    previousStatus: Optional[EventStatusEnum] = None
    newStatus: EventStatusEnum
    eventId: str


class SchemaStatusLogCreate(SchemaStatusLogBase):
    """Status log creation model."""

    userId: Optional[str] = None


class SchemaStatusLogUpdate(APIBaseModel):
    """Status log update model."""

    newStatus: Optional[EventStatusEnum] = None


class SchemaStatusLogOut(SchemaStatusLogBase):
    """Status log output model."""

    id: str
    userId: Optional[str] = None
    user: Optional[SchemaUserOut] = None
    createdAt: datetime
    updatedAt: Optional[datetime] = None


class SchemaStatusLogListResponse(APIBaseModel):
    """Response model for status log listing."""

    items: List[SchemaStatusLogOut]
    total: int
