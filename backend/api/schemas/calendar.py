"""Calendar schemas for the API."""

from typing import Any, Dict, List, Optional

from pydantic import Field

from api.schemas.base import APIBaseModel
from api.schemas.events import SchemaEventOut


class SchemaCalendarPeriod(APIBaseModel):
    """Schema for a calendar period (e.g., day, week, month)."""

    startDate: str = Field(..., description="Start date in ISO format")
    endDate: str = Field(..., description="End date in ISO format")
    calendarMetadata: Optional[Dict[str, Any]] = Field(default=None)


class SchemaCalendarDay(APIBaseModel):
    """Schema for a single calendar day."""

    date: str = Field(..., description="Date in ISO format")
    events: List[SchemaEventOut] = Field(default_factory=list, description="Events on this day")
    isToday: bool = Field(default=False, description="Whether this is the current day")


class SchemaCalendarWeek(APIBaseModel):
    """Schema for a calendar week."""

    startDate: str = Field(..., description="Start date of the week in ISO format")
    endDate: str = Field(..., description="End date of the week in ISO format")
    days: List[SchemaCalendarDay] = Field(..., description="Days in this week")


class SchemaCalendarMonth(APIBaseModel):
    """Schema for a calendar month."""

    year: int = Field(..., description="Year")
    month: int = Field(..., description="Month (1-12)")
    weeks: List[SchemaCalendarWeek] = Field(..., description="Weeks in this month")
    days: List[SchemaCalendarDay] = Field(..., description="All days in this month")


class SchemaCalendarView(APIBaseModel):
    """Schema for a complete calendar view."""

    startDate: str = Field(..., description="Start date in ISO format")
    endDate: str = Field(..., description="End date in ISO format")
    days: List[SchemaCalendarDay] = Field(..., description="Days in this view")
    events: List[SchemaEventOut] = Field(..., description="All events in this period")
