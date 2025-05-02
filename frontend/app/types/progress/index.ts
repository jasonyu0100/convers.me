/**
 * Progress metrics and data types
 */

/**
 * Time frame selection options (simplified to only support weekly view)
 */
export type TimeFrameType = 'week';

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  isPositive: boolean;
  color?: string; // Optional color for the metric (blue, green, etc.)
}

export interface ProcessMetric {
  id: string;
  name: string;
  completedSteps: number;
  totalSteps: number;
  timeSpent: number; // In minutes
  complexity: number; // 1-5 scale
  lastActivity: string; // ISO date
  progress: number; // 0-100%
}

export interface DailyActivity {
  day: string;
  date: string;
  eventsCompleted: number;
  stepsCompleted: number;
  timeSpent: number; // In minutes
  efficiency: number; // 0-100%
}

export interface WeeklyProgress {
  week: string;
  startDate: string;
  endDate: string;
  eventsCompleted: number;
  stepsCompleted: number;
  totalTimeSpent: number;
  efficiency: number;
  progress: number; // 0-100%
}

export interface QuarterlyProgress {
  quarter: string;
  startDate: string;
  endDate: string;
  eventsCompleted: number;
  stepsCompleted: number;
  totalTimeSpent: number;
  efficiency: number;
  progress: number; // 0-100%
  weeks: WeeklyProgress[];
}

export interface EffortMetric {
  category: string;
  value: number;
  total: number;
  percentage: number;
  color: string;
}

/**
 * Available progress dashboard tabs
 */
export type ProgressTabType = 'progress' | 'time' | 'effort' | 'goals';

export interface DailyBurnup {
  day: string;
  date: string;
  progress: number;
}

export interface WeeklyBurnup {
  week: string;
  progress: number;
}

/**
 * Simple goal type for user's text-based goals with LLM evaluation
 */
export interface Goal {
  id: string;
  text: string; // The goal text as entered by the user
  createdAt: string; // ISO date
  active: boolean; // Whether the goal is currently active
}

/**
 * LLM Evaluation of a goal
 */
export interface GoalEvaluation {
  goalId: string;
  weekOf: string; // ISO date of week start
  score: number; // 0-10 adherence score
  comment: string; // LLM's comment on goal adherence
}

export interface ProgressContextType {
  // State management
  isLoading?: boolean;
  error?: string | null;
  clearError?: () => void;

  // Core metrics
  coreMetrics: PerformanceMetric[];
  weeklyProgress: WeeklyProgress;
  quarterlyProgress: QuarterlyProgress;
  dailyActivities: DailyActivity[];

  // Process metrics
  activeProcesses: ProcessMetric[];
  completedProcesses: ProcessMetric[];

  // Distribution data
  tagDistribution: any[]; // Type removed
  effortDistribution: EffortMetric[];

  // Chart data
  dailyBurnup?: DailyBurnup[];
  quarterlyBurnup?: WeeklyBurnup[];

  // Time period (fixed to weekly)
  selectedTimeFrame: TimeFrameType;

  // Tab selection
  selectedTab: ProgressTabType;
  setSelectedTab: (tab: ProgressTabType) => void;

  // Filter
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
}
