import React from 'react';

// Base types
export interface ProcessStep {
  title: string;
  description: string;
}

export interface LibraryProcess {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string; // Changed from React.ReactNode to string
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

export interface Category {
  id: string;
  name: string;
}

// Context type
export interface LibraryContextType {
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
