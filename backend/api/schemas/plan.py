"""Plan schemas for the API."""

from datetime import datetime
from typing import List, Optional

from pydantic import Field

from api.schemas.base import APIBaseModel
from db.models import EventStatusEnum


class SchemaPlanDirectoryTemplate(APIBaseModel):
    """Template from a directory for use in planning."""

    id: str = Field(description="Template ID")
    name: str = Field(description="Template name")
    templateCount: int = Field(description="Number of events this template creates")


class SchemaPlanDirectory(APIBaseModel):
    """Directory with templates for plan generation."""

    id: str = Field(description="Directory ID")
    name: str = Field(description="Directory name")
    description: Optional[str] = Field(default=None, description="Directory description")
    color: str = Field(description="Directory color")
    templates: List[SchemaPlanDirectoryTemplate] = Field(
        default_factory=list, description="Templates in this directory")


class SchemaPlanEvent(APIBaseModel):
    """Event generated as part of a plan."""

    id: str = Field(description="Event ID")
    title: str = Field(description="Event title")
    description: str = Field(description="Event description")
    processId: str = Field(description="Associated process ID")
    startTime: datetime = Field(description="Event start time")
    endTime: datetime = Field(description="Event end time")
    effort: str = Field(description="Effort level (low, medium, high)")
    status: Optional[EventStatusEnum] = Field(default=EventStatusEnum.PENDING, description="Event status")


class SchemaPlanGenerateRequest(APIBaseModel):
    """Request for generating a plan."""

    description: str = Field(description="Plan description")
    goals: str = Field(description="Plan goals")
    effort: str = Field(description="Overall effort level (low, medium, high)")
    hoursAllocation: int = Field(description="Hours allocated per week (1-40)")
    directoryIds: List[str] = Field(default_factory=list, description="Directory IDs to include templates from")
    templateIds: Optional[List[str]] = Field(default=None, description="Specific template IDs to include")


class SchemaPlanGenerateResponse(APIBaseModel):
    """Response for plan generation."""

    events: List[SchemaPlanEvent] = Field(description="Generated events")
    summary: Optional[str] = Field(default=None, description="Plan summary")


class SchemaPlanSaveRequest(APIBaseModel):
    """Request for saving a plan."""

    events: List[SchemaPlanEvent] = Field(description="Events to save")


class SchemaPlanSaveResponse(APIBaseModel):
    """Response for saving a plan."""

    success: bool = Field(description="Whether the save was successful")
    savedEvents: List[str] = Field(description="IDs of saved events")


class SchemaDirectoriesWithTemplatesResponse(APIBaseModel):
    """Response containing directories with their templates."""

    directories: List[SchemaPlanDirectory] = Field(
        default_factory=list, description="Directories with templates")
