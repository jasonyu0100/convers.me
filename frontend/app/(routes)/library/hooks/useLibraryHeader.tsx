'use client';

import { useState } from 'react';
import { useLibrary } from './useLibrary';

export const useLibraryHeader = () => {
  const { selectedCategory, setSelectedCategory, categories, selectedCollection, activeCollection } = useLibrary();

  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSearchSubmit = () => {
    console.log('Search submitted:', searchValue);
  };

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
};
