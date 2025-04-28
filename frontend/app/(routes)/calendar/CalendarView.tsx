'use client';

import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { CalendarEventsList } from './components/CalendarEventsList';
import { useCalendar } from './hooks';

/**
 * Calendar content component that uses calendar context
 */
export function CalendarView() {
  const { filter, setFilter, isLoading, error, clearError } = useCalendar();

  if (isLoading) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title='Calendar' />
        <PageLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title='Calendar' />
        <ErrorDisplay error={error} title='Calendar Error' onRetry={clearError} />
      </div>
    );
  }

  return (
    <>
      <AppHeader
        title='Calendar'
        searchPlaceholder='Search events...'
        searchValue={filter}
        onSearchChange={(e) => setFilter((e.target as HTMLInputElement).value)}
      />

      <div className='flex flex-1 overflow-auto bg-white/80'>
        <CalendarEventsList />
      </div>
    </>
  );
}
