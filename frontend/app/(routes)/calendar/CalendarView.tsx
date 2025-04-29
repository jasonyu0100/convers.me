'use client';

import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { CalendarMode } from '@/app/types/calendar';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { CalendarEventsList } from './components/CalendarEventsList';
import { useCalendar } from './hooks';

/**
 * URLParamsHandler component to process URL parameters
 */
function URLParamsHandler() {
  const searchParams = useSearchParams();
  const { setCurrentDate, setMode } = useCalendar();

  useEffect(() => {
    // Check for date param in URL
    const dateParam = searchParams.get('date');
    if (dateParam) {
      try {
        // Parse the date (expected format: YYYY-MM-DD)
        const parsedDate = new Date(dateParam);

        // Verify it's a valid date
        if (!isNaN(parsedDate.getTime())) {
          setCurrentDate(parsedDate);
        }
      } catch (error) {
        console.error('Error parsing date from URL:', error);
      }
    }

    // Check for mode param in URL
    const modeParam = searchParams.get('mode');
    if (modeParam === 'WEEK' || modeParam === 'MONTH') {
      // Use the CalendarMode enum imported at the top
      setMode(modeParam === 'WEEK' ? CalendarMode.WEEK : CalendarMode.MONTH);
    }
  }, [searchParams, setCurrentDate, setMode]);

  return null;
}

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
      {/* Process URL parameters */}
      <URLParamsHandler />

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
