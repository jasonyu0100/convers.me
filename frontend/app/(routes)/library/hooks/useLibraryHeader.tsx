'use client';

import { useCallback, useState } from 'react';
import { useLibrary } from './useLibrary';

/**
 * Custom hook for managing library header functionality
 * Provides search capabilities and dynamic title based on the selected content
 */
export function useLibraryHeader() {
  const { selectedCategory, setSelectedCategory, categories, selectedCollection, activeCollection } = useLibrary();

  // Search state
  const [searchValue, setSearchValue] = useState('');

  // Handle search input changes
  const handleSearchChange = useCallback((e: React.ChangeEvent) => {
    setSearchValue(e.target.value);
  }, []);

  // Handle search submission
  const handleSearchSubmit = useCallback((value: string) => {
    if (!value.trim()) return;

    console.log('Search submitted:', value);
    // In a real implementation, we would filter collections based on search
  }, []);

  // Determine the title based on whether a collection is selected
  const title = activeCollection ? activeCollection.title : 'Library Collections';

  return {
    title,
    searchPlaceholder: 'Search collections...',
    searchValue,
    onSearchChange: handleSearchChange,
    onSearchSubmit: handleSearchSubmit,
    selectedCategory,
    setSelectedCategory,
    categories,
    selectedCollection,
    activeCollection,
  };
}
