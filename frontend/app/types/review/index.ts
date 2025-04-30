/**
 * Knowledge Base Types
 *
 * This file contains types for the knowledge base feature that tracks daily and weekly
 * progress based on events and processes with performance insights.
 */

import { BaseEntity, StepEntity } from '../entities';
import { DailyActivity, PerformanceMetric, ProcessMetric, WeeklyProgress } from '../insight';

/**
 * Knowledge entry time frame type
 */
export type KnowledgeTimeFrameType = 'day' | 'week' | 'month';

/**
 * Knowledge entry categories
 */
export type KnowledgeCategoryType = 'summary' | 'insight' | 'recommendation' | 'achievement' | 'learning';

/**
 * Base knowledge entry interface
 */
export interface KnowledgeEntry extends BaseEntity {
  title: string;
  content: string;
  timeFrame: KnowledgeTimeFrameType;
  category: KnowledgeCategoryType;
  date: string; // ISO date string
  userId: string;
  tags?: string[];
  metadata?: Record;
  sourceType?: 'event' | 'process' | 'insight' | 'ai';
  sourceId?: string;
}

/**
 * Daily summary interface for knowledge base
 */
export interface DailySummary extends KnowledgeEntry {
  timeFrame: 'day';
  activities?: DailyActivity;
  completedEvents?: number;
  completedSteps?: number;
  performanceScore?: number;
}

/**
 * Weekly summary interface for knowledge base
 */
export interface WeeklySummary extends KnowledgeEntry {
  timeFrame: 'week';
  weekProgress?: WeeklyProgress;
  topProcesses?: ProcessMetric[];
  keyMetrics?: PerformanceMetric[];
  achievements?: string[];
}

/**
 * AI-generated recommendation
 */
export interface KnowledgeRecommendation extends KnowledgeEntry {
  category: 'recommendation';
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  dueDate?: string;
  relatedSteps?: StepEntity[];
}

/**
 * Knowledge base filters for API requests
 */
export interface ReviewFilters {
  startDate?: string;
  endDate?: string;
  category?: KnowledgeCategoryType;
  timeFrame?: KnowledgeTimeFrameType;
  tags?: string[];
  sourceType?: string;
  limit?: number;
  offset?: number;
}

/**
 * Knowledge base context type for React context
 */
export interface ReviewContextType {
  // State
  isLoading: boolean;
  error: string | null;
  clearError: () => void;

  // Data
  entries: KnowledgeEntry[];
  dailySummaries: DailySummary[];
  weeklySummaries: WeeklySummary[];
  recommendations: KnowledgeRecommendation[];

  // Current selection
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedTimeFrame: KnowledgeTimeFrameType;
  setSelectedTimeFrame: (timeFrame: KnowledgeTimeFrameType) => void;
  selectedCategory?: KnowledgeCategoryType;
  setSelectedCategory: (category?: KnowledgeCategoryType) => void;

  // Filters
  filters: ReviewFilters;
  setFilters: (filters: ReviewFilters) => void;

  // Actions
  refreshData: () => Promise;
  getEntryById: (id: string) => KnowledgeEntry | undefined;
}
