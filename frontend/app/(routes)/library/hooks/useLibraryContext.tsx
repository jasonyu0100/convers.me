'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
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
   * In a real implementation, this would call an API
   */
  const saveCollection = useCallback((id: string) => {
    // This would call an API to save the collection
    console.log('Saving collection', id);
    // For now, just show a message
    alert('Collection saved to your library!');
  }, []);

  /**
   * Clear any errors in the library context
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: LibraryContextType = {
    isLoading,
    error,
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
