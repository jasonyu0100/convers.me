"""Live session and AI context schemas for the API."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field
from pydantic.config import ConfigDict

from api.schemas.base import APIBaseModel
from api.schemas.processes import SchemaProcessOut


class SchemaLiveContextBase(APIBaseModel):
    """Base schema for live session AI context."""

    processId: Optional[str] = None
    eventId: Optional[str] = None
    templateId: Optional[str] = None
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SchemaLiveContextCreate(SchemaLiveContextBase):
    """Schema for creating a new live session context."""


class SchemaLiveContextUpdate(APIBaseModel):
    """Schema for updating a live session context."""

    processId: Optional[str] = None
    eventId: Optional[str] = None
    templateId: Optional[str] = None
    messages: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None


class SchemaLiveContextOut(SchemaLiveContextBase):
    """Schema for returning a live session context."""

    id: str
    userId: str
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SchemaLiveMessage(APIBaseModel):
    """Schema for a live message to be processed by AI."""

    message: str
    contextId: Optional[str] = None
    processId: Optional[str] = None
    eventId: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SchemaLiveOperation(APIBaseModel):
    """Schema for a live operation to modify processes/steps/substeps."""

    operation: str = Field(description="Operation type: 'complete_step', 'add_step', 'add_substep', 'update_step'")
    processId: str
    stepId: Optional[str] = None
    subStepId: Optional[str] = None
    content: Optional[str] = None
    completed: Optional[bool] = None
    order: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SchemaLiveResponse(APIBaseModel):
    """Schema for AI response to a live message."""

    response: str
    contextId: str
    processModifications: Optional[List[Dict[str, Any]]] = None
    suggestedOperations: Optional[List[Dict[str, Any]]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SchemaLiveProcessContext(APIBaseModel):
    """Schema for returning process context to be used by AI."""

    process: Optional[SchemaProcessOut] = None
    relatedEvents: List[Dict[str, Any]] = Field(default_factory=list)
    recentMessages: List[Dict[str, Any]] = Field(default_factory=list)
    userPreferences: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
