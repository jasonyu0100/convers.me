'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { MarketService } from '@/app/services/marketService';
import { useRouter } from 'next/navigation';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { MarketContextType } from '../types';

/**
 * Context for managing market state
 * Provides state and actions for market functionality
 */
const MarketContext = createContext<MarketContextType | undefined>(undefined);

interface MarketProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for market functionality
 * Manages state and provides context for all market components
 */
export function MarketProvider({ children }: MarketProviderProps) {
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
   * Save a collection to the user's market
   * Calls the API to duplicate the collection with all its content
   * and creates a full copy in the user's market
   */
  const saveCollection = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      // Call the save endpoint to duplicate the collection
      const response = await MarketService.saveCollection(id);

      if (response.data) {
        // Get the duplicated collection
        const collection = response.data;

        // Show success message with the new collection's title
        alert(`${collection.title} saved to your market!`);

        // Here we could navigate to the newly saved collection
        // router.push(`/market?collection=${collection.id}`);
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
   * Clear any errors in the market context
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: MarketContextType = {
    isLoading,
    error: error ? error.message : null,
    selectedCategory,
    selectedCollection,
    collections: [], // This will be populated by useMarket
    setSelectedCategory,
    setSelectedCollection,
    handleProcessSelect,
    saveCollection,
    clearError,
  };
  return <MarketContext.Provider value={contextValue}>{children}</MarketContext.Provider>;
}

/**
 * Hook for accessing market context
 * Returns market state and actions
 */
export function useMarketContext() {
  const context = useContext(MarketContext);

  if (context === undefined) {
    throw new Error('useMarketContext must be used within a MarketProvider');
  }

  return context;
}
