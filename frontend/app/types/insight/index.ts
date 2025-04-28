/**
 * Performance metrics and data types
 */

/**
 * Time frame selection options
 */
export type TimeFrameType = 'week' | 'month' | 'quarter' | 'year' | 'custom';

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
 * Available performance dashboard tabs
 */
export type PerformanceTabType = 'kpi' | 'work' | 'time' | 'effort' | 'help';

export interface HelpTopic {
  term: string;
  description: string;
  category: 'kpi' | 'work' | 'time' | 'effort' | 'general';
}

export interface DailyBurnup {
  day: string;
  date: string;
  progress: number;
}

export interface WeeklyBurnup {
  week: string;
  progress: number;
}

export interface PerformanceContextType {
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

  // Help topics
  helpTopics: HelpTopic[];

  // Time period
  selectedTimeFrame: TimeFrameType;
  setSelectedTimeFrame: (timeFrame: TimeFrameType) => void;

  // Tab selection
  selectedTab: PerformanceTabType;
  setSelectedTab: (tab: PerformanceTabType) => void;

  // Filter
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
}
