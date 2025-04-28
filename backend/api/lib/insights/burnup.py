"""Burnup chart utility functions for insights."""

from datetime import timedelta
from typing import Dict, List, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from api.schemas.insights import SchemaTimeFrameType as TimeFrameType
from db.models import Event, EventStatusEnum


def get_daily_burnup(db: Session, user_id: str, start_date, end_date) -> List[Dict]:
    """Get daily burnup data for the given user and date range."""
    # Generate dates for the entire range
    result = []
    current_date = start_date
    completed_tasks_total = 0

    while current_date <= end_date:
        date_str = current_date.isoformat()

        # Count completed events for this user on this day
        completed_on_day = db.query(func.count(Event.id)).filter(
            Event.created_by_id == user_id,
            Event.date == date_str,
            Event.status == EventStatusEnum.DONE,
        ).scalar() or 0

        # Accumulate total completed
        completed_tasks_total += completed_on_day

        # Get total events count until this day
        total_events = db.query(func.count(Event.id)).filter(
            Event.created_by_id == user_id,
            Event.date <= date_str
        ).scalar() or 0

        # Calculate progress percentage
        progress = round((completed_tasks_total / total_events * 100) if total_events > 0 else 0)

        # Create datapoint with all required fields
        result.append({
            "date": date_str,
            "completed": completed_tasks_total,
            "total": total_events,
            "day": current_date.strftime("%a"),  # Short day name
            "progress": progress  # Add the required progress field
        })

        current_date += timedelta(days=1)

    return result


def get_weekly_burnup(db: Session, user_id: str, start_date, end_date) -> List[Dict]:
    """Get weekly burnup data for the given user and date range."""
    # Generate weekly datapoints
    result = []
    current_date = start_date
    completed_tasks_total = 0

    # Get initial total before the start date
    initial_completed = db.query(func.count(Event.id)).filter(
        Event.created_by_id == user_id,
        Event.date < start_date.isoformat(),
        Event.status == EventStatusEnum.DONE,
    ).scalar() or 0
    completed_tasks_total = initial_completed

    # Create weekly datapoints
    while current_date <= end_date:
        week_end = current_date + timedelta(days=6)
        if week_end > end_date:
            week_end = end_date

        # Count completed events for this user in this week
        completed_in_week = db.query(func.count(Event.id)).filter(
            Event.created_by_id == user_id,
            Event.date >= current_date.isoformat(),
            Event.date <= week_end.isoformat(),
            Event.status == EventStatusEnum.DONE,
        ).scalar() or 0

        # Accumulate total completed
        completed_tasks_total += completed_in_week

        # Get total events count until the end of this week
        total_events = db.query(func.count(Event.id)).filter(
            Event.created_by_id == user_id,
            Event.date <= week_end.isoformat()
        ).scalar() or 0

        # Create datapoint
        result.append({
            "start_date": current_date.isoformat(),
            "end_date": week_end.isoformat(),
            "completed": completed_tasks_total,
            "total": total_events,
            "week": current_date.strftime("%b %d") + " - " + week_end.strftime("%b %d"),
            "progress": round((completed_tasks_total / total_events * 100) if total_events > 0 else 0)  # Add the required progress field
        })

        current_date = week_end + timedelta(days=1)

    return result


def get_appropriate_burnup_data(db: Session, user_id: str, time_frame: TimeFrameType, start_date, end_date) -> Tuple[List[Dict], List[Dict]]:
    """Get appropriate burnup data based on the time frame."""

    if time_frame == TimeFrameType.WEEK:
        # For weekly view, we need just the daily burnup
        daily_burnup = get_daily_burnup(db, user_id, start_date, end_date)
        quarterly_burnup = []  # Empty for weekly view
    elif time_frame == TimeFrameType.MONTH:
        # For monthly view, we need both daily and weekly burnup
        daily_burnup = get_daily_burnup(db, user_id, start_date, end_date)
        quarterly_burnup = get_weekly_burnup(db, user_id, start_date, end_date)
    elif time_frame in [TimeFrameType.QUARTER, TimeFrameType.YEAR]:
        # For quarterly/yearly view, we need quarterly burnup
        quarterly_burnup = get_weekly_burnup(db, user_id, start_date, end_date)
        daily_burnup = []  # Empty for quarterly/yearly view
    else:  # CUSTOM time frame
        # For custom view, adapt based on the duration
        days_in_range = (end_date - start_date).days
        if days_in_range <= 7:  # If custom range is a week or less
            daily_burnup = get_daily_burnup(db, user_id, start_date, end_date)
            quarterly_burnup = []
        else:  # Longer custom range
            quarterly_burnup = get_weekly_burnup(db, user_id, start_date, end_date)
            daily_burnup = []

    return daily_burnup, quarterly_burnup
