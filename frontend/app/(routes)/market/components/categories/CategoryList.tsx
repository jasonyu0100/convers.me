'use client';

import { CheckIcon } from '@heroicons/react/24/outline';
import { useMarket } from '../../hooks/useMarket';

/**
 * Component that displays a list of categories for filtering library collections
 */
export function CategoryList() {
  const { categories, selectedCategory, setSelectedCategory, setSelectedCollection, collections, isLoading } = useMarket();

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);

    // Reset the selected collection when changing categories
    setSelectedCollection(null);
  };

  // Calculate category counts from collections data
  const getCategoryCount = (categoryId: string) => {
    // Show a loading indicator when collections are being fetched
    if (isLoading) {
      return '...';
    }

    // Make sure collections exists and is an array
    if (!collections || !Array.isArray(collections)) {
      return '0';
    }

    // For "all" category and currently selected category, we can just use the current collections
    if (categoryId === 'all' || categoryId === selectedCategory) {
      return collections.length.toString();
    }

    // For other categories, filter from the current visible collections
    const categoryCollections = collections.filter(
      (collection) => collection.categories && Array.isArray(collection.categories) && collection.categories.includes(categoryId),
    );

    return categoryCollections.length.toString();
  };

  return (
    <div className='overflow-y-auto'>
      <h2 className='mb-3 font-medium text-sm uppercase tracking-wider text-gray-500'>Categories</h2>
      <div className='space-y-1'>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`group flex w-full items-center rounded-lg px-4 py-2.5 text-left text-sm transition-all ${
              selectedCategory === category.id ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => handleCategorySelect(category.id)}
          >
            <div
              className={`mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border bg-white/80 transition-colors ${
                selectedCategory === category.id ? 'border-blue-200' : 'border-gray-200 group-hover:border-blue-100'
              }`}
            >
              {selectedCategory === category.id && <CheckIcon className='h-4 w-4 text-blue-600' />}
            </div>
            <span className={selectedCategory === category.id ? 'font-medium' : ''}>{category.name}</span>

            {/* Category counter */}
            <span className={`ml-auto text-xs ${selectedCategory === category.id ? 'text-blue-500' : 'text-gray-400'}`}>{getCategoryCount(category.id)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
