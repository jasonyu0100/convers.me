'use client';

import logger from '@/app/lib/logger';
import { MarketService } from '@/app/services/marketService';
import { useEffect, useState } from 'react';
import { Collection } from '../types';
import { CATEGORIES } from '../utils/marketRoutes';
import { useMarketContext } from './useMarketContext';

/**
 * Custom hook for accessing and manipulating market data
 * Provides access to collections, categories, and active selections
 */
export function useMarket() {
  const {
    isLoading: contextLoading,
    error: contextError,
    selectedCategory,
    selectedCollection,
    setSelectedCategory,
    setSelectedCollection,
    handleProcessSelect,
    saveCollection,
    clearError: clearContextError,
  } = useMarketContext();

  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all collections only once on component mount
  useEffect(() => {
    async function fetchAllCollections() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all collections from API
        const response = await MarketService.getCollections(undefined);

        if (response.data) {
          // Store all collections
          setAllCollections(response.data);

          // Apply initial filtering
          if (selectedCategory === 'all') {
            // Show all collections
            setCollections(response.data);
          } else {
            // Filter collections that include the selected category
            const filteredCollections = response.data.filter(
              (collection) => collection.categories && Array.isArray(collection.categories) && collection.categories.includes(selectedCategory),
            );
            setCollections(filteredCollections);
          }
        } else {
          // Create a more detailed error with context
          const errorMessage = response.error || 'Failed to fetch collections';
          const contextError = new Error(`Market Collections Error: ${errorMessage}`);
          // Add metadata to error object
          (contextError as any).context = {
            status: response.status,
            timestamp: new Date().toISOString(),
          };
          setError(contextError);

          // Initialize empty collections to prevent UI issues
          setAllCollections([]);
          setCollections([]);

          // Log to application logger for tracking
          logger.error('Market collections fetch failed', {
            status: response.status,
            error: response.error,
            originalError: response.originalError,
          });
        }
      } catch (err) {
        // Handle unexpected errors with more context
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const contextError = new Error(`Market Collections Error: ${errorMessage}`);

        // Add context data to error object
        (contextError as any).context = {
          timestamp: new Date().toISOString(),
          originalError: err,
        };

        setError(contextError);
        // Initialize empty collections to prevent UI issues
        setAllCollections([]);
        setCollections([]);

        logger.error('Unexpected error fetching market collections', {
          error: err,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllCollections();
  }, []);

  // Filter collections when category changes (client-side filtering)
  useEffect(() => {
    // Brief loading state to indicate filtering is happening
    setIsLoading(true);

    if (allCollections.length > 0) {
      if (selectedCategory === 'all') {
        // Show all collections
        setCollections(allCollections);
      } else {
        // Filter collections that include the selected category
        const filteredCollections = allCollections.filter(
          (collection) => collection.categories && Array.isArray(collection.categories) && collection.categories.includes(selectedCategory),
        );
        setCollections(filteredCollections);
      }
    }

    // Quick timeout to give UI time to show loading state
    // This gives user feedback that something happened
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  }, [selectedCategory, allCollections]);

  // Fetch active collection when selectedCollection changes
  useEffect(() => {
    async function fetchActiveCollection() {
      if (!selectedCollection) {
        setActiveCollection(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch collection and its associated directories
        const collectionResponse = await MarketService.getCollectionById(selectedCollection);

        if (collectionResponse.data) {
          const collection = collectionResponse.data;

          try {
            // Now fetch directories associated with this collection
            const directoriesResponse = await MarketService.getDirectoriesByCollectionId(selectedCollection);

            if (directoriesResponse.data) {
              // Update the collection with the fetched directories
              collection.directories = directoriesResponse.data;
            } else {
              // If we can't get directories, set empty directories
              collection.directories = [];

              // Log warning about directory fetch failure
              logger.warn('Failed to fetch directories for collection', {
                collectionId: selectedCollection,
                status: directoriesResponse.status,
                error: directoriesResponse.error,
              });
            }
          } catch (dirError) {
            // Handle directory fetch error gracefully
            collection.directories = [];
            logger.error('Error fetching directories for collection', {
              collectionId: selectedCollection,
              error: dirError,
            });
          }

          // Set the active collection with or without directories
          setActiveCollection(collection);
        } else {
          // Create a more detailed error with context
          const errorMessage = collectionResponse.error || 'Failed to fetch collection';
          const contextError = new Error(`Market Collections Error: ${errorMessage}`);

          // Add metadata to error object
          (contextError as any).context = {
            collectionId: selectedCollection,
            status: collectionResponse.status,
            timestamp: new Date().toISOString(),
          };

          setError(contextError);
          setActiveCollection(null);

          // Log to application logger for tracking
          logger.error('Market collection fetch failed', {
            collectionId: selectedCollection,
            status: collectionResponse.status,
            error: collectionResponse.error,
            originalError: collectionResponse.originalError,
          });
        }
      } catch (err) {
        // Handle unexpected errors with more context
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const contextError = new Error(`Market Collections Error: ${errorMessage}`);

        // Add context data to error object
        (contextError as any).context = {
          collectionId: selectedCollection,
          timestamp: new Date().toISOString(),
          originalError: err,
        };

        setError(contextError);
        setActiveCollection(null);

        logger.error('Unexpected error fetching market collection', {
          collectionId: selectedCollection,
          error: err,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchActiveCollection();
  }, [selectedCollection]);

  const clearError = () => {
    setError(null);
    clearContextError();
  };

  // Convert error objects to error messages for React components
  const errorMessage = error ? error.message : contextError ? contextError.message : null;

  return {
    isLoading: isLoading || contextLoading,
    error: errorMessage,
    selectedCategory,
    selectedCollection,
    setSelectedCategory,
    setSelectedCollection,
    collections,
    activeCollection,
    categories: CATEGORIES,
    handleProcessSelect,
    saveCollection,
    clearError,
  };
}
