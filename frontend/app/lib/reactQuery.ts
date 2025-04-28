/**
 * React Query utilities and standardized hooks
 * This file provides common patterns for using React Query throughout the application
 */

import { useQuery, useMutation, UseQueryOptions, UseMutationOptions, QueryClient } from '@tanstack/react-query';
import { ApiResult } from '../services/api';
import { unwrapResult } from './utils';
import { handleApiError, apiResultToError, AppError } from './errorHandler';
import logger from './logger';

/**
 * Configuration for the application's QueryClient
 */
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  },
};

/**
 * Create a consistent QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient(queryClientConfig);
}

/**
 * Global query keys used throughout the application
 * Using this ensures consistent cache invalidation
 */
export const QueryKeys = {
  // User related queries
  user: {
    all: ['users'] as const,
    current: ['currentUser'] as const,
    detail: (id: string) => ['users', id] as const,
  },

  // Process related queries
  process: {
    all: ['processes'] as const,
    detail: (id: string) => ['processes', id] as const,
    templates: ['processTemplates'] as const,
    directory: (id: string) => ['processDirectory', id] as const,
  },

  // Event related queries
  event: {
    all: ['events'] as const,
    detail: (id: string) => ['events', id] as const,
    byProcess: (processId: string) => ['events', 'process', processId] as const,
    byDate: (startDate: string, endDate: string) => ['events', 'dateRange', startDate, endDate] as const,
  },

  // Directory related queries
  directory: {
    all: ['directories'] as const,
    detail: (id: string) => ['directories', id] as const,
  },

  // Feed related queries
  feed: {
    all: ['feed'] as const,
    timeline: (timeframe: string) => ['feed', 'timeline', timeframe] as const,
  },

  // Insight related queries
  insight: {
    all: ['insights'] as const,
    metrics: ['insights', 'metrics'] as const,
    performance: ['insights', 'performance'] as const,
  },

  // Calendar related queries
  calendar: {
    all: ['calendar'] as const,
    events: (year: number, month: number) => ['calendar', 'events', year, month] as const,
  },

  // Profile related queries
  profile: {
    detail: (id: string) => ['profile', id] as const,
    activity: (id: string) => ['profile', id, 'activity'] as const,
  },

  // Room related queries
  room: {
    detail: (id: string) => ['room', id] as const,
    messages: (id: string) => ['room', id, 'messages'] as const,
    participants: (id: string) => ['room', id, 'participants'] as const,
  },

  // Settings related queries
  settings: {
    all: ['settings'] as const,
    notifications: ['settings', 'notifications'] as const,
  },

  // Sample queries (for demo purposes)
  sample: {
    all: ['sample'] as const,
    detail: (id: string) => ['sample', id] as const,
  },
};

/**
 * Type-safe wrapper for useQuery with standardized error handling
 * This handles the ApiResult pattern used in our services
 */
export function useApiQuery<TData, TError = AppError>(queryKey: readonly unknown[], queryFn: () => Promise, options?: Omit) {
  // Check if user is authenticated to prevent unnecessary API calls
  const isAuthenticated = typeof window !== 'undefined' ? !!localStorage.getItem('auth_token') : false;

  return useQuery<TData, TError, TData>({
    queryKey,
    queryFn: async () => {
      // Check for logout in progress before making request
      if (typeof window !== 'undefined' && (window as any).__AUTH_LOGOUT_IN_PROGRESS) {
        throw new Error('Request cancelled - logout in progress');
      }

      try {
        const result = await queryFn();

        // If the API returned an error, throw it to be caught by React Query
        if (result.error) {
          const appError = apiResultToError(result);
          throw appError;
        }

        // Unwrap the result data or throw if undefined
        return unwrapResult(result);
      } catch (error: any) {
        // Skip error handling for cancelled requests during logout
        if (error?.isCancelled || (error?.message && error.message.includes('logout in progress'))) {
          throw error;
        }

        // Log the error
        logger.error(`Query error for ${String(queryKey[0])}:`, error);

        // Convert to a standardized AppError if it's not already one
        // and make sure status code is included
        if (typeof error === 'object' && error !== null && 'type' in error && 'statusCode' in error) {
          // It's already an AppError
          throw error;
        }

        // For axios errors, try to extract status code
        if (typeof error === 'object' && error !== null && 'isAxiosError' in error && error.isAxiosError && error.response && error.response.status) {
          throw handleApiError(error, {
            statusCode: error.response.status,
            rethrow: true,
          });
        }

        // For other errors, throw a standardized AppError
        throw handleApiError(error, { rethrow: true });
      }
    },
    // Only run queries if authenticated (unless explicitly enabled)
    enabled: isAuthenticated && options?.enabled !== false,
    ...options,
  });
}

/**
 * Type-safe wrapper for useMutation with standardized error handling
 * This handles the ApiResult pattern used in our services
 */
export function useApiMutation<TData, TVariables, TError = AppError>(mutationFn: (variables: TVariables) => Promise, options?: Omit) {
  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables) => {
      // Check for logout in progress before making request
      if (typeof window !== 'undefined' && (window as any).__AUTH_LOGOUT_IN_PROGRESS) {
        throw new Error('Request cancelled - logout in progress');
      }

      try {
        const result = await mutationFn(variables);

        // If the API returned an error, throw it
        if (result.error) {
          const appError = apiResultToError(result);
          throw appError;
        }

        // Unwrap the result data or throw if undefined
        return unwrapResult(result);
      } catch (error: any) {
        // Skip error handling for cancelled requests during logout
        if (error?.isCancelled || (error?.message && error.message.includes('logout in progress'))) {
          throw error;
        }

        // Log the error
        logger.error('Mutation error:', error);

        // Convert to a standardized AppError if it's not already one
        // and make sure status code is included
        if (typeof error === 'object' && error !== null && 'type' in error && 'statusCode' in error) {
          // It's already an AppError
          throw error;
        }

        // For axios errors, try to extract status code
        if (typeof error === 'object' && error !== null && 'isAxiosError' in error && error.isAxiosError && error.response && error.response.status) {
          throw handleApiError(error, {
            statusCode: error.response.status,
            rethrow: true,
          });
        }

        // For other errors, throw a standardized AppError
        throw handleApiError(error, { rethrow: true });
      }
    },
    ...options,
  });
}

/**
 * Helper function to invalidate multiple related queries at once
 */
export function invalidateRelatedQueries(queryClient: QueryClient, queryKeys: readonly unknown[][]) {
  return Promise.all(queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
}
