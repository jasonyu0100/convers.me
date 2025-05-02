'use client';

import { useSearchParams as useNextSearchParams } from 'next/navigation';
import { createContext, useContext, Suspense } from 'react';

// Create a context to store search params
const SearchParamsContext = createContext<URLSearchParams | null>(null);

// Provider component that fetches search params with useSearchParams
function SearchParamsProviderInner({ children }: { children: React.ReactNode }) {
  const searchParams = useNextSearchParams();

  return <SearchParamsContext.Provider value={searchParams as URLSearchParams}>{children}</SearchParamsContext.Provider>;
}

// Wrapper that includes Suspense boundary
export function SearchParamsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SearchParamsProviderInner>{children}</SearchParamsProviderInner>
    </Suspense>
  );
}

// Custom hook to use search params safely
export function useSearchParams() {
  const searchParams = useContext(SearchParamsContext);
  if (searchParams === null) {
    throw new Error('useSearchParams must be used within SearchParamsProvider');
  }
  return searchParams;
}

// Helper function to check if a search param exists
export function hasSearchParam(name: string) {
  const searchParams = useSearchParams();
  return searchParams.has(name);
}

// Helper function to get a search param value
export function getSearchParam(name: string) {
  const searchParams = useSearchParams();
  return searchParams.get(name);
}
