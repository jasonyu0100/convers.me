"""Progress utility functions for insights."""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from api.schemas.insights import SchemaQuarterlyProgress as QuarterlyProgress
from api.schemas.insights import SchemaTimeFrameType as TimeFrameType
from api.schemas.insights import SchemaWeeklyProgress as WeeklyProgress
from db.models import Event, EventStatusEnum

# Set up logger
logger = logging.getLogger(__name__)

def get_weekly_progress(db: Session, user_id: str, start_date, end_date) -> Optional[WeeklyProgress]:
    """Get weekly progress data for the given user and date range."""
    # Get the ISO week number
    week_number = start_date.isocalendar()[1]

    # Count completed events
    events_completed = db.query(func.count(Event.id)).filter(
        Event.created_by_id == user_id,
        Event.date >= start_date.isoformat(),
        Event.date <= end_date.isoformat(),
        Event.status == EventStatusEnum.DONE
    ).scalar() or 0

    # Count total events
    total_events = db.query(func.count(Event.id)).filter(
        Event.created_by_id == user_id,
        Event.date >= start_date.isoformat(),
        Event.date <= end_date.isoformat()
    ).scalar() or 0

    # If no events, return None
    if total_events == 0:
        return None

    # Get total time spent (mock data for now)
    total_time_spent = events_completed * 45  # Mock average of 45 minutes per event

    # Calculate efficiency (mock data for now)
    efficiency = 85  # Mock efficiency score

    # Calculate progress percentage (convert to integer for schema compliance)
    progress = int(round((events_completed / total_events * 100) if total_events > 0 else 0))

    # Count steps completed
    steps_completed = events_completed * 3  # Mock average of 3 steps per event

    # Create the weekly progress object using standard parameter names for consistency
    return WeeklyProgress(
        week=f"Week {week_number}",
        startDate=start_date.isoformat(),
        endDate=end_date.isoformat(),
        eventsCompleted=events_completed,
        stepsCompleted=steps_completed,
        totalTimeSpent=total_time_spent,
        efficiency=efficiency,
        progress=progress,
    )

def get_quarterly_progress(db: Session, user_id: str, time_frame: TimeFrameType, start_date, end_date, core_metrics: List[Dict]) -> Optional[QuarterlyProgress]:
    """Get quarterly progress data based on the time frame."""
    # For WEEK or MONTH time frames, we'll show quarterly data
    if time_frame in [TimeFrameType.WEEK, TimeFrameType.MONTH]:
        # Get the quarter number
        quarter = ((start_date.month - 1) // 3) + 1

        # Get events completed from core metrics
        events_completed = next((item["value"] for item in core_metrics if item["name"] == "Events Completed"), 0)

        # Mock data for required fields (these should be replaced with real data in production)
        steps_completed = events_completed * 3  # Mocked: 3 steps per event
        total_time_spent = events_completed * 45  # Mocked: 45 minutes per event
        efficiency = 85  # Mocked efficiency score
        progress = next((item["value"] for item in core_metrics if item["name"] == "Completion Rate"), 0)

        # Create a quarterly progress object
        return QuarterlyProgress(
            quarter=f"Q{quarter} {start_date.year}",
            startDate=datetime(start_date.year, ((quarter - 1) * 3) + 1, 1).date().isoformat(),
            endDate=end_date.isoformat() if time_frame == TimeFrameType.MONTH else (datetime(start_date.year, quarter * 3, 1).date() - timedelta(days=1)).isoformat(),
            eventsCompleted=events_completed,
            stepsCompleted=steps_completed,
            totalTimeSpent=total_time_spent,
            efficiency=efficiency,
            progress=int(progress),
            weeks=[]  # Empty list for now, these should be populated with actual weekly data
        )

    # For QUARTER time frame, we'll show yearly data
    elif time_frame == TimeFrameType.QUARTER:
        # Get events completed from core metrics
        events_completed = next((item["value"] for item in core_metrics if item["name"] == "Events Completed"), 0)

        # Mock data for required fields (these should be replaced with real data in production)
        steps_completed = events_completed * 3  # Mocked: 3 steps per event
        total_time_spent = events_completed * 45  # Mocked: 45 minutes per event
        efficiency = 85  # Mocked efficiency score
        progress = next((item["value"] for item in core_metrics if item["name"] == "Completion Rate"), 0)

        # Create a yearly progress object
        return QuarterlyProgress(
            quarter=f"Year {start_date.year}",
            startDate=datetime(start_date.year, 1, 1).date().isoformat(),
            endDate=datetime(start_date.year, 12, 31).date().isoformat(),
            eventsCompleted=events_completed,
            stepsCompleted=steps_completed,
            totalTimeSpent=total_time_spent,
            efficiency=efficiency,
            progress=int(progress),
            weeks=[]  # Empty list for now, these should be populated with actual yearly data
        )

    # For YEAR or CUSTOM time frames, we'll return None
    else:
        return None
