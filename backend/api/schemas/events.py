"""Event schemas for the API."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field
from pydantic.config import ConfigDict

from api.schemas.base import APIBaseModel
from api.schemas.status_logs import SchemaStatusLogOut
from api.schemas.topics import SchemaTopicOut
from api.utils import create_model_validator
from db.models import EventStatusEnum, ParticipantStatusEnum


class SchemaEventBase(APIBaseModel):
    """Base event model."""

    title: str
    description: Optional[str] = None
    startTime: Optional[datetime] = Field(default=None)
    endTime: Optional[datetime] = Field(default=None)
    # Keep legacy fields for backwards compatibility
    date: Optional[str] = None  # ISO date string
    time: Optional[str] = None
    duration: Optional[str] = None
    status: Optional[EventStatusEnum] = EventStatusEnum.PENDING
    complexity: Optional[int] = None
    color: Optional[str] = None
    location: Optional[str] = None
    # Removed is_recurring field - recurring events are no longer supported
    eventMetadata: Optional[Dict[str, Any]] = Field(default=None)


class SchemaEventCreate(SchemaEventBase):
    """Event creation model."""

    processId: Optional[str] = Field(default=None)
    templateProcessId: Optional[str] = Field(default=None)  # ID of template process to create instance from
    topics: Optional[List[str]] = None  # List of topic IDs to associate
    participantIds: Optional[List[str]] = Field(default=None)  # List of user IDs to invite


class SchemaEventUpdate(APIBaseModel):
    """Event update model."""

    title: Optional[str] = None
    description: Optional[str] = None
    startTime: Optional[datetime] = Field(default=None)
    endTime: Optional[datetime] = Field(default=None)
    # Keep legacy fields for backwards compatibility
    date: Optional[str] = None
    time: Optional[str] = None
    duration: Optional[str] = None
    status: Optional[EventStatusEnum] = None
    complexity: Optional[int] = None
    color: Optional[str] = None
    location: Optional[str] = None
    # Removed is_recurring field - recurring events are no longer supported
    recordingUrl: Optional[str] = Field(default=None)
    processId: Optional[str] = Field(default=None)
    eventMetadata: Optional[Dict[str, Any]] = Field(default=None)
    topics: Optional[List[str]] = None  # List of topic IDs


# Status Log schemas moved to status_logs.py


class SchemaEventParticipantBase(APIBaseModel):
    """Base event participant model."""

    userId: str = Field()
    role: Optional[str] = "participant"
    status: Optional[ParticipantStatusEnum] = ParticipantStatusEnum.INVITED


class SchemaEventParticipantCreate(SchemaEventParticipantBase):
    """Event participant creation model."""


class SchemaEventParticipantUpdate(APIBaseModel):
    """Event participant update model."""

    role: Optional[str] = None
    status: Optional[ParticipantStatusEnum] = None


class SchemaParticipantUser(APIBaseModel):
    """User information in participant response."""

    id: str
    name: str
    handle: str
    profileImage: Optional[str] = Field(default=None)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True, json_schema_extra={"properties": {"id": {"description": "User ID as string"}}})

    # Use the utility function to create model_validate
    model_validate = classmethod(create_model_validator(["id"]))


class SchemaEventParticipantOut(SchemaEventParticipantBase):
    """Event participant output model."""

    eventId: str = Field()
    joinedAt: datetime = Field()
    user: Optional[SchemaParticipantUser] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Use the utility function to create model_validate to ensure UUIDs are converted to strings
    model_validate = classmethod(create_model_validator(["user_id", "event_id"]))


class SchemaParticipantsGroup(APIBaseModel):
    """Group of participants for UI display."""

    name: str
    count: int
    avatars: Optional[List[SchemaParticipantUser]] = None


class SchemaStepBase(APIBaseModel):
    """Base step model."""

    content: str
    completed: bool = False
    order: int
    dueDate: Optional[str] = Field(default=None)
    completedAt: Optional[datetime] = Field(default=None)


class SchemaSubStepBase(APIBaseModel):
    """Base sub-step model."""

    content: str
    completed: bool = False
    order: int
    completedAt: Optional[datetime] = Field(default=None)


class SchemaSubStepCreate(SchemaSubStepBase):
    """Sub-step creation model."""

    stepId: str = Field()


class SchemaSubStepUpdate(APIBaseModel):
    """Sub-step update model."""

    content: Optional[str] = None
    completed: Optional[bool] = None
    order: Optional[int] = None
    completedAt: Optional[datetime] = Field(default=None)


class SchemaSubStepOut(SchemaSubStepBase):
    """Sub-step output model."""

    id: str
    stepId: str = Field()
    createdAt: Optional[datetime] = Field(default=None)
    updatedAt: Optional[datetime] = Field(default=None)

    model_config = ConfigDict(from_attributes=True)

    # Use the utility function to create model_validate
    model_validate = classmethod(create_model_validator(["id", "step_id"]))


class SchemaStepCreate(SchemaStepBase):
    """Step creation model."""

    eventId: Optional[str] = Field(default=None)
    processId: Optional[str] = Field(default=None)
    subSteps: Optional[List[SchemaSubStepBase]] = Field(default=None)


class SchemaStepUpdate(APIBaseModel):
    """Step update model."""

    content: Optional[str] = None
    completed: Optional[bool] = None
    order: Optional[int] = None
    dueDate: Optional[str] = Field(default=None)
    completedAt: Optional[datetime] = Field(default=None)


class SchemaStepOut(SchemaStepBase):
    """Step output model."""

    id: str
    eventId: Optional[str] = Field(default=None)
    processId: Optional[str] = Field(default=None)
    createdAt: Optional[datetime] = Field(default=None)
    updatedAt: Optional[datetime] = Field(default=None)
    subSteps: List[SchemaSubStepOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Use the utility function to create model_validate
    model_validate = classmethod(create_model_validator(["id", "event_id", "process_id"]))


class SchemaEventOut(SchemaEventBase):
    """Event output model."""

    id: str
    createdAt: datetime = Field()
    updatedAt: Optional[datetime] = Field(default=None)
    createdById: str = Field()
    processId: Optional[str] = Field(default=None)
    recordingUrl: Optional[str] = Field(default=None)
    topics: Optional[List[SchemaTopicOut]] = []
    participants: Optional[List[SchemaEventParticipantOut]] = []

    model_config = ConfigDict(from_attributes=True)


class SchemaCalendarEventOut(APIBaseModel):
    """Simplified event output model for calendar view to reduce payload size."""

    id: str
    title: str
    description: Optional[str] = None
    startTime: datetime = Field()
    endTime: datetime = Field()
    # Keep legacy fields for backwards compatibility
    date: Optional[str] = None
    time: Optional[str] = None
    duration: Optional[str] = None
    status: Optional[str] = None
    color: Optional[str] = None
    location: Optional[str] = None
    # isRecurring field has been removed from database model
    createdById: str = Field()
    createdAt: datetime = Field()
    updatedAt: Optional[datetime] = Field(default=None)

    # Optional fields
    processId: Optional[str] = Field(default=None)
    topics: List[str] = []

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Override model_validate to ensure UUIDs are converted to strings
    model_validate = classmethod(create_model_validator(["id", "created_by_id", "process_id"]))


class SchemaRelatedEventOut(APIBaseModel):
    """Simple event info for related events."""

    id: str
    title: str
    startTime: datetime = Field()
    date: Optional[str] = None  # Keep for backwards compatibility
    color: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SchemaEventDetailOut(SchemaEventOut):
    """Detailed event output with additional fields."""

    steps: List[SchemaStepOut] = []
    tags: List[str] = []  # Tag names extracted from topics for UI
    participantsGroup: Optional[SchemaParticipantsGroup] = Field(default=None)
    relatedEvents: List[SchemaRelatedEventOut] = Field(default=[])  # Related events
    statusLogs: List[SchemaStatusLogOut] = Field(default=[])  # Status change history

    model_config = ConfigDict(from_attributes=True)


class SchemaEventListItem(APIBaseModel):
    """Event list item for calendar and list views."""

    id: str
    title: str
    startTime: datetime = Field()
    endTime: datetime = Field()
    # Keep legacy fields for backwards compatibility
    date: Optional[str] = None
    time: Optional[str] = None
    color: Optional[str] = None
    status: Optional[EventStatusEnum] = None
    participantCount: int = Field(default=0)
    topics: List[str] = []  # Just topic names for list display

    model_config = ConfigDict(from_attributes=True)


class SchemaConnectedEvent(APIBaseModel):
    """Event connected to a process."""

    id: str
    name: str
    startTime: datetime = Field()
    date: Optional[str] = None  # Keep for backwards compatibility
    imageUrl: Optional[str] = Field(default=None)
    participants: int = 0
    progress: float = 0.0  # Percentage 0-100 of completed steps

    model_config = ConfigDict(from_attributes=True)


class SchemaEventList(APIBaseModel):
    """Event list with steps."""

    id: str
    title: str
    description: Optional[str] = None
    steps: List[SchemaStepOut] = []
    process: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)
