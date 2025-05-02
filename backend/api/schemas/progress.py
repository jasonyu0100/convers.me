"""Progress schemas for the API."""

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import Field

from api.schemas.base import APIBaseModel


class SchemaTimeFrameType(str, Enum):
    """Time frame type enum (simplified to only support weekly view)."""

    WEEK = "week"


class SchemaProgressTabType(str, Enum):
    """Progress tab type enum."""

    PROGRESS = "progress"
    TIME = "time"
    EFFORT = "effort"
    GOALS = "goals"


class SchemaPerformanceMetric(APIBaseModel):
    """Performance metric schema."""

    id: str
    name: str
    value: float
    unit: str
    change: float
    isPositive: bool
    color: Optional[str] = None  # Optional color name for styling metrics (blue, green, etc.)
    progressMetadata: Optional[Dict[str, Any]] = Field(default=None)


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
    progressMetadata: Optional[Dict[str, Any]] = Field(default=None)


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


class SchemaDailyBurnup(APIBaseModel):
    """Daily burnup schema."""

    day: str
    date: str
    progress: int


class SchemaWeeklyBurnup(APIBaseModel):
    """Weekly burnup schema."""

    week: str
    progress: int


class SchemaGoal(APIBaseModel):
    """Simple goal schema."""

    id: str
    text: str
    createdAt: str  # ISO date
    active: bool


class SchemaGoalEvaluation(APIBaseModel):
    """Goal evaluation schema."""

    goalId: str
    weekOf: str  # ISO date of week start
    score: int  # 0-10 adherence score
    comment: str


class SchemaProgressResponse(APIBaseModel):
    """Progress response schema."""

    coreMetrics: List[SchemaPerformanceMetric] = Field()
    weeklyProgress: SchemaWeeklyProgress = Field()
    quarterlyProgress: SchemaQuarterlyProgress = Field()
    dailyActivities: List[SchemaDailyActivity] = Field()
    activeProcesses: List[SchemaProcessMetric] = Field()
    completedProcesses: List[SchemaProcessMetric] = Field()
    tagDistribution: List[Dict[str, Any]] = Field(default_factory=list)
    effortDistribution: List[SchemaEffortMetric] = Field()
    dailyBurnup: List[SchemaDailyBurnup] = Field()
    quarterlyBurnup: List[SchemaWeeklyBurnup] = Field()
    goals: List[SchemaGoal] = Field(default_factory=list)
    goalEvaluations: List[SchemaGoalEvaluation] = Field(default_factory=list)
    progressMetadata: Optional[Dict[str, Any]] = Field(default=None)


class SchemaProgressRequest(APIBaseModel):
    """Progress request schema."""

    timeFrame: SchemaTimeFrameType = Field(default=SchemaTimeFrameType.WEEK)
    tab: Optional[SchemaProgressTabType] = None
    tag: Optional[str] = None
    startDate: Optional[str] = Field(default=None)
    endDate: Optional[str] = Field(default=None)
