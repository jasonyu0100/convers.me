'use client';

import { BookmarkIcon, UserIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { GradientBackground } from '../../../components/ui/backgrounds/GradientBackground';
import { useLibrary } from '../hooks/useLibrary';

export function LibraryCollectionsList() {
  const { collections, setSelectedCollection, saveCollection } = useLibrary();

  const handleSaveCollection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    saveCollection(id);
  };

  // Format date to relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className='flex-1 overflow-auto bg-gray-50 p-6'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900'>Library Collections</h1>
        <p className='mt-2 text-gray-600'>Discover curated collections of processes and workflows from the community.</p>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
        {collections.map((collection) => (
          <div
            key={collection.id}
            onClick={() => setSelectedCollection(collection.id)}
            className='group cursor-pointer overflow-hidden rounded-xl bg-white/80 shadow-sm transition-all hover:-translate-y-2 hover:shadow-lg'
          >
            {/* Gradient header */}
            <div className='relative h-48 w-full overflow-hidden'>
              <div className='absolute inset-0' style={{ zIndex: 0 }}>
                <GradientBackground
                  intensity='medium'
                  color={collection.id.includes('team') ? 'purple' : collection.id.includes('personal') ? 'teal' : 'blue'}
                  animated={false}
                />
              </div>
              <div className='absolute inset-0 bg-gradient-to-t from-black/40 to-transparent' style={{ zIndex: 1 }}></div>

              {/* Collection stats */}
              <div className='absolute right-0 bottom-0 left-0 flex items-center justify-between p-4'>
                <div className='flex items-center space-x-2'>
                  <span className='flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-800'>
                    <BookmarkIcon className='mr-1 h-3 w-3 text-blue-500' />
                    {collection.popularity.toLocaleString()}
                  </span>
                  <span className='flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-800'>
                    {collection.directories.length} directories
                  </span>
                </div>

                <button
                  onClick={(e) => handleSaveCollection(e, collection.id)}
                  className='rounded-full bg-blue-600 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100'
                  aria-label='Save collection'
                >
                  <BookmarkIcon className='h-4 w-4' />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className='p-5'>
              <div className='mb-3'>
                <h3 className='mb-1 text-lg font-bold text-gray-900'>{collection.title}</h3>
                <p className='line-clamp-2 text-sm text-gray-600'>{collection.description}</p>
              </div>

              {/* Categories */}
              <div className='mb-4 flex flex-wrap gap-2'>
                {collection.categories.slice(0, 3).map((category) => (
                  <span
                    key={category}
                    className='rounded-full border border-blue-100/50 bg-blue-50/80 px-2.5 py-1 text-xs font-medium text-blue-700 backdrop-blur-sm'
                  >
                    {category.replace('-', ' ')}
                  </span>
                ))}
                {collection.categories.length > 3 && (
                  <span className='rounded-full border border-gray-100/50 bg-gray-50/80 px-2.5 py-1 text-xs font-medium text-gray-500 backdrop-blur-sm'>
                    +{collection.categories.length - 3} more
                  </span>
                )}
              </div>

              {/* Author and date */}
              <div className='mt-4 flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  {collection.author.avatar ? (
                    <Image src={collection.author.avatar} alt={collection.author.name} width={24} height={24} className='rounded-full' />
                  ) : (
                    <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100'>
                      <UserIcon className='h-4 w-4 text-blue-600' />
                    </div>
                  )}
                  <span className='text-xs text-gray-600'>{collection.author.name}</span>
                </div>
                <span className='text-xs text-gray-500'>{formatDate(collection.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {collections.length === 0 && (
        <div className='flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-white/80 p-10 text-center'>
          <h3 className='mb-2 text-lg font-semibold text-gray-700'>No collections found</h3>
          <p className='text-gray-500'>Try selecting a different category or creating your own collection.</p>
        </div>
      )}
    </div>
  );
}
