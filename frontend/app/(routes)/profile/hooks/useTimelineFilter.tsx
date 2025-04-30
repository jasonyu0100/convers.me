import { useProfile } from './useProfile';

/**
 * Hook for timeline filtering functionality
 * Extracts timeline filter logic from the main profile hook
 */
export function useTimelineFilter() {
  const { timelineData, selectedYear, selectedQuarter, selectedMonth, selectedWeek, selectYear, selectQuarter, selectMonth, selectWeek, dateRange } =
    useProfile();

  return {
    timelineData,
    selectedYear,
    selectedQuarter,
    selectedMonth,
    selectedWeek,
    selectYear,
    selectQuarter,
    selectMonth,
    selectWeek,
    dateRange,
  };
}
