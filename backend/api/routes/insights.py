"""Insight routes for the API."""

import logging
from typing import Annotated, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.lib.insights.burnup import get_appropriate_burnup_data
from api.lib.insights.helpers import calculate_date_range, get_help_topics
from api.lib.insights.metrics import get_daily_activities, get_effort_distribution, get_performance_metrics, get_process_metrics
from api.lib.insights.progress import get_quarterly_progress, get_weekly_progress
from api.lib.insights.timeline import get_user_timeline_data
from api.schemas.insights import SchemaInsightRequest as InsightRequest
from api.schemas.insights import SchemaInsightResponse as InsightResponse
from api.security import get_current_user
from db.database import get_db
from db.models import User

# Configure logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/insights", tags=["insights"])

@router.get("/health", include_in_schema=True, response_model=Dict[str, Any])
async def health_check_insights():
    """Health check for the insights router."""
    from api.utils import check_router_health

    health_data = check_router_health("insights")
    return health_data


@router.post("/test")
async def test_insights(request: InsightRequest, db: Session = Depends(get_db)):
    """Test endpoint for insights data that doesn't require authentication."""
    try:
        # Removed debug logging

        # Use a default user for testing
        test_user = db.query(User).first()
        if not test_user:
            # Return empty response if no user found
            response_data = InsightResponse(
                coreMetrics=[],
                weeklyProgress=None,
                quarterlyProgress=None,
                dailyActivities=[],
                activeProcesses=[],
                completedProcesses=[],
                tagDistribution=[],
                effortDistribution=[],
                helpTopics=get_help_topics(),
                dailyBurnup=[],
                quarterlyBurnup=[],
            )
            return response_data

        user_id = str(test_user.id)
        insights_data = get_insights_data(request, user_id, db)
        return insights_data

    except Exception as e:
        logger.error(f"Error retrieving test insights: {str(e)}")
        logger.error(f"Request data: {request.model_dump() if hasattr(request, 'model_dump') else 'Request data not available'}")
        # Return empty data if an error occurs
        return InsightResponse(
            coreMetrics=[],
            weeklyProgress=None,
            quarterlyProgress=None,
            dailyActivities=[],
            activeProcesses=[],
            completedProcesses=[],
            tagDistribution=[],
            effortDistribution=[],
            helpTopics=get_help_topics(),
            dailyBurnup=[],
            quarterlyBurnup=[]
        )


@router.get("/timeline")
async def get_user_timeline(current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get timeline data for the user profile."""
    try:
        timeline_data = get_user_timeline_data(db, str(current_user.id))
        return timeline_data
    except Exception as e:
        logger.error(f"Error retrieving timeline data: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve timeline data: {str(e)}")


# Redirect methods for backwards compatibility
@router.get("/reports")
async def get_user_reports_redirect():
    """Redirect to the new reports endpoint."""
    raise HTTPException(
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        headers={"Location": "/reports"},
        detail="This endpoint has moved to /reports"
    )


@router.get("/reports/me")
async def get_user_reports_me_redirect():
    """Redirect to the new reports/me endpoint."""
    raise HTTPException(
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        headers={"Location": "/reports/me"},
        detail="This endpoint has moved to /reports/me"
    )


@router.post("")
async def get_insights(request: InsightRequest, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get user insights for performance dashboard."""
    try:
        # Removed debug logging
        return get_insights_data(request, current_user.id, db)
    except Exception as e:
        logger.error(f"Error retrieving insights: {str(e)}")
        logger.error(f"Request data: {request.model_dump() if hasattr(request, 'model_dump') else 'Request data not available'}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve insights: {str(e)}")


def get_insights_data(request: InsightRequest, user_id, db: Session) -> InsightResponse:
    """Common function to get insights data for both authenticated and test endpoints."""
    try:
        # Calculate date ranges based on the requested time frame
        start_date, end_date = calculate_date_range(request)

        # Format date strings for queries
        start_date_str = start_date.isoformat()
        end_date_str = end_date.isoformat()
    except Exception as e:
        logger.error(f"Error in get_insights_data preparation: {str(e)}")
        # Use default values for date range if there's an error
        from datetime import datetime, timedelta
        today = datetime.now().date()
        start_date = today - timedelta(days=7)
        end_date = today
        start_date_str = start_date.isoformat()
        end_date_str = end_date.isoformat()

    # Get performance metrics
    core_metrics = get_performance_metrics(db, user_id, start_date_str, end_date_str)

    # Get process metrics for active and completed processes
    active_processes = get_process_metrics(db, user_id, start_date_str, end_date_str, is_completed=False)
    completed_processes = get_process_metrics(db, user_id, start_date_str, end_date_str, is_completed=True)

    # Tag distribution removed
    tag_distribution = []

    # Get effort distribution by status category
    effort_distribution = get_effort_distribution(db, user_id, start_date_str, end_date_str)

    # Get daily activities
    daily_activities = get_daily_activities(db, user_id, start_date, end_date)

    # Get weekly progress
    weekly_progress = get_weekly_progress(db, user_id, start_date, end_date)

    # If weekly_progress is None, create a default one to satisfy schema requirements
    if weekly_progress is None:
        from api.schemas.insights import SchemaWeeklyProgress as WeeklyProgress
        week_number = start_date.isocalendar()[1]
        weekly_progress = WeeklyProgress(
            week=f"Week {week_number}",
            startDate=start_date.isoformat(),
            endDate=end_date.isoformat(),
            eventsCompleted=0,
            stepsCompleted=0,
            totalTimeSpent=0,
            efficiency=0,
            progress=0,
        )

    # Get quarterly progress structure depending on time frame
    time_frame = request.timeFrame
    quarterly_progress = get_quarterly_progress(db, user_id, time_frame, start_date, end_date, core_metrics)

    # If quarterly_progress is None, create a default one to satisfy schema requirements
    if quarterly_progress is None:
        from api.schemas.insights import SchemaQuarterlyProgress as QuarterlyProgress
        quarter = ((start_date.month - 1) // 3) + 1
        quarterly_progress = QuarterlyProgress(
            quarter=f"Q{quarter} {start_date.year}",
            startDate=start_date.isoformat(),
            endDate=end_date.isoformat(),
            eventsCompleted=0,
            stepsCompleted=0,
            totalTimeSpent=0,
            efficiency=0,
            progress=0,
            weeks=[]
        )

    # Get burnup data (daily or quarterly based on time frame)
    daily_burnup, quarterly_burnup = get_appropriate_burnup_data(db, user_id, time_frame, start_date, end_date)

    # Get help topics
    help_topics = get_help_topics()

    # Return the complete insight response with camelCase field names
    return InsightResponse(
        coreMetrics=core_metrics,
        weeklyProgress=weekly_progress,
        quarterlyProgress=quarterly_progress,
        dailyActivities=daily_activities,
        activeProcesses=active_processes,
        completedProcesses=completed_processes,
        tagDistribution=tag_distribution,
        effortDistribution=effort_distribution,
        helpTopics=help_topics,
        dailyBurnup=daily_burnup,
        quarterlyBurnup=quarterly_burnup,
    )
