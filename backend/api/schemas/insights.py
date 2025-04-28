"""Insight schemas for the API."""

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import Field

from api.schemas.base import APIBaseModel


class SchemaTimeFrameType(str, Enum):
    """Time frame type enum."""

    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"
    CUSTOM = "custom"


class SchemaPerformanceTabType(str, Enum):
    """Performance tab type enum."""

    KPI = "kpi"
    WORK = "work"
    TIME = "time"
    EFFORT = "effort"
    HELP = "help"


class SchemaPerformanceMetric(APIBaseModel):
    """Performance metric schema."""

    id: str
    name: str
    value: float
    unit: str
    change: float
    isPositive: bool
    color: Optional[str] = None  # Optional color name for styling metrics (blue, green, etc.)
    insightMetadata: Optional[Dict[str, Any]] = Field(default=None)


class SchemaProcessMetric(APIBaseModel):
    """Process metric schema."""

    id: str
    name: str
    completedSteps: int = Field()
    totalSteps: int = Field()
    timeSpent: int = Field()  # In minutes
    complexity: int  # 1-5 scale
    lastActivity: str = Field()  # ISO date
    progress: int  # 0-100%
    insightMetadata: Optional[Dict[str, Any]] = Field(default=None)



class SchemaDailyActivity(APIBaseModel):
    """Daily activity schema."""

    day: str
    date: str
    eventsCompleted: int = Field()
    stepsCompleted: int = Field()
    timeSpent: int = Field()  # In minutes
    efficiency: int  # 0-100%


class SchemaWeeklyProgress(APIBaseModel):
    """Weekly progress schema."""

    week: str
    startDate: str = Field()
    endDate: str = Field()
    eventsCompleted: int = Field()
    stepsCompleted: int = Field()
    totalTimeSpent: int = Field()
    efficiency: int
    progress: int  # 0-100%


class SchemaQuarterlyProgress(APIBaseModel):
    """Quarterly progress schema."""

    quarter: str
    startDate: str = Field()
    endDate: str = Field()
    eventsCompleted: int = Field()
    stepsCompleted: int = Field()
    totalTimeSpent: int = Field()
    efficiency: int
    progress: int  # 0-100%
    weeks: List[SchemaWeeklyProgress]


class SchemaEffortMetric(APIBaseModel):
    """Effort metric schema."""

    category: str
    value: int
    total: int
    percentage: float
    color: str


class SchemaHelpTopic(APIBaseModel):
    """Help topic schema."""

    term: str
    description: str
    category: str  # 'kpi', 'work', 'time', 'effort', 'general'


class SchemaDailyBurnup(APIBaseModel):
    """Daily burnup schema."""

    day: str
    date: str
    progress: int


class SchemaWeeklyBurnup(APIBaseModel):
    """Weekly burnup schema."""

    week: str
    progress: int


class SchemaInsightResponse(APIBaseModel):
    """Insight response schema."""

    coreMetrics: List[SchemaPerformanceMetric] = Field()
    weeklyProgress: SchemaWeeklyProgress = Field()
    quarterlyProgress: SchemaQuarterlyProgress = Field()
    dailyActivities: List[SchemaDailyActivity] = Field()
    activeProcesses: List[SchemaProcessMetric] = Field()
    completedProcesses: List[SchemaProcessMetric] = Field()
    tagDistribution: List[Dict[str, Any]] = Field(default_factory=list)
    effortDistribution: List[SchemaEffortMetric] = Field()
    helpTopics: List[SchemaHelpTopic] = Field()
    dailyBurnup: List[SchemaDailyBurnup] = Field()
    quarterlyBurnup: List[SchemaWeeklyBurnup] = Field()
    insightMetadata: Optional[Dict[str, Any]] = Field(default=None)


class SchemaInsightRequest(APIBaseModel):
    """Insight request schema."""

    timeFrame: SchemaTimeFrameType = Field(default=SchemaTimeFrameType.WEEK)
    tab: Optional[SchemaPerformanceTabType] = None
    tag: Optional[str] = None
    startDate: Optional[str] = Field(default=None)
    endDate: Optional[str] = Field(default=None)


class SchemaReportItem(APIBaseModel):
    """Report item schema."""

    id: str
    title: str
    description: Optional[str] = None
    fileUrl: str = Field()
    reportType: str = Field()
    dateRange: Optional[str] = Field(default=None)
    size: Optional[int] = None
    createdAt: str = Field()
    reportMetadata: Optional[Dict[str, Any]] = Field(default=None)


class SchemaReportResponse(APIBaseModel):
    """Reports response schema."""

    currentQuarterReport: Optional[SchemaReportItem] = Field(default=None)
    weeklyReports: List[SchemaReportItem] = Field(default_factory=list)
