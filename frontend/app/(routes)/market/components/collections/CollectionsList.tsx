'use client';

import { BookmarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { useMarket } from '../../hooks/useMarket';
import { Collection } from '../../types';

interface CollectionsListProps {
  collections: Collection[];
}

/**
 * Component that displays a grid of collection cards
 */
export function CollectionsList({ collections }: CollectionsListProps) {
  const { setSelectedCollection, error, clearError, isLoading } = useMarket();

  // Format date to relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Handle retry when fetch fails
  const handleRetry = () => {
    if (clearError) {
      clearError();
    }
  };

  return (
    <div className='flex-1 overflow-auto p-6'>
      {/* Error display with retry option */}
      {error ? (
        <div className='mb-6 flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center'>
          <h3 className='mb-2 text-lg font-semibold text-red-700'>Library Collections Error</h3>
          <p className='mb-4 text-red-500'>{error.message || 'Failed to fetch collections'}</p>
          <button onClick={handleRetry} className='rounded-md bg-red-100 px-4 py-2 font-medium text-sm text-red-700 hover:bg-red-200'>
            Try Again
          </button>
        </div>
      ) : isLoading ? (
        // Loading state
        <div className='flex h-32 items-center justify-center'>
          <div className='flex animate-pulse space-x-2'>
            <div className='h-2 w-2 rounded-full bg-blue-400'></div>
            <div className='h-2 w-2 rounded-full bg-blue-400'></div>
            <div className='h-2 w-2 rounded-full bg-blue-400'></div>
          </div>
        </div>
      ) : (
        <>
          {collections.length === 0 && !error && (
            <div className='mb-8 flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-10 text-center'>
              <h3 className='mb-2 text-lg font-semibold text-slate-700'>No collections found</h3>
              <p className='text-slate-500'>Try selecting a different category or creating your own collection.</p>
            </div>
          )}

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} onSelect={() => setSelectedCollection(collection.id)} formatDate={formatDate} />
            ))}

            {/* Add collection button */}
            <div className='flex aspect-[3/2] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-100 bg-white/50 hover:bg-slate-50'>
              <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100'>
                <PlusIcon className='h-6 w-6 text-slate-400' />
              </div>
              <p className='font-medium text-sm text-slate-500'>Create New Collection</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface CollectionCardProps {
  collection: Collection;
  onSelect: () => void;
  formatDate: (date: string) => string;
}

/**
 * Component that displays a single collection card
 */
function CollectionCard({ collection, onSelect, formatDate }: CollectionCardProps) {
  // Determine card color based on collection categories
  const getCollectionColor = (categories: string[]) => {
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return 'from-blue-500 to-indigo-500';
    }

    // Return color based on the first category
    const mainCategory = categories[0];
    switch (mainCategory) {
      case 'project-management':
        return 'from-blue-500 to-indigo-500';
      case 'design':
        return 'from-purple-500 to-pink-500';
      case 'research':
        return 'from-indigo-500 to-blue-700';
      case 'engineering':
        return 'from-teal-500 to-green-500';
      case 'product':
        return 'from-orange-500 to-yellow-500';
      case 'marketing':
        return 'from-red-500 to-orange-500';
      case 'management':
        return 'from-emerald-500 to-teal-500';
      default:
        return 'from-blue-500 to-indigo-500';
    }
  };

  return (
    <div onClick={onSelect} className='relative flex aspect-[3/2] cursor-pointer flex-col rounded-lg bg-white transition-all hover:bg-slate-50'>
      {/* Top color band */}
      <div className={`h-1.5 w-full rounded-t-xl bg-gradient-to-r ${getCollectionColor(collection.categories)}`}></div>

      {/* Content */}
      <div className='flex flex-1 flex-col p-5'>
        <h3 className='mb-2 text-lg font-semibold text-slate-800'>{collection.title}</h3>

        {collection.description ? <p className='mb-auto line-clamp-2 text-sm text-slate-500'>{collection.description}</p> : <div className='mb-auto'></div>}

        {/* Categories */}
        {collection.categories && collection.categories.length > 0 && (
          <div className='mb-2 flex flex-wrap gap-1'>
            {collection.categories.map((category) => (
              <span key={category} className='inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700'>
                {category}
              </span>
            ))}
          </div>
        )}

        {/* Stats footer */}
        <div className='mt-2 flex items-center justify-between text-sm text-slate-500'>
          <div className='flex items-center'>
            <BookmarkIcon className='mr-1.5 h-4 w-4 text-slate-400' />
            <span>{collection.saves.toLocaleString()}</span>
          </div>
          <span className='text-xs text-slate-400'>{formatDate(collection.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
