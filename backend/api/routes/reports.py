"""Reports API router."""

import logging
from typing import Annotated, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.schemas.insights import SchemaReportItem, SchemaReportResponse
from api.security import get_current_user
from db.database import get_db
from db.models import Report, User

# Configure logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/health", include_in_schema=True, response_model=Dict)
async def health_check_reports():
    """Health check for the reports router."""
    from api.utils import check_router_health

    health_data = check_router_health("reports")
    return health_data

@router.get("", response_model=SchemaReportResponse)
async def get_user_reports(current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get reports for the current user."""
    try:
        # Get user's reports
        reports = db.query(Report).filter(Report.user_id == current_user.id).order_by(Report.created_at.desc()).all()

        if not reports:
            # No reports found
            return SchemaReportResponse(currentQuarterReport=None, weeklyReports=[])

        # Get latest quarterly report
        quarterly_report = (
            db.query(Report).filter(Report.user_id == current_user.id, Report.report_type == "quarterly").order_by(Report.created_at.desc()).first()
        )

        # Get weekly reports
        weekly_reports = db.query(Report).filter(Report.user_id == current_user.id, Report.report_type == "weekly").order_by(Report.created_at.desc()).all()

        # Convert to response schema using to_dict() method first
        return SchemaReportResponse(
            currentQuarterReport=SchemaReportItem(**quarterly_report.to_dict()) if quarterly_report else None,
            weeklyReports=[SchemaReportItem(**report.to_dict()) for report in weekly_reports]
        )
    except Exception as e:
        logger.error(f"Error retrieving user reports: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve reports: {str(e)}")

@router.get("/me", response_model=List[Dict])
async def get_current_user_reports(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    year: Optional[int] = None,
    quarter: Optional[int] = None,
    week: Optional[int] = None,
    report_type: Optional[str] = None,
):
    """Get reports filtered for the current user, with optional time period filtering."""
    try:
        # Base query for user's reports
        query = db.query(Report).filter(Report.user_id == current_user.id)

        # Apply filters if provided
        if report_type:
            query = query.filter(Report.report_type == report_type)

        # Apply metadata filters if provided
        if year or quarter or week:
            # We need to filter on report_metadata fields
            # This requires PostgreSQL JSONB filtering
            if year:
                query = query.filter(Report.report_metadata.contains({"year": year}))
            if quarter:
                query = query.filter(Report.report_metadata.contains({"quarter": quarter}))
            if week:
                query = query.filter(Report.report_metadata.contains({"week": week}))

        # Always order by most recent first
        reports = query.order_by(Report.created_at.desc()).all()

        if not reports:
            # No reports found
            return []

        # Format reports for the response (with proper field casing)
        result = []
        for report in reports:
            # Convert each report to dictionary with appropriate field names
            report_dict = report.to_dict()

            # Extract metadata values if they exist
            metadata = report.report_metadata or {}
            if not year and "year" in metadata:
                report_dict["year"] = metadata["year"]
            if not quarter and "quarter" in metadata:
                report_dict["quarter"] = metadata["quarter"]
            if not week and "week" in metadata:
                report_dict["week"] = metadata["week"]

            result.append(report_dict)

        return result
    except Exception as e:
        logger.error(f"Error retrieving user reports: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve reports: {str(e)}")
