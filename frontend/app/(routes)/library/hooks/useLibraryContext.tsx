'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { LibraryService } from '@/app/services/libraryService';
import { LibraryContextType } from '../types';

/**
 * Context for managing library state
 * Provides state and actions for library functionality
 */
const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

interface LibraryProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for library functionality
 * Manages state and provides context for all library components
 */
export function LibraryProvider({ children }: LibraryProviderProps) {
  // State for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // State for category and collection selection
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const router = useRouter();
  const { isAuthenticated } = useAuth();

  /**
   * Handle selecting a process template
   * Navigates to the process page with the template ID
   */
  const handleProcessSelect = useCallback(
    (id: string) => {
      if (isAuthenticated) {
        router.push(`/process?templateId=${id}`);
      } else {
        router.push(`/login?redirect=/process&templateId=${id}`);
      }
    },
    [isAuthenticated, router],
  );

  /**
   * Save a collection to the user's library
   * Calls the API to duplicate the collection with all its content
   * and creates a full copy in the user's library
   */
  const saveCollection = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      // Call the save endpoint to duplicate the collection
      const response = await LibraryService.saveCollection(id);

      if (response.data) {
        // Get the duplicated collection
        const collection = response.data;

        // Show success message with the new collection's title
        alert(`${collection.title} saved to your library!`);

        // Here we could navigate to the newly saved collection
        // router.push(`/library?collection=${collection.id}`);
      } else {
        throw new Error(response.error || 'Failed to save collection');
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to save collection'));
      console.error('Error saving collection:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear any errors in the library context
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: LibraryContextType = {
    isLoading,
    error: error ? error.message : null,
    selectedCategory,
    selectedCollection,
    collections: [], // This will be populated by useLibrary
    setSelectedCategory,
    setSelectedCollection,
    handleProcessSelect,
    saveCollection,
    clearError,
  };

  return <LibraryContext.Provider value={contextValue}>{children}</LibraryContext.Provider>;
}

/**
 * Hook for accessing library context
 * Returns library state and actions
 */
export function useLibraryContext() {
  const context = useContext(LibraryContext);

  if (context === undefined) {
    throw new Error('useLibraryContext must be used within a LibraryProvider');
  }

  return context;
}
