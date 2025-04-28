/**
 * Reusable hook for route components that standardizes error handling and loading
 * Integrated with React Query for improved error handling
 */
import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface RouteComponentState {
  isLoading: boolean;
  error: string | null;
}

interface RouteComponentActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  handleError: (error: unknown) => void;
  clearError: () => void;
  invalidateQueries: (queryKey: string | string[]) => Promise;
}

interface RouteComponentResult extends RouteComponentState, RouteComponentActions {}

/**
 * Hook for shared route component functionality
 * Provides standard error handling and loading state
 * Integrates with React Query for cache management
 */
export function useRouteComponent(initialLoading = false): RouteComponentResult {
  const queryClient = useQueryClient();
  const [state, setState] = useState<RouteComponentState>({
    isLoading: initialLoading,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Standard error handler that can be used in catch blocks
   * Integrates with React Query error logging
   */
  const handleError = useCallback(
    (error: unknown) => {
      // Convert any error type to a string
      const errorMessage = error instanceof Error ? error.message : String(error) || 'An unknown error occurred';

      // Set the error message
      setError(errorMessage);

      // Log the error for debugging
      console.error('Route component error:', error);

      // Set loading to false
      setLoading(false);
    },
    [setError, setLoading],
  );

  /**
   * Helper function to invalidate queries by key
   * Useful for refreshing data after mutations
   */
  const invalidateQueries = useCallback(
    async (queryKey: string | string[]) => {
      const key = Array.isArray(queryKey) ? queryKey : [queryKey];
      await queryClient.invalidateQueries({ queryKey: key });
    },
    [queryClient],
  );

  return {
    ...state,
    setLoading,
    setError,
    handleError,
    clearError,
    invalidateQueries,
  };
}
