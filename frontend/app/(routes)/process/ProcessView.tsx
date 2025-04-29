import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { ProcessContent, ProcessSidebar } from './components';
import { useProcess } from './hooks/useProcess';
import { useProcessHeader } from './hooks/useProcessHeader';

/**
 * Main view component for the Process section
 * Handles loading and error states, renders the process UI
 */
export function ProcessView() {
  // Get header configuration from the process header hook
  const headerProps = useProcessHeader();
  const { isLoading, error, clearError } = useProcess();

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

  if (error) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title={headerProps.title} />
        <div className='flex flex-1 items-center justify-center bg-gradient-to-br from-white to-slate-50/80'>
          <ErrorDisplay error={error} title='Process Error' onRetry={clearError} />
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

      {/* Main content area with sidebar and process content */}
      <div className='flex flex-1 overflow-hidden'>
        <ProcessSidebar />
        <ProcessContent />
      </div>
    </div>
  );
}
