"""Process and Directory schemas for the API."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field
from pydantic.config import ConfigDict

from api.schemas.base import APIBaseModel
from api.schemas.events import SchemaConnectedEvent, SchemaStepBase, SchemaStepOut, SchemaSubStepBase


class SchemaDirectoryBase(APIBaseModel):
    """Base directory model."""

    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    directoryMetadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class SchemaDirectoryCreate(SchemaDirectoryBase):
    """Directory creation model."""

    parentId: Optional[str] = Field(default=None)


class SchemaDirectoryUpdate(APIBaseModel):
    """Directory update model."""

    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    parentId: Optional[str] = Field(default=None)
    directoryMetadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class SchemaDirectoryOut(SchemaDirectoryBase):
    """Directory output model."""

    id: str
    createdAt: datetime
    updatedAt: Optional[datetime] = None
    createdById: Optional[str] = None
    parentId: Optional[str] = None
    processes: List[str] = Field(default_factory=list)
    processCount: Optional[int] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SchemaDirectoryDetailOut(SchemaDirectoryOut):
    """Directory output model with processes and subdirectories."""

    processes: List["SchemaProcessOut"] = Field(default_factory=list)
    subdirectories: List["SchemaDirectoryOut"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SchemaProcessBase(APIBaseModel):
    """Base process model."""

    title: str
    description: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    favorite: Optional[bool] = False
    processMetadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class SchemaProcessCreate(SchemaProcessBase):
    """Process creation model."""

    steps: Optional[List[SchemaStepBase]] = None
    directoryId: Optional[str] = None  # ID of the directory this process belongs to


class SchemaProcessUpdate(APIBaseModel):
    """Process update model."""

    title: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    favorite: Optional[bool] = None
    directoryId: Optional[str] = None  # Allow moving process to a different directory
    processMetadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    lastUpdated: Optional[str] = None


class SchemaProcessOut(SchemaProcessBase):
    """Process output model."""

    id: str
    createdAt: datetime
    updatedAt: Optional[datetime] = None
    createdById: str
    directoryId: Optional[str] = None
    lastUpdated: Optional[str] = None
    isTemplate: bool = False
    templateId: Optional[str] = None
    template: Optional["SchemaProcessOut"] = None  # For instances, references the template
    instanceIds: Optional[List[str]] = None  # For templates, references instances

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SchemaProcessDetailOut(SchemaProcessOut):
    """Process output model with steps and connected events."""

    steps: List[SchemaStepOut] = Field(default_factory=list)
    connectedEvents: List[SchemaConnectedEvent] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SchemaProcessSubStepCreate(SchemaSubStepBase):
    """Sub-step creation specifically for process steps."""


class SchemaProcessStepCreate(SchemaStepBase):
    """Step creation specifically for processes."""

    processId: str = Field()
    subSteps: Optional[List[SchemaProcessSubStepCreate]] = Field(default=None)


class SchemaProcessStepUpdate(APIBaseModel):
    """Step update for processes."""

    content: Optional[str] = None
    completed: Optional[bool] = None
    order: Optional[int] = None
    dueDate: Optional[str] = Field(default=None)


class SchemaProcessSubStepUpdate(APIBaseModel):
    """Sub-step update for processes."""

    content: Optional[str] = None
    completed: Optional[bool] = None
    order: Optional[int] = None
