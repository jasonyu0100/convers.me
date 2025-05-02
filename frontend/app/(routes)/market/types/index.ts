import React from 'react';

// Base types
export interface ProcessStep {
  title: string;
  description: string;
}

export interface MarketProcess {
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
  processes: MarketProcess[];
  color?: string;
  collectionId?: string; // Reference to the collection this directory belongs to
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  author: {
    name: string;
    avatar?: string;
  };
  categories: string[];
  saves: number;
  directories: ProcessDirectory[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
}

// Context type
export interface MarketContextType {
  isLoading: boolean;
  error: string | null;
  selectedCategory: string;
  selectedCollection: string | null;
  collections: Collection[];
  setSelectedCategory: (category: string) => void;
  setSelectedCollection: (id: string | null) => void;
  handleProcessSelect: (id: string) => void;
  saveCollection: (id: string) => void;
  clearError: () => void;
}
