'use client';

import { BookmarkIcon, FolderIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { useLibrary } from '../../hooks/useLibrary';
import { LibraryCollection } from '../../types';

interface CollectionsListProps {
  collections: LibraryCollection[];
}

/**
 * Component that displays a grid of collection cards
 */
export function CollectionsList({ collections }: CollectionsListProps) {
  const { setSelectedCollection } = useLibrary();

  // Format date to relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className='flex-1 overflow-auto p-6'>
      <h2 className='mb-6 text-2xl font-bold text-slate-800'>Library Collections</h2>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} onSelect={() => setSelectedCollection(collection.id)} formatDate={formatDate} />
        ))}

        {/* Add collection button */}
        <div className='flex aspect-[3/2] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/50 hover:bg-slate-50'>
          <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100'>
            <PlusIcon className='h-6 w-6 text-slate-400' />
          </div>
          <p className='text-sm font-medium text-slate-500'>Create New Collection</p>
        </div>
      </div>

      {collections.length === 0 && (
        <div className='flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-10 text-center'>
          <h3 className='mb-2 text-lg font-semibold text-slate-700'>No collections found</h3>
          <p className='text-slate-500'>Try selecting a different category or creating your own collection.</p>
        </div>
      )}
    </div>
  );
}

interface CollectionCardProps {
  collection: LibraryCollection;
  onSelect: () => void;
  formatDate: (date: string) => string;
}

/**
 * Component that displays a single collection card
 */
function CollectionCard({ collection, onSelect, formatDate }: CollectionCardProps) {
  // Determine card color based on collection id
  const getCollectionColor = (id: string) => {
    if (id.includes('team')) return 'from-purple-500 to-indigo-500';
    if (id.includes('personal')) return 'from-teal-500 to-green-500';
    return 'from-blue-500 to-indigo-500';
  };

  return (
    <div
      onClick={onSelect}
      className='relative flex aspect-[3/2] cursor-pointer flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:shadow-md'
    >
      {/* Content */}
      <div className='flex flex-1 flex-col p-5'>
        <h3 className='mb-2 text-lg font-semibold text-slate-800'>{collection.title}</h3>

        {collection.description ? <p className='mb-auto line-clamp-2 text-sm text-slate-500'>{collection.description}</p> : <div className='mb-auto'></div>}

        {/* Stats footer */}
        <div className='mt-2 flex items-center justify-between text-sm text-slate-500'>
          <div className='flex items-center'>
            <BookmarkIcon className='mr-1.5 h-4 w-4 text-slate-400' />
            <span>{collection.popularity.toLocaleString()}</span>
          </div>
          <span className='text-xs text-slate-400'>{formatDate(collection.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
