'use client';

import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { ScheduleDetails } from './components/ScheduleDetails';
import { ScheduleForm } from './components/ScheduleForm';
import { TicketsView } from './components/TicketsView';
import { useSchedule, useScheduleHeader } from './hooks';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Content component that uses the schedule context
 */
export function ScheduleView() {
  const { isLoading, error, clearError } = useSchedule();
  const headerProps = useScheduleHeader();
  const [activeView, setActiveView] = useState<'schedule' | 'tickets'>('schedule');
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read view from URL parameters and switch if needed
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'tickets') {
      setActiveView('tickets');
    }
  }, [searchParams]);

  // Function to handle view switching and update URL
  const handleViewChange = (view: 'schedule' | 'tickets') => {
    setActiveView(view);

    // Update URL to reflect current view (for bookmarking and back button support)
    if (view === 'tickets') {
      router.replace('/schedule?view=tickets');
    } else {
      router.replace('/schedule');
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title={headerProps.title} />
        <PageLoading />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title={headerProps.title} />
        <ErrorDisplay error={error} title='Schedule Error' onRetry={clearError} />
      </div>
    );
  }

  return (
    <div className='flex h-full w-full flex-col'>
      <AppHeader
        title={headerProps.title}
        searchPlaceholder={headerProps.searchPlaceholder}
        searchValue={headerProps.searchValue}
        onSearchChange={headerProps.onSearchChange}
        onSearchSubmit={headerProps.onSearchSubmit}
      />

      <div className='flex border-b border-slate-200 bg-white'>
        <button
          className={`px-6 py-3 font-medium transition-colors duration-200 ${
            activeView === 'schedule' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => handleViewChange('schedule')}
        >
          Schedule
        </button>
        <button
          className={`px-6 py-3 font-medium transition-colors duration-200 ${
            activeView === 'tickets' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => handleViewChange('tickets')}
        >
          Tickets
        </button>
      </div>

      {activeView === 'schedule' ? (
        <div className='flex flex-1 flex-row overflow-auto'>
          <div className='h-full w-1/2 border-r border-slate-200'>
            <ScheduleDetails />
          </div>
          <div className='h-full w-1/2'>
            <ScheduleForm />
          </div>
        </div>
      ) : (
        <TicketsView onBackClick={() => handleViewChange('schedule')} />
      )}
    </div>
  );
}
