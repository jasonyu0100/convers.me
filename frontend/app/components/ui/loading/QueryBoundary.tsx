'use client';

import React, { ReactNode, memo } from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { LoadingSpinner } from './LoadingSpinner';
import { ApiErrorDisplay } from '../error/ApiErrorDisplay';
import { AppError, createAppError } from '@/app/lib/errorHandler';

interface QueryBoundaryProps<TData> {
  query: UseQueryResult;
  children: (data: TData) => ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode | ((error: unknown, retry: () => void) => ReactNode);
  noDataComponent?: ReactNode;
}

// Memoized loading component to prevent unnecessary re-renders
const DefaultLoadingComponent = memo(() => (
  <div className='flex justify-center py-8'>
    <LoadingSpinner />
  </div>
));
DefaultLoadingComponent.displayName = 'DefaultLoadingComponent';

// Memoized no data component
const DefaultNoDataComponent = memo(() => <div className='py-8 text-center text-gray-500'>No data available</div>);
DefaultNoDataComponent.displayName = 'DefaultNoDataComponent';

/**
 * Wraps React Query hooks with standard loading, error, and empty states
 * This helps reduce boilerplate when using query hooks in components
 */
export function QueryBoundary<TData>({ query, children, loadingComponent, errorComponent, noDataComponent }: QueryBoundaryProps) {
  const { data, isLoading, error, refetch } = query;

  // Handle loading state
  if (isLoading) {
    return loadingComponent ? <>{loadingComponent}</> : <DefaultLoadingComponent />;
  }

  // Handle error state
  if (error) {
    // Convert error to a standardized AppError for consistent display
    const appError =
      error instanceof Error
        ? createAppError(error)
        : typeof error === 'object' && error !== null && 'type' in error
        ? (error as AppError)
        : createAppError(error, 'An error occurred');

    if (errorComponent) {
      if (typeof errorComponent === 'function') {
        return <>{errorComponent(appError, () => refetch())}</>;
      }
      return <>{errorComponent}</>;
    }

    // Default error component
    return <ApiErrorDisplay error={appError} onRetry={() => refetch()} className='my-4' />;
  }

  // Handle empty data state
  if (!data) {
    return noDataComponent ? <>{noDataComponent}</> : <DefaultNoDataComponent />;
  }

  // Render child component with data
  return <>{children(data)}</>;
}

// Type for withQueryBoundary options
interface WithQueryBoundaryOptions {
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode | ((error: unknown, retry: () => void) => ReactNode);
  noDataComponent?: ReactNode;
}

/**
 * Higher-order component that wraps a component with QueryBoundary
 */
export function withQueryBoundary<TProps extends { data?: any }, TData>(
  Component: React.ComponentType,
  useQueryHook: () => UseQueryResult,
  options?: WithQueryBoundaryOptions,
) {
  // Use React.memo to prevent unnecessary re-renders
  const MemoizedComponent = memo(Component);

  const WithQueryBoundary = memo((props: Omit) => {
    const query = useQueryHook();

    return (
      <QueryBoundary query={query} {...options}>
        {(data) => <MemoizedComponent {...(props as any)} data={data} />}
      </QueryBoundary>
    );
  });

  // Set a display name for better debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithQueryBoundary.displayName = `withQueryBoundary(${displayName})`;

  return WithQueryBoundary;
}
