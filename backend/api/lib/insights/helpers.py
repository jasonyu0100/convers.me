"""Insight helper functions."""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

from api.schemas.insights import SchemaInsightRequest as InsightRequest
from api.schemas.insights import SchemaTimeFrameType as TimeFrameType

# Set up logger
logger = logging.getLogger(__name__)


def calculate_date_range(request: InsightRequest) -> Tuple[datetime, datetime]:
    """Calculate the date range based on the request time frame."""
    today = datetime.now().date()

    # Use the camelCase field directly
    time_frame = request.timeFrame

    if time_frame == TimeFrameType.WEEK:
        # Calculate the start of the week (Monday)
        start_of_week = today - timedelta(days=today.weekday())
        start_date = start_of_week
        end_date = start_of_week + timedelta(days=6)  # Sunday
    elif time_frame == TimeFrameType.MONTH:
        # Calculate the start of the month
        start_date = today.replace(day=1)
        # Calculate end of month
        if today.month == 12:
            next_month = datetime(today.year + 1, 1, 1).date()
        else:
            next_month = datetime(today.year, today.month + 1, 1).date()
        end_date = next_month - timedelta(days=1)
    elif time_frame == TimeFrameType.QUARTER:
        # Calculate the start of the quarter
        month = today.month
        quarter_start_month = ((month - 1) // 3) * 3 + 1
        start_date = datetime(today.year, quarter_start_month, 1).date()
        # End date is 3 months after start date - 1 day
        if quarter_start_month + 2 > 12:
            # Handle year crossover
            end_month = (quarter_start_month + 2) % 12
            end_year = today.year + 1
        else:
            end_month = quarter_start_month + 2
            end_year = today.year

        if end_month == 12:
            end_date = datetime(end_year, end_month, 31).date()
        else:
            next_month_start = datetime(end_year, end_month + 1, 1).date()
            end_date = next_month_start - timedelta(days=1)
    elif time_frame == TimeFrameType.YEAR:
        # Calculate the start of the year
        start_date = datetime(today.year, 1, 1).date()
        end_date = datetime(today.year, 12, 31).date()
    else:  # CUSTOM or any other case
        # Default to last 7 days if no custom dates provided
        start_date = today - timedelta(days=7)
        end_date = today

    # Override date range if specified in the request
    start_date_override = getattr(request, 'start_date', None)
    if start_date_override:
        start_date = datetime.fromisoformat(start_date_override).date()

    end_date_override = getattr(request, 'end_date', None)
    if end_date_override:
        end_date = datetime.fromisoformat(end_date_override).date()

    return start_date, end_date


def get_help_topics() -> List[Dict[str, str]]:
    """Get help topics for insights."""
    help_dict = {
        "events": "Manage your events and track progress",
        "processes": "Create and follow structured processes",
        "reports": "Generate and view reports",
        "performance": "Track your performance metrics",
        "team": "Collaborate with your team"
    }

    # Convert to the list format required by the schema
    help_topics = []
    for term, description in help_dict.items():
        help_topics.append({
            "term": term,
            "description": description,
            "category": "general"
        })

    return help_topics
