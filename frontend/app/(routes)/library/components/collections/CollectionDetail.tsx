'use client';

import { BookmarkIcon, DocumentTextIcon, UserIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { useState } from 'react';
import { useLibrary } from '../../hooks/useLibrary';
import { LibraryCollection } from '../../types';
import { DirectoryCard } from '../cards/DirectoryCard';

interface CollectionDetailProps {
  collection: LibraryCollection;
}

/**
 * Component that displays the details of a collection including its directories and processes
 */
export function CollectionDetail({ collection }: CollectionDetailProps) {
  const { handleProcessSelect } = useLibrary();
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    // In real implementation, this would call an API to save the collection
    setIsSaved(!isSaved);
  };

  // Get background color based on collection
  const getBgColor = (id: string) => {
    if (id.includes('team')) return 'purple';
    if (id.includes('personal')) return 'teal';
    return 'blue';
  };

  return (
    <div className='flex-1 overflow-auto p-6'>
      {/* Collection header with title, description and tags */}
      <div className='mb-8 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center'>
            <h1 className='text-2xl font-bold text-slate-800'>{collection.title}</h1>
            <button className='ml-2 text-slate-400 hover:text-yellow-500'>
              <StarIconSolid className='h-5 w-5 text-yellow-500' />
            </button>
          </div>

          <button
            onClick={handleSave}
            className='flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-gray-50'
          >
            {isSaved ? (
              <>
                <BookmarkSolid className='h-4 w-4 text-blue-700' />
                Saved
              </>
            ) : (
              <>
                <BookmarkIcon className='h-4 w-4' />
                Save Collection
              </>
            )}
          </button>
        </div>

        <p className='mb-4 text-slate-700'>{collection.description}</p>

        <div className='flex flex-wrap gap-2'>
          {collection.categories.map((category) => (
            <span key={category} className='rounded-full border border-blue-100/50 bg-blue-50/80 px-2.5 py-1 text-xs font-medium text-blue-700'>
              {category.replace('-', ' ')}
            </span>
          ))}
        </div>

        {/* Collection meta */}
        <div className='mt-4 flex items-center gap-4 text-sm text-slate-500'>
          <div className='flex items-center gap-2'>
            {collection.author.avatar ? (
              <Image src={collection.author.avatar} alt={collection.author.name} width={24} height={24} className='rounded-full' />
            ) : (
              <div className='flex h-6 w-6 items-center justify-center rounded-full bg-slate-100'>
                <UserIcon className='h-4 w-4 text-slate-400' />
              </div>
            )}
            <span>{collection.author.name}</span>
          </div>

          <div className='flex items-center gap-2'>
            <BookmarkSolid className='h-4 w-4 text-slate-400' />
            <span>{collection.popularity.toLocaleString()} saves</span>
          </div>
        </div>
      </div>

      {/* Directories section */}
      <div className='mb-8'>
        <div className='mb-4'>
          <h2 className='text-lg font-semibold text-gray-800'>Directories & Processes</h2>
        </div>

        <div className='space-y-8'>
          {collection.directories.map((directory) => (
            <div key={directory.id} className='rounded-xl border border-slate-200/70 bg-white/80 shadow-sm'>
              {/* Directory header */}
              <div className='flex items-center justify-between border-b border-slate-100 px-6 py-4'>
                <div className='flex items-center gap-3'>
                  <div className='relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg'>
                    <div className={`h-10 w-10 bg-gradient-to-r ${directory.color}`}></div>
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <DocumentTextIcon className='h-5 w-5 text-white' />
                    </div>
                  </div>
                  <div>
                    <h3 className='font-semibold text-slate-800'>{directory.name}</h3>
                    <p className='text-sm text-slate-500'>{directory.description}</p>
                  </div>
                </div>
              </div>

              {/* Process grid */}
              <div className='grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
                {directory.processes.map((process) => (
                  <DirectoryCard key={process.id} process={process} onSelect={() => handleProcessSelect(process.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
