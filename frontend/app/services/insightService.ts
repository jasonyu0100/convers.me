/**
 * Insight service for retrieving performance metrics and visualizations
 * This service uses Axios for API requests
 */

import { ApiClient, ApiResult } from './api';
import { Report, ReportsResponse } from '../components/side-panel/insight/types';

// Types for insight data
import {
  DailyActivity,
  DailyBurnup,
  EffortMetric,
  PerformanceContextType,
  PerformanceMetric,
  PerformanceTabType,
  ProcessMetric,
  QuarterlyProgress,
  TagDistribution,
  TimeFrameType,
  WeeklyBurnup,
  WeeklyProgress,
} from '../types/insight';

/**
 * Request parameters for retrieving insights
 */
interface InsightRequestParams {
  timeFrame?: TimeFrameType;
  tab?: PerformanceTabType;
  tag?: string | null;
  startDate?: string;
  endDate?: string;
  dataTypes?: string;
}

// Type for insight response data
interface InsightResponseData {
  coreMetrics: PerformanceMetric[];
  weeklyProgress: WeeklyProgress;
  quarterlyProgress: QuarterlyProgress;
  dailyActivities: DailyActivity[];
  activeProcesses: ProcessMetric[];
  completedProcesses: ProcessMetric[];
  tagDistribution: TagDistribution[];
  effortDistribution: EffortMetric[];
  helpTopics: any[];
  dailyBurnup: DailyBurnup[];
  quarterlyBurnup: WeeklyBurnup[];
}

/**
 * Service for retrieving insight data from the API
 */
export const InsightService = {
  /**
   * Get insights data from the API
   * @param params - Request parameters
   * @returns Promise with API result containing insight data
   */
  async getInsights(params: InsightRequestParams = {}): Promise {
    try {
      // Make a real API call to the backend
      const response = await ApiClient.post<any>('/insights', {
        time_frame: params.timeFrame || 'week',
        tab: params.tab,
        tag: params.tag || null,
        start_date: params.startDate,
        end_date: params.endDate,
        data_types: params.dataTypes || 'all',
      });

      if (response.data) {
        // Map API response to frontend data structure
        // and handle camelCase vs snake_case conversion
        const transformDailyActivities = (items: any[] = []): DailyActivity[] => {
          return items.map((item) => ({
            day: item.day || '',
            date: item.date || '',
            eventsCompleted: item.events_completed || 0,
            stepsCompleted: item.steps_completed || 0,
            timeSpent: item.time_spent || 0,
            efficiency: item.efficiency || 0,
          }));
        };

        const transformWeeklyProgress = (item: any = {}): WeeklyProgress => {
          return {
            week: item.week || '',
            startDate: item.start_date || '',
            endDate: item.end_date || '',
            eventsCompleted: item.events_completed || 0,
            stepsCompleted: item.steps_completed || 0,
            totalTimeSpent: item.total_time_spent || 0,
            efficiency: item.efficiency || 0,
            progress: item.progress || 0,
          };
        };

        const transformProcessMetrics = (items: any[] = []): ProcessMetric[] => {
          return items.map((item) => ({
            id: item.id || '',
            name: item.name || '',
            completedSteps: item.completed_steps || 0,
            totalSteps: item.total_steps || 0,
            timeSpent: item.time_spent || 0,
            complexity: item.complexity || 0,
            lastActivity: item.last_activity || '',
            progress: item.progress || 0,
          }));
        };

        // Create the transformed data structure
        const transformedData: InsightResponseData = {
          coreMetrics: (response.data.core_metrics || []).map((metric: any) => ({
            id: metric.id || '',
            name: metric.name || '',
            value: metric.value || 0,
            unit: metric.unit || '',
            change: metric.change || 0,
            isPositive: metric.is_positive || false,
          })),
          weeklyProgress: transformWeeklyProgress(response.data.weekly_progress),
          quarterlyProgress: {
            quarter: response.data.quarterly_progress?.quarter || '',
            startDate: response.data.quarterly_progress?.start_date || '',
            endDate: response.data.quarterly_progress?.end_date || '',
            eventsCompleted: response.data.quarterly_progress?.events_completed || 0,
            stepsCompleted: response.data.quarterly_progress?.steps_completed || 0,
            totalTimeSpent: response.data.quarterly_progress?.total_time_spent || 0,
            efficiency: response.data.quarterly_progress?.efficiency || 0,
            progress: response.data.quarterly_progress?.progress || 0,
            weeks: (response.data.quarterly_progress?.weeks || []).map(transformWeeklyProgress),
          },
          dailyActivities: transformDailyActivities(response.data.daily_activities),
          activeProcesses: transformProcessMetrics(response.data.active_processes),
          completedProcesses: transformProcessMetrics(response.data.completed_processes),
          tagDistribution: (response.data.tag_distribution || []).map((tag: any) => ({
            tag: tag.tag || '',
            count: tag.count || 0,
            percentage: tag.percentage || 0,
            color: tag.color || 'bg-gray-500',
          })),
          effortDistribution: (response.data.effort_distribution || []).map((effort: any) => ({
            category: effort.category || '',
            value: effort.value || 0,
            total: effort.total || 0,
            percentage: effort.percentage || 0,
            color: effort.color || 'bg-gray-500',
          })),
          helpTopics: response.data.help_topics || [],
          dailyBurnup: (response.data.daily_burnup || []).map((day: any) => ({
            day: day.day || '',
            date: day.date || '',
            progress: day.progress || 0,
          })),
          quarterlyBurnup: (response.data.quarterly_burnup || []).map((week: any) => ({
            week: week.week || '',
            progress: week.progress || 0,
          })),
        };

        return {
          data: transformedData,
          status: response.status,
        };
      }

      // Return default data structure if no data is returned
      return {
        data: this._getDefaultInsightData(),
        status: response.status || 200,
      };
    } catch (error) {
      console.error('Error fetching insights:', error);

      // Return default data on error to prevent UI breakage
      return {
        data: this._getDefaultInsightData(),
        error: 'Failed to retrieve insights data',
        status: 200, // Use 200 to prevent UI from showing error state
      };
    }
  },

  /**
   * Get detailed performance metrics for a specific insight
   * @param insightId - ID of the insight to retrieve
   * @returns Promise with API result containing detailed metrics
   */
  async getInsightDetail(insightId: string): Promise {
    try {
      // Make a real API call to the backend
      const response = await ApiClient.get<any>(`/insights/${insightId}`);

      if (response.data) {
        return {
          data: response.data,
          status: response.status,
        };
      }

      return {
        error: 'No data received from API',
        status: response.status || 404,
      };
    } catch (error) {
      console.error('Error fetching insight detail:', error);
      return {
        error: 'Failed to retrieve insight detail',
        status: 500,
      };
    }
  },

  /**
   * Fetch user reports for insights
   * @returns Promise with API result containing reports data
   */
  async getUserReports(): Promise {
    try {
      // Use the new dedicated reports endpoint
      const response = await ApiClient.get<ReportsResponse>('/reports');

      if (response.data) {
        return {
          data: response.data,
          status: response.status,
        };
      }

      return {
        data: { currentQuarterReport: null, weeklyReports: [] },
        status: response.status || 200,
      };
    } catch (error) {
      console.error('Error fetching user reports:', error);
      return {
        data: { currentQuarterReport: null, weeklyReports: [] },
        error: 'Failed to retrieve reports data',
        status: 200, // Use 200 to prevent UI from showing error state
      };
    }
  },

  _getDefaultInsightData(): InsightResponseData {
    const emptyWeeklyProgress: WeeklyProgress = {
      week: '',
      startDate: '',
      endDate: '',
      eventsCompleted: 0,
      stepsCompleted: 0,
      totalTimeSpent: 0,
      efficiency: 0,
      progress: 0,
    };

    return {
      coreMetrics: [],
      weeklyProgress: emptyWeeklyProgress,
      quarterlyProgress: {
        quarter: '',
        startDate: '',
        endDate: '',
        eventsCompleted: 0,
        stepsCompleted: 0,
        totalTimeSpent: 0,
        efficiency: 0,
        progress: 0,
        weeks: [],
      },
      dailyActivities: [],
      activeProcesses: [],
      completedProcesses: [],
      tagDistribution: [],
      effortDistribution: [],
      helpTopics: [],
      dailyBurnup: [],
      quarterlyBurnup: [],
    };
  },
};
