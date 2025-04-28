'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';

export interface ProcessStep {
  title: string;
  description: string;
}

export interface LibraryProcess {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  benefits: string[];
  steps: ProcessStep[];
  saves?: number;
  createdBy?: string;
  createdAt?: string;
}

export interface ProcessDirectory {
  id: string;
  name: string;
  description: string;
  processes: LibraryProcess[];
  color?: string;
}

export interface LibraryCollection {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  author: {
    name: string;
    avatar?: string;
  };
  categories: string[];
  popularity: number;
  directories: ProcessDirectory[];
  createdAt: string;
}

interface LibraryContextType {
  isLoading: boolean;
  error: Error | null;
  selectedCategory: string;
  selectedCollection: string | null;
  collections: LibraryCollection[];
  setSelectedCategory: (category: string) => void;
  setSelectedCollection: (id: string | null) => void;
  handleProcessSelect: (id: string) => void;
  saveCollection: (id: string) => void;
  clearError: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleProcessSelect = (id: string) => {
    if (isAuthenticated) {
      router.push(`/process?templateId=${id}`);
    } else {
      router.push(`/login?redirect=/process&templateId=${id}`);
    }
  };

  const saveCollection = (id: string) => {
    // In a real implementation, this would call an API to save the collection
    console.log('Saving collection', id);
    // For now, just show a message
    alert('Collection saved to your library!');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <LibraryContext.Provider
      value={{
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
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibraryContext = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibraryContext must be used within a LibraryProvider');
  }
  return context;
};
