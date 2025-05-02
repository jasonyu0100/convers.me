import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { MarketContent, MarketSidebar } from './components';
import { useMarket } from './hooks/useMarket';
import { useMarketHeader } from './hooks/useMarketHeader';

/**
 * Main view component for the Library section
 * Handles the layout and error/loading states for the library module
 */
export function MarketView() {
  // Get header configuration from the library header hook
  const headerProps = useMarketHeader();
  const { isLoading, error, clearError } = useMarket();

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

      {/* Main content area with sidebar and library content */}
      <div className='flex flex-1 overflow-hidden'>
        <MarketSidebar />
        <MarketContent />
      </div>
    </div>
  );
}
