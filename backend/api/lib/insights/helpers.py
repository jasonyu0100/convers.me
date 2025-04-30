"""Insight helper functions."""

import logging
from datetime import datetime, timedelta
from typing import Tuple

from api.schemas.insights import SchemaInsightRequest as InsightRequest

# Set up logger
logger = logging.getLogger(__name__)


def calculate_date_range(request: InsightRequest) -> Tuple[datetime, datetime]:
    """Calculate the date range for weekly view (simplified function)."""
    today = datetime.now().date()

    # Calculate the start of the week (Monday)
    start_of_week = today - timedelta(days=today.weekday())
    start_date = start_of_week
    end_date = start_of_week + timedelta(days=6)  # Sunday

    # Override date range if specified in the request
    start_date_override = getattr(request, 'start_date', None)
    if start_date_override:
        start_date = datetime.fromisoformat(start_date_override).date()

    end_date_override = getattr(request, 'end_date', None)
    if end_date_override:
        end_date = datetime.fromisoformat(end_date_override).date()

    return start_date, end_date


# get_help_topics removed
