import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { LibraryCategories } from './components/LibraryCategories';
import { LibraryCollectionDetail } from './components/LibraryCollectionDetail';
import { LibraryCollectionsList } from './components/LibraryCollectionsList';
import { useLibrary } from './hooks/useLibrary';
import { useLibraryHeader } from './hooks/useLibraryHeader';

export function LibraryView() {
  // Get header configuration
  const headerProps = useLibraryHeader();
  const { isLoading, error, clearError, selectedCollection } = useLibrary();

  // Handle loading state
  if (isLoading) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title={headerProps.title} />
        <div className='flex flex-1 items-center justify-center bg-gradient-to-br from-white to-slate-50/80'>
          <PageLoading />
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title={headerProps.title} />
        <div className='flex flex-1 items-center justify-center bg-gradient-to-br from-white to-slate-50/80'>
          <ErrorDisplay error={error} title='Library Collections Error' onRetry={clearError} />
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full w-full flex-col'>
      {/* Header section */}
      <AppHeader
        title={headerProps.title}
        searchPlaceholder={headerProps.searchPlaceholder}
        searchValue={headerProps.searchValue}
        onSearchChange={headerProps.onSearchChange}
        onSearchSubmit={headerProps.onSearchSubmit}
      />

      {/* Main content area */}
      <div className='flex flex-1 overflow-hidden'>
        <LibraryCategories />
        {selectedCollection ? <LibraryCollectionDetail /> : <LibraryCollectionsList />}
      </div>
    </div>
  );
}
