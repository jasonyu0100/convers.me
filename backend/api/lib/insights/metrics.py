"""Metrics utility functions for insights."""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from db.models import Event, EventStatusEnum, Process


# Define process status enum
class ProcessStatusEnum:
    """Process status enum."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ARCHIVED = "archived"

# Set up logger
logger = logging.getLogger(__name__)

def get_performance_metrics(db: Session, user_id: str, start_date_str: str, end_date_str: str) -> List[Dict[str, Any]]:
    """Get performance metrics for the given user and date range."""
    # Count total events
    total_events = db.query(func.count(Event.id)).filter(
        Event.created_by_id == user_id,
        Event.date >= start_date_str,
        Event.date <= end_date_str
    ).scalar() or 0

    # Count completed events
    completed_events = db.query(func.count(Event.id)).filter(
        Event.created_by_id == user_id,
        Event.date >= start_date_str,
        Event.date <= end_date_str,
        Event.status == EventStatusEnum.DONE
    ).scalar() or 0

    # Calculate completion rate
    completion_rate = round((completed_events / total_events * 100) if total_events > 0 else 0, 1)

    # Count active processes - need to calculate dynamically rather than using a column
    # Will be updated by actual count of processes with IN_PROGRESS status from get_process_metrics
    active_processes = 0
    processes = db.query(Process).filter(Process.created_by_id == user_id).all()

    for process in processes:
        # Determine if process is active by checking steps
        if process.steps:
            has_progress = any(step.completed for step in process.steps)
            all_completed = all(step.completed for step in process.steps)
            if has_progress and not all_completed:
                active_processes += 1

    # Return metrics in the expected format with all required fields
    return [
        {
            "id": "metric-completion-rate",
            "name": "Completion Rate",
            "value": completion_rate,
            "unit": "%",
            "change": 5.2,
            "isPositive": True
        },
        {
            "id": "metric-events-completed",
            "name": "Events Completed",
            "value": completed_events,
            "unit": "",
            "change": 3.1,
            "isPositive": True
        },
        {
            "id": "metric-active-processes",
            "name": "Active Processes",
            "value": active_processes,
            "unit": "",
            "change": 1.0,
            "isPositive": True
        },
        {
            "id": "metric-total-events",
            "name": "Total Events",
            "value": total_events,
            "unit": "",
            "change": 2.5,
            "isPositive": True
        }
    ]

def get_process_metrics(db: Session, user_id: str, start_date_str: str, end_date_str: str, is_completed: bool) -> List[Dict[str, Any]]:
    """Get process metrics for the given user and date range."""
    # Query processes
    query = db.query(Process).filter(Process.created_by_id == user_id)
    processes = query.all()

    # Format the results
    result = []
    for process in processes:
        # Calculate progress percentage and determine status based on steps completion
        total_steps = len(process.steps) if hasattr(process, "steps") and process.steps else 0
        total_substeps = 0
        completed_steps = 0
        completed_substeps = 0

        # Count steps and substeps
        if hasattr(process, "steps") and process.steps:
            for step in process.steps:
                if step.completed:
                    completed_steps += 1

                # Count substeps if they exist
                if hasattr(step, "sub_steps") and step.sub_steps:
                    total_substeps += len(step.sub_steps)
                    completed_substeps += sum(1 for substep in step.sub_steps if substep.completed)

        # Calculate overall progress
        total_items = total_steps + total_substeps
        completed_items = completed_steps + completed_substeps
        progress = round((completed_items / total_items * 100) if total_items > 0 else 0, 1)

        # Determine process status based on completion
        if total_steps == 0:
            status = ProcessStatusEnum.NOT_STARTED
        elif completed_steps == total_steps and (total_substeps == 0 or completed_substeps == total_substeps):
            status = ProcessStatusEnum.COMPLETED
        elif completed_steps > 0 or completed_substeps > 0:
            status = ProcessStatusEnum.IN_PROGRESS
        else:
            status = ProcessStatusEnum.NOT_STARTED

        # Filter based on completion status if requested
        process_completed = (status == ProcessStatusEnum.COMPLETED)
        if is_completed == process_completed:
            # Calculate time spent (mock data for now)
            time_spent = total_steps * 30  # Mock data: assume 30 minutes per step

            # Calculate complexity (mock data based on number of steps)
            complexity = min(5, max(1, (total_steps // 2)))

            # Calculate last activity date (using process updated_at if available, otherwise current date)
            last_activity = process.updated_at.isoformat() if hasattr(process, 'updated_at') and process.updated_at else datetime.now().isoformat()

            # Ensure we're using all fields required by the ProcessMetric schema with camelCase keys
            result.append({
                "id": str(process.id),
                "name": process.title,  # Use title instead of name
                "completedSteps": completed_steps,
                "totalSteps": total_steps,
                "timeSpent": time_spent,
                "complexity": complexity,
                "lastActivity": last_activity,
                "progress": int(progress),  # Convert to integer to fix float validation error
                "status": status  # This is our computed status, not a field on the Process model
            })

    return result


def get_effort_distribution(db: Session, user_id: str, start_date_str: str, end_date_str: str) -> List[Dict[str, Any]]:
    """Get effort distribution by status category for the given user and date range."""
    # Query events grouped by status
    status_counts = db.query(
        Event.status,
        func.count(Event.id)
    ).filter(
        Event.created_by_id == user_id,
        Event.date >= start_date_str,
        Event.date <= end_date_str
    ).group_by(Event.status).all()

    # Create a mapping of status to count
    status_map = {status: count for status, count in status_counts}

    # Define status colors matching exact EventStatusEnum values
    status_colors = {
        "Pending": "#FFC107",       # Amber
        "Execution": "#2196F3",     # Blue
        "Done": "#4CAF50",          # Green
        "Planning": "#9C27B0",      # Purple
        "Review": "#FF5722",        # Deep Orange
        "Administrative": "#607D8B" # Blue Grey
    }

    # Calculate total count for percentages
    total_count = sum(status_map.values())

    # Format the results with required fields
    result = []
    for status_name, color in status_colors.items():
        # The enum values in the model are defined as:
        # PENDING = "Pending"
        # PLANNING = "Planning"
        # EXECUTION = "Execution"
        # REVIEW = "Review"
        # ADMINISTRATIVE = "Administrative"
        # DONE = "Done"
        status_enum = status_name

        count = status_map.get(status_enum, 0)
        percentage = round((count / total_count * 100) if total_count > 0 else 0, 1)

        result.append({
            "status": status_name,
            "count": count,
            "category": status_name,
            "value": count,
            "total": total_count,
            "percentage": percentage,
            "color": color
        })

    return result

def get_daily_activities(db: Session, user_id: str, start_date, end_date) -> List[Dict[str, Any]]:
    """Get daily activities for the given user and date range."""
    result = []
    current_date = start_date

    while current_date <= end_date:
        date_str = current_date.isoformat()

        # Count events for this day
        events_count = db.query(func.count(Event.id)).filter(
            Event.created_by_id == user_id,
            Event.date == date_str
        ).scalar() or 0

        # Count completed events for this day
        completed_count = db.query(func.count(Event.id)).filter(
            Event.created_by_id == user_id,
            Event.date == date_str,
            Event.status == EventStatusEnum.DONE
        ).scalar() or 0

        # Create datapoint with all required fields in camelCase
        result.append({
            "date": date_str,
            "day": current_date.strftime("%a"),
            "events": events_count,
            "completed": completed_count,
            "eventsCompleted": completed_count,  # Alias for frontend schema
            "stepsCompleted": completed_count * 3,  # Mock: Assume 3 steps per event
            "timeSpent": completed_count * 45,  # Mock: Assume 45 minutes per event
            "efficiency": 85 if events_count > 0 else 0  # Mock: Fixed efficiency score
        })

        current_date += timedelta(days=1)

    return result
