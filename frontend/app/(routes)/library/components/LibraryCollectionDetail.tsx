'use client';

import { ArrowLeftIcon, BookmarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { useState } from 'react';
import { GradientBackground } from '../../../components/ui/backgrounds/GradientBackground';
import { useLibrary } from '../hooks/useLibrary';
import { LibraryDirectoryCard } from './LibraryDirectoryCard';

export function LibraryCollectionDetail() {
  const { activeCollection, setSelectedCollection, saveCollection } = useLibrary();

  const [isSaved, setIsSaved] = useState(false);

  if (!activeCollection) {
    return null;
  }

  const handleSave = () => {
    saveCollection(activeCollection.id);
    setIsSaved(!isSaved);
  };

  const handleBack = () => {
    setSelectedCollection(null);
  };

  return (
    <div className='flex-1 overflow-auto bg-gray-50 pb-10'>
      {/* Header */}
      <div className='relative h-64 w-full'>
        {/* Gradient Background */}
        <div className='absolute inset-0' style={{ zIndex: 0 }}>
          <GradientBackground
            intensity='vibrant'
            color={activeCollection.id.includes('team') ? 'purple' : activeCollection.id.includes('personal') ? 'teal' : 'blue'}
            shapes={true}
            animated={true}
          />
        </div>

        {/* Overlay */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/40 to-transparent' style={{ zIndex: 1 }}></div>

        <div className='absolute inset-x-0 bottom-0 p-8' style={{ zIndex: 2 }}>
          <button
            className='mb-4 flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30'
            onClick={handleBack}
          >
            <ArrowLeftIcon className='h-4 w-4' />
            Back to Library
          </button>

          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-white'>{activeCollection.title}</h1>
              <p className='mt-1 max-w-3xl text-white/80'>{activeCollection.description}</p>
            </div>
            <button
              onClick={handleSave}
              className='flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-gray-50'
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

          {/* Collection meta */}
          <div className='mt-4 flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              {activeCollection.author.avatar ? (
                <Image src={activeCollection.author.avatar} alt={activeCollection.author.name} width={24} height={24} className='rounded-full' />
              ) : (
                <div className='flex h-6 w-6 items-center justify-center rounded-full bg-white/20'>
                  <UserIcon className='h-4 w-4 text-white' />
                </div>
              )}
              <span className='text-sm text-white/90'>{activeCollection.author.name}</span>
            </div>

            <div className='flex items-center gap-2 text-sm text-white/90'>
              <BookmarkSolid className='h-4 w-4 text-white/90' />
              <span>{activeCollection.popularity.toLocaleString()} saves</span>
            </div>

            <div className='flex flex-wrap gap-2'>
              {activeCollection.categories.map((category) => (
                <span
                  key={category}
                  className='rounded-full border border-white/10 bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm backdrop-blur-sm'
                >
                  {category.replace('-', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='px-8 py-10'>
        <div className='mb-6'>
          <h2 className='text-xl font-bold text-gray-900'>Directories & Processes</h2>
          <p className='text-gray-600'>This collection contains {activeCollection.directories.length} directories with various processes.</p>
        </div>

        <div className='space-y-10'>
          {activeCollection.directories.map((directory) => (
            <LibraryDirectoryCard key={directory.id} directory={directory} />
          ))}
        </div>
      </div>
    </div>
  );
}
