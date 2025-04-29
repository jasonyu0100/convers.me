'use client';

import { useLibraryContext } from './useLibraryContext';
import { LIBRARY_DATA } from '../utils/mockData';

/**
 * Library categories for filtering collections
 */
export const CATEGORIES = [
  { id: 'all', name: 'All Collections' },
  { id: 'project-management', name: 'Project Management' },
  { id: 'management', name: 'Team Leadership' },
  { id: 'research', name: 'Research' },
  { id: 'design', name: 'Design' },
  { id: 'engineering', name: 'Engineering' },
  { id: 'product', name: 'Product' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'sales', name: 'Sales' },
  { id: 'client-management', name: 'Client Management' },
  { id: 'planning', name: 'Strategic Planning' },
];

/**
 * Custom hook for accessing and manipulating library data
 * Provides access to collections, categories, and active selections
 */
export function useLibrary() {
  const {
    isLoading,
    error,
    selectedCategory,
    selectedCollection,
    setSelectedCategory,
    setSelectedCollection,
    handleProcessSelect,
    saveCollection,
    clearError,
  } = useLibraryContext();

  // In a real implementation, we would fetch collections from an API
  const collections = LIBRARY_DATA;

  // Filter collections by category
  const filteredCollections = selectedCategory === 'all' ? collections : collections.filter((collection) => collection.categories.includes(selectedCategory));

  // Get the selected collection if there is one
  const activeCollection = selectedCollection ? collections.find((c) => c.id === selectedCollection) || null : null;

  return {
    isLoading,
    error,
    selectedCategory,
    selectedCollection,
    setSelectedCategory,
    setSelectedCollection,
    collections: filteredCollections,
    activeCollection,
    categories: CATEGORIES,
    handleProcessSelect,
    saveCollection,
    clearError,
  };
}
