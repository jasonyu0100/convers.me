'use client';

import { ArrowLeftIcon, BookmarkIcon, ClockIcon, DocumentTextIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useLibrary } from '../hooks/useLibrary';
import { GradientBackground } from '@/app/components/ui/backgrounds/GradientBackground';
import { LibraryCollectionsList } from './LibraryCollectionsList';

export function LibraryContent() {
  const { collections, selectedCategory, categories, activeCollection, setSelectedCollection } = useLibrary();

  // Get the selected category name
  const categoryName = categories.find((c) => c.id === selectedCategory)?.name || 'All Collections';

  // Display collection grid when no collection is selected
  if (!activeCollection) {
    return (
      <div className='flex h-full w-full flex-col overflow-hidden'>
        {/* Header */}
        <div className='sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur-sm'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <div className='flex items-center'>
                <div className='mr-2 h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500'></div>
                <span className='text-sm font-medium text-slate-900'>{categoryName}</span>
              </div>
            </div>

            <div className='flex space-x-2'>
              <button className='flex items-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm text-white hover:shadow-md'>
                <BookmarkIcon className='mr-1.5 h-4 w-4' />
                Save Collection
              </button>
            </div>
          </div>
        </div>

        {/* Import and use LibraryCollectionsList */}
        <LibraryCollectionsList />
      </div>
    );
  }

  // Display collection detail
  return (
    <div className='flex h-full w-full flex-col overflow-hidden'>
      {/* Header */}
      <div className='sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur-sm'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <button
              onClick={() => setSelectedCollection(null)}
              className='mr-2 flex items-center rounded-full bg-white p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600'
              title='Back to Collections'
            >
              <ArrowLeftIcon className='h-4 w-4' />
            </button>
            <div className='mr-2 h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500'></div>
            <span className='mr-2 text-sm font-medium text-slate-600'>{categoryName} /</span>
            <span className='text-sm font-medium text-slate-900'>Collections</span>
          </div>

          <div className='flex space-x-2'>
            <button className='flex items-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm text-white hover:shadow-md'>
              <BookmarkIcon className='mr-1.5 h-4 w-4' />
              Save Collection
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-auto p-8'>
        {/* Collection header with title, description and tags */}
        <div className='mb-8 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center'>
              <h1 className='text-2xl font-bold text-slate-800'>{activeCollection.title}</h1>
              <button className='ml-2 text-slate-400 hover:text-yellow-500'>
                <StarIcon className='h-5 w-5' />
              </button>
            </div>
          </div>

          <p className='mb-4 text-slate-700'>{activeCollection.description}</p>

          <div className='flex flex-wrap gap-2'>
            {activeCollection.categories.map((category) => (
              <span key={category} className='rounded-full border border-blue-100/50 bg-blue-50/80 px-2.5 py-1 text-xs font-medium text-blue-700'>
                {category.replace('-', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Directories section */}
        <div className='mb-8'>
          <div className='mb-4'>
            <h2 className='text-lg font-semibold text-gray-800'>Directories & Processes</h2>
          </div>

          <div className='space-y-8'>
            {activeCollection.directories.map((directory) => (
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
                    <div
                      key={process.id}
                      className='relative flex aspect-[4/3] cursor-pointer flex-col rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:shadow-md'
                    >
                      {/* Card content with padding */}
                      <div className='flex flex-1 flex-col p-3'>
                        {/* Card header */}
                        <div className='mb-1 flex items-center justify-between'>
                          <h3 className='truncate text-sm font-medium text-slate-800'>{process.title}</h3>
                          <span className='ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800'>Template</span>
                        </div>

                        {/* Description - grows to fill available space */}
                        {process.description ? (
                          <p className='mb-auto line-clamp-2 text-xs text-slate-500' title={process.description}>
                            {process.description}
                          </p>
                        ) : (
                          <div className='mb-auto'></div> /* Spacer if no description */
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
