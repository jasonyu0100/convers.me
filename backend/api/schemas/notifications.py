"""Notification schemas for the API."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from api.schemas.base import APIBaseModel


class SchemaNotificationType(str, Enum):
    """Type of notification."""

    MENTION = "mention"
    COMMENT = "comment"
    EVENT_INVITE = "event_invite"
    EVENT_REMINDER = "event_reminder"
    EVENT_UPDATE = "event_update"
    NEW_MESSAGE = "message"
    SYSTEM = "system"
    TASK = "task"  # Added to align with frontend


class SchemaNotificationBase(APIBaseModel):
    """Base notification model."""

    type: SchemaNotificationType
    title: str
    message: str
    link: Optional[str] = None
    read: bool = False
    metadata: Optional[Dict[str, Any]] = None


class SchemaNotificationCreate(SchemaNotificationBase):
    """Notification creation model."""

    userId: str
    senderId: Optional[str] = None
    referenceId: Optional[str] = None
    referenceType: Optional[str] = None


class SchemaNotificationUpdate(APIBaseModel):
    """Notification update model."""

    read: Optional[bool] = None


class SchemaNotificationOut(SchemaNotificationBase):
    """Notification output model."""

    id: str
    userId: str
    senderId: Optional[str] = None
    sender: Optional[Dict[str, Any]] = None
    referenceId: Optional[str] = None
    referenceType: Optional[str] = None
    createdAt: datetime
    updatedAt: Optional[datetime] = None


class SchemaNotificationListResponse(APIBaseModel):
    """Response model for notification listing."""

    items: List[SchemaNotificationOut]
    total: int
    unread: int
