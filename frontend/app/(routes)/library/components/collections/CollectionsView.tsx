'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useLibrary } from '../../hooks/useLibrary';
import { CollectionDetail } from './CollectionDetail';
import { CollectionsList } from './CollectionsList';

/**
 * Header component for the collections view
 */
function CollectionsHeader({ categoryName, isDetailView = false, onBack, onSave, collectionTitle }) {
  return (
    <div className='sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur-sm'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          {isDetailView && (
            <button
              onClick={onBack}
              className='mr-2 flex items-center rounded-full bg-white p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600'
              title='Back to Collections'
            >
              <ArrowLeftIcon className='h-4 w-4' />
            </button>
          )}
          {isDetailView ? (
            <>
              <span className='mr-2 text-sm font-medium text-slate-600'>{categoryName} /</span>
              <span className='text-sm font-medium text-slate-900'>{collectionTitle || 'Collections'}</span>
            </>
          ) : (
            <span className='text-sm font-medium text-slate-900'>{categoryName}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main content component that displays either a list of collections or a collection detail
 */
export function CollectionsView() {
  const { collections, selectedCategory, categories, activeCollection, setSelectedCollection, saveCollection } = useLibrary();

  // Get the selected category name
  const categoryName = categories.find((c) => c.id === selectedCategory)?.name || 'All Collections';

  const handleSaveCollection = () => {
    if (activeCollection) {
      saveCollection(activeCollection.id);
    }
  };

  // Display collection grid when no collection is selected
  if (!activeCollection) {
    return (
      <div className='flex h-full w-full flex-col overflow-hidden'>
        <CollectionsHeader categoryName={categoryName} onSave={handleSaveCollection} />
        <CollectionsList collections={collections} />
      </div>
    );
  }

  // Display collection detail
  return (
    <div className='flex h-full w-full flex-col overflow-hidden'>
      <CollectionsHeader
        categoryName={categoryName}
        isDetailView={true}
        onBack={() => setSelectedCollection(null)}
        onSave={handleSaveCollection}
        collectionTitle={activeCollection.title}
      />
      <CollectionDetail collection={activeCollection} />
    </div>
  );
}
