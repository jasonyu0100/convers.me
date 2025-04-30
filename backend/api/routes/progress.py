"""Progress routes for the API."""

import logging
from typing import Annotated, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.lib.insights.burnup import get_daily_burnup
from api.lib.insights.helpers import calculate_date_range
from api.lib.insights.metrics import get_daily_activities, get_effort_distribution, get_performance_metrics, get_process_metrics
from api.lib.insights.progress import get_weekly_progress
from api.lib.insights.timeline import get_user_timeline_data
from api.schemas.progress import SchemaProgressRequest as ProgressRequest
from api.schemas.progress import SchemaProgressResponse as ProgressResponse
from api.schemas.progress import SchemaQuarterlyProgress as QuarterlyProgress
from api.schemas.progress import SchemaWeeklyProgress as WeeklyProgress
from api.security import get_current_user
from db.database import get_db
from db.models import User

# Configure logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/progress", tags=["progress"])

@router.get("/health", include_in_schema=True, response_model=Dict[str, Any])
async def health_check_progress():
    """Health check for the progress router."""
    from api.utils import check_router_health

    health_data = check_router_health("progress")
    return health_data


@router.post("/test")
async def test_progress(request: ProgressRequest, db: Session = Depends(get_db)):
    """Test endpoint for progress data that doesn't require authentication."""
    try:
        # Use a default user for testing
        test_user = db.query(User).first()
        if not test_user:
            # Return empty response if no user found
            response_data = ProgressResponse(
                coreMetrics=[],
                weeklyProgress=None,
                quarterlyProgress=None,
                dailyActivities=[],
                activeProcesses=[],
                completedProcesses=[],
                tagDistribution=[],
                effortDistribution=[],
                dailyBurnup=[],
                quarterlyBurnup=[],
            )
            return response_data

        user_id = str(test_user.id)
        progress_data = get_progress_data(request, user_id, db)
        return progress_data

    except Exception as e:
        logger.error(f"Error retrieving test progress: {str(e)}")
        logger.error(f"Request data: {request.model_dump() if hasattr(request, 'model_dump') else 'Request data not available'}")
        # Return empty data if an error occurs
        return ProgressResponse(
            coreMetrics=[],
            weeklyProgress=None,
            quarterlyProgress=None,
            dailyActivities=[],
            activeProcesses=[],
            completedProcesses=[],
            tagDistribution=[],
            effortDistribution=[],
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


@router.post("")
async def get_progress(request: ProgressRequest, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get user progress data for performance dashboard."""
    try:
        return get_progress_data(request, current_user.id, db)
    except Exception as e:
        logger.error(f"Error retrieving progress: {str(e)}")
        logger.error(f"Request data: {request.model_dump() if hasattr(request, 'model_dump') else 'Request data not available'}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve progress: {str(e)}")


def get_progress_data(request: ProgressRequest, user_id, db: Session) -> ProgressResponse:
    """Common function to get progress data for both authenticated and test endpoints."""
    try:
        # Calculate date ranges based on the requested time frame
        start_date, end_date = calculate_date_range(request)

        # Format date strings for queries
        start_date_str = start_date.isoformat()
        end_date_str = end_date.isoformat()
    except Exception as e:
        logger.error(f"Error in get_progress_data preparation: {str(e)}")
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

    # Create a minimal quarterly progress structure for schema compatibility
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

    # Get daily burnup data only (simplified)
    daily_burnup = get_daily_burnup(db, user_id, start_date, end_date)
    quarterly_burnup = []  # Empty array for compatibility

    # Return the complete progress response with camelCase field names
    return ProgressResponse(
        coreMetrics=core_metrics,
        weeklyProgress=weekly_progress,
        quarterlyProgress=quarterly_progress,
        dailyActivities=daily_activities,
        activeProcesses=active_processes,
        completedProcesses=completed_processes,
        tagDistribution=tag_distribution,
        effortDistribution=effort_distribution,
        dailyBurnup=daily_burnup,
        quarterlyBurnup=quarterly_burnup,
    )
