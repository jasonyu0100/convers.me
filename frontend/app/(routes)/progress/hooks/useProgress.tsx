'use client';

import { createRouteContext } from '@/app/components/router/createRouteContext';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import { ProgressService } from '@/app/services/progressService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
  DailyActivity,
  DailyBurnup,
  EffortMetric,
  ProgressContextType,
  PerformanceMetric,
  ProgressTabType,
  ProcessMetric,
  QuarterlyProgress,
  TimeFrameType,
  WeeklyBurnup,
  WeeklyProgress,
} from '../../../types/progress';

// Create the context using the standardized factory function
// Using empty arrays for initial data instead of mock data
const { Provider, useRouteContext } = createRouteContext<ProgressContextType>('Progress', {
  coreMetrics: [] as PerformanceMetric[],
  weeklyProgress: {} as WeeklyProgress,
  quarterlyProgress: {} as QuarterlyProgress,
  dailyActivities: [] as DailyActivity[],
  activeProcesses: [] as ProcessMetric[],
  completedProcesses: [] as ProcessMetric[],
  tagDistribution: [] as any[], // TagDistribution type removed
  effortDistribution: [] as EffortMetric[],
  dailyBurnup: [] as DailyBurnup[],
  quarterlyBurnup: [] as WeeklyBurnup[],
  selectedTimeFrame: 'week',
  selectedTab: 'work',
  setSelectedTab: () => {},
  selectedTag: null,
  setSelectedTag: () => {},
});

/**
 * Progress context provider component
 */
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  // Add standardized error handling
  const { error, handleError, clearError } = useRouteComponent();
  const queryClient = useQueryClient();

  // Using fixed weekly time frame (simplified)
  const selectedTimeFrame: TimeFrameType = 'week';

  // Tab selection
  const [selectedTab, setSelectedTab] = useState<ProgressTabType>('work');

  // Tag filter
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Data state with default empty values
  const emptyProgressData = {
    coreMetrics: [],
    weeklyProgress: {} as WeeklyProgress,
    quarterlyProgress: {} as QuarterlyProgress,
    dailyActivities: [],
    activeProcesses: [],
    completedProcesses: [],
    tagDistribution: [],
    effortDistribution: [],
    dailyBurnup: [],
    quarterlyBurnup: [],
  };

  // Fetch progress data using React Query
  const { data: progressData = emptyProgressData, isLoading } = useQuery({
    queryKey: ['progress', selectedTimeFrame, selectedTab, selectedTag],
    queryFn: async () => {
      const response = await ProgressService.getProgress({
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

      return emptyProgressData;
    },
    onError: (error) => {
      console.error('Error fetching progress data:', error);
      handleError(error);
    },
  });

  // Tab selection with error handling
  const handleSelectTab = useCallback(
    (tab: ProgressTabType) => {
      try {
        setSelectedTab(tab);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  // Time frame is fixed to 'week' only (simplified)

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
  const contextValue: ProgressContextType = {
    // State
    isLoading,
    error,
    clearError,

    // Core metrics
    coreMetrics: progressData.coreMetrics,
    weeklyProgress: progressData.weeklyProgress,
    quarterlyProgress: progressData.quarterlyProgress,
    dailyActivities: progressData.dailyActivities,

    // Process metrics
    activeProcesses: progressData.activeProcesses,
    completedProcesses: progressData.completedProcesses,

    // Effort data
    tagDistribution: progressData.tagDistribution,
    effortDistribution: progressData.effortDistribution,

    // Chart data
    dailyBurnup: progressData.dailyBurnup,
    quarterlyBurnup: progressData.quarterlyBurnup,

    // Time frame (fixed to 'week')
    selectedTimeFrame,

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
export const useProgress = useRouteContext;
