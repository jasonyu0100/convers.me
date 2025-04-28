'use client';

import { createRouteContext } from '@/app/components/router/createRouteContext';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import { InsightService } from '@/app/services/insightService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
  DailyActivity,
  DailyBurnup,
  EffortMetric,
  HelpTopic,
  PerformanceContextType,
  PerformanceMetric,
  PerformanceTabType,
  ProcessMetric,
  QuarterlyProgress,
  TimeFrameType,
  WeeklyBurnup,
  WeeklyProgress,
} from '../../../types/insight';

// Create the context using the standardized factory function
// Using empty arrays for initial data instead of mock data
const { Provider, useRouteContext } = createRouteContext<PerformanceContextType>('Insight', {
  coreMetrics: [] as PerformanceMetric[],
  weeklyProgress: {} as WeeklyProgress,
  quarterlyProgress: {} as QuarterlyProgress,
  dailyActivities: [] as DailyActivity[],
  activeProcesses: [] as ProcessMetric[],
  completedProcesses: [] as ProcessMetric[],
  tagDistribution: [] as any[], // TagDistribution type removed
  effortDistribution: [] as EffortMetric[],
  helpTopics: [] as HelpTopic[],
  dailyBurnup: [] as DailyBurnup[],
  quarterlyBurnup: [] as WeeklyBurnup[],
  selectedTimeFrame: 'week',
  setSelectedTimeFrame: () => {},
  selectedTab: 'kpi',
  setSelectedTab: () => {},
  selectedTag: null,
  setSelectedTag: () => {},
});

/**
 * Performance context provider component
 */
export function InsightProvider({ children }: { children: React.ReactNode }) {
  // Add standardized error handling
  const { error, handleError, clearError } = useRouteComponent();
  const queryClient = useQueryClient();

  // Time frame selection
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrameType>('week');

  // Tab selection
  const [selectedTab, setSelectedTab] = useState<PerformanceTabType>('kpi');

  // Tag filter
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Data state with default empty values
  const emptyInsightData = {
    coreMetrics: [],
    weeklyProgress: {} as WeeklyProgress,
    quarterlyProgress: {} as QuarterlyProgress,
    dailyActivities: [],
    activeProcesses: [],
    completedProcesses: [],
    tagDistribution: [],
    effortDistribution: [],
    helpTopics: [],
    dailyBurnup: [],
    quarterlyBurnup: [],
  };

  // Fetch insights data using React Query
  const { data: insightData = emptyInsightData, isLoading } = useQuery({
    queryKey: ['insights', selectedTimeFrame, selectedTab, selectedTag],
    queryFn: async () => {
      const response = await InsightService.getInsights({
        timeFrame: selectedTimeFrame,
        tab: selectedTab,
        tag: selectedTag,
      });

      if (response.error) {
        console.error('API error:', response.error);
        throw new Error(response.error);
      }

      if (response.data) {
        return response.data;
      }

      return emptyInsightData;
    },
    onError: (error) => {
      console.error('Error fetching insights:', error);
      handleError(error);
    },
  });

  // Tab selection with error handling
  const handleSelectTab = useCallback(
    (tab: PerformanceTabType) => {
      try {
        setSelectedTab(tab);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  // Time frame selection with error handling
  const handleTimeFrameChange = useCallback(
    (timeFrame: TimeFrameType) => {
      try {
        setSelectedTimeFrame(timeFrame);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  // Tag selection with error handling
  const handleTagSelection = useCallback(
    (tag: string | null) => {
      try {
        setSelectedTag(tag);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  // Context value
  const contextValue: PerformanceContextType = {
    // State
    isLoading,
    error,
    clearError,

    // Core metrics
    coreMetrics: insightData.coreMetrics,
    weeklyProgress: insightData.weeklyProgress,
    quarterlyProgress: insightData.quarterlyProgress,
    dailyActivities: insightData.dailyActivities,

    // Process metrics
    activeProcesses: insightData.activeProcesses,
    completedProcesses: insightData.completedProcesses,

    // Effort data
    tagDistribution: insightData.tagDistribution,
    effortDistribution: insightData.effortDistribution,

    // Chart data
    dailyBurnup: insightData.dailyBurnup,
    quarterlyBurnup: insightData.quarterlyBurnup,

    // Help topics
    helpTopics: insightData.helpTopics,

    // Time frame
    selectedTimeFrame,
    setSelectedTimeFrame: handleTimeFrameChange,

    // Tab selection
    selectedTab,
    setSelectedTab: handleSelectTab,

    // Filter
    selectedTag,
    setSelectedTag: handleTagSelection,
  };

  return <Provider value={contextValue}>{children}</Provider>;
}

// Export the hook with the standard name
export const useInsight = useRouteContext;
