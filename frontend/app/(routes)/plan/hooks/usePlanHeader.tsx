'use client';

import { useCallback, useState } from 'react';
import { usePlan } from './usePlan';

/**
 * Hook for managing the Plan page header
 */
export function usePlanHeader() {
  const { hasGeneratedPlan } = usePlan();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleSearchSubmit = useCallback((value: string) => {
    console.log('Search submitted:', value);
    // Would typically trigger a search in the planning templates or results
  }, []);

  return {
    title: hasGeneratedPlan ? 'Generated Weekly Plan' : 'Create Weekly Plan',
    searchPlaceholder: 'Search templates...',
    searchValue,
    onSearchChange: handleSearchChange,
    onSearchSubmit: handleSearchSubmit,
  };
}
