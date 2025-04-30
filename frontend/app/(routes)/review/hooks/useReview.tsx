'use client';

import { BaseService } from '@/app/services/baseService';
import {
  DailySummary,
  KnowledgeCategoryType,
  KnowledgeEntry,
  KnowledgeRecommendation,
  KnowledgeTimeFrameType,
  ReviewContextType,
  ReviewFilters,
  WeeklySummary,
} from '@/app/types/review';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Create the context with a default undefined value
const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

interface ReviewProviderProps {
  children: ReactNode;
}

/**
 * Provider component for the Review context
 */
export function ReviewProvider({ children }: ReviewProviderProps) {
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [weeklySummaries, setWeeklySummaries] = useState<WeeklySummary[]>([]);
  const [recommendations, setRecommendations] = useState<KnowledgeRecommendation[]>([]);

  // Selection state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<KnowledgeTimeFrameType>('day');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategoryType | undefined>(undefined);

  // Filter state
  const [filters, setFilters] = useState<ReviewFilters>({});

  // Fetch data based on current filters
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Calculate date range based on selected date and time frame
      const startDate = new Date(selectedDate);
      let endDate = new Date(selectedDate);

      if (selectedTimeFrame === 'week') {
        startDate.setDate(startDate.getDate() - startDate.getDay()); // First day of the week
        endDate.setDate(startDate.getDate() + 6); // Last day of the week
      } else if (selectedTimeFrame === 'month') {
        startDate.setDate(1); // First day of the month
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of the month
      }

      // Format dates for API
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Update filters with date range
      const currentFilters: ReviewFilters = {
        ...filters,
        startDate: startDateStr,
        endDate: endDateStr,
        timeFrame: selectedTimeFrame,
        category: selectedCategory,
      };

      // Fetch all data in parallel
      const [entriesResult, dailyResult, weeklyResult, recommendationsResult] = await Promise.all([
        BaseService.getEntries(currentFilters),
        BaseService.getDailySummaries(startDateStr, endDateStr),
        BaseService.getWeeklySummaries(startDateStr, endDateStr),
        BaseService.getRecommendations(5),
      ]);

      // Update state with results
      setEntries(entriesResult.data || []);
      setDailySummaries(dailyResult.data || []);
      setWeeklySummaries(weeklyResult.data || []);
      setRecommendations(recommendationsResult.data || []);

      // Check for errors
      if (entriesResult.error || dailyResult.error || weeklyResult.error || recommendationsResult.error) {
        const errorMessage = entriesResult.error || dailyResult.error || weeklyResult.error || recommendationsResult.error;
        setError(errorMessage || 'Error fetching review data');
      }
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError('Failed to fetch review data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on initial load and when filters change
  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedTimeFrame, selectedCategory]);

  // Function to get entry by ID
  const getEntryById = (id: string): KnowledgeEntry | undefined => {
    return entries.find((entry) => entry.id === id);
  };

  // Function to clear error state
  const clearError = () => {
    setError(null);
  };

  // Create context value
  const contextValue: ReviewContextType = {
    isLoading,
    error,
    clearError,

    entries,
    dailySummaries,
    weeklySummaries,
    recommendations,

    selectedDate,
    setSelectedDate,
    selectedTimeFrame,
    setSelectedTimeFrame,
    selectedCategory,
    setSelectedCategory,

    filters,
    setFilters,

    refreshData: fetchData,
    getEntryById,
  };

  return <ReviewContext.Provider value={contextValue}>{children}</ReviewContext.Provider>;
}

/**
 * Hook to use the Review context
 */
export function useReview(): ReviewContextType {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
}
