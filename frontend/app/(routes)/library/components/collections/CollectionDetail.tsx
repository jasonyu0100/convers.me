'use client';

import { BookmarkIcon, DocumentTextIcon, UserIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { useState } from 'react';
import { useLibrary } from '../../hooks/useLibrary';
import { Collection } from '../../types';
import { DirectoryCard } from '../cards/DirectoryCard';
import logger from '@/app/lib/logger';

interface CollectionDetailProps {
  collection: Collection;
}

/**
 * Component that displays the details of a collection including its directories and processes
 */
export function CollectionDetail({ collection }: CollectionDetailProps) {
  const { handleProcessSelect, saveCollection } = useLibrary();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaved || isSaving) return;

    try {
      setIsSaving(true);
      // Call the save function from the library context
      await saveCollection(collection.id);
      // Mark as saved after successful save
      setIsSaved(true);
    } catch (error) {
      // Enhanced error logging
      logger.error('Error saving collection', {
        collectionId: collection.id,
        collectionTitle: collection.title,
        error,
      });

      // Show user-friendly error as alert (could be replaced with a toast notification)
      alert(`Failed to save collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Get background color based on collection categories
  const getBgColor = (categories: string[]) => {
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return 'blue';
    }

    // Return color based on the first category
    const mainCategory = categories[0];
    switch (mainCategory) {
      case 'project-management':
        return 'blue';
      case 'design':
        return 'purple';
      case 'research':
        return 'indigo';
      case 'engineering':
        return 'teal';
      case 'product':
        return 'orange';
      case 'marketing':
        return 'red';
      case 'management':
        return 'emerald';
      default:
        return 'blue';
    }
  };

  return (
    <div className='flex-1 overflow-auto p-6'>
      {/* Collection header with title, description and tags */}
      <div className='mb-8'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center'>
            <h1 className='text-xl font-medium text-slate-700'>{collection.title}</h1>
            <button className='ml-2 text-slate-400 hover:text-yellow-500'>
              <StarIconSolid className='h-5 w-5 text-yellow-500' />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaved || isSaving}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              isSaved ? 'cursor-default bg-blue-50 text-blue-600' : isSaving ? 'cursor-wait text-slate-500' : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkSolid className='h-4 w-4 text-blue-600' />
                Added to Library
              </>
            ) : isSaving ? (
              <>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500' />
                Saving...
              </>
            ) : (
              <>
                <BookmarkIcon className='h-4 w-4' />
                Save Collection
              </>
            )}
          </button>
        </div>

        <p className='mb-4 text-sm text-slate-600'>{collection.description}</p>

        <div className='flex flex-wrap gap-2'>
          {collection.categories &&
            collection.categories.length > 0 &&
            collection.categories.map((category) => {
              // Get color variation based on category
              let colorClass = 'border-blue-100/50 bg-blue-50/80 text-blue-700';
              switch (category) {
                case 'project-management':
                  colorClass = 'border-blue-100/50 bg-blue-50/80 text-blue-700';
                  break;
                case 'design':
                  colorClass = 'border-purple-100/50 bg-purple-50/80 text-purple-700';
                  break;
                case 'research':
                  colorClass = 'border-indigo-100/50 bg-indigo-50/80 text-indigo-700';
                  break;
                case 'engineering':
                  colorClass = 'border-teal-100/50 bg-teal-50/80 text-teal-700';
                  break;
                case 'product':
                  colorClass = 'border-orange-100/50 bg-orange-50/80 text-orange-700';
                  break;
                case 'marketing':
                  colorClass = 'border-red-100/50 bg-red-50/80 text-red-700';
                  break;
                case 'management':
                  colorClass = 'border-emerald-100/50 bg-emerald-50/80 text-emerald-700';
                  break;
              }

              return (
                <span key={category} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${colorClass}`}>
                  {category.replace(/-/g, ' ')}
                </span>
              );
            })}
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
            <span>{collection.saves.toLocaleString()} saves</span>
          </div>
        </div>
      </div>

      {/* Directories section */}
      <div className='mb-8'>
        <div className='mb-4'>
          <h2 className='text-base font-medium text-slate-700'>Directories & Processes</h2>
        </div>

        <div className='space-y-6'>
          {collection.directories.map((directory) => (
            <div key={directory.id} className='mb-6'>
              {/* Directory header */}
              <div className='mb-4 flex items-center justify-between border-b border-slate-100 pb-1'>
                <div className='flex items-center gap-3'>
                  <div className='relative flex h-8 w-8 items-center justify-center overflow-hidden rounded'>
                    <div className={`h-8 w-8 bg-gradient-to-r ${directory.color}`}></div>
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <DocumentTextIcon className='h-4 w-4 text-white' />
                    </div>
                  </div>
                  <div>
                    <h3 className='font-medium text-slate-700'>{directory.name}</h3>
                    <p className='text-xs text-slate-500'>{directory.description}</p>
                  </div>
                </div>
              </div>

              {/* Process grid */}
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
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
