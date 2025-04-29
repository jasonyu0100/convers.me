'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { CalendarService } from '@/app/services';
import { EventSchema } from '@/app/types/schema';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Divider } from '../../ui';
import { SidePanelActionButton, SidePanelLayout } from '../common';
import { DefaultSidePanelProps } from '../types';

/**
 * Sidebar action buttons for quick access to common functions
 */
function ActionButtons() {
  return (
    <div className='flex flex-col space-y-3'>
      <SidePanelActionButton
        label='Plan Week'
        icon={<CalendarDaysIcon className='size-6' />}
        route='/plan'
        appRoute={AppRoute.PLAN}
        bgColor='bg-gradient-to-r from-slate-500 to-slate-600'
        hoverColor='hover:from-slate-600 hover:to-slate-700'
      />
      <SidePanelActionButton
        label='Schedule Time'
        icon={<MapPinIcon className='size-6' />}
        route='/schedule'
        appRoute={AppRoute.SCHEDULE}
        bgColor='bg-gradient-to-r from-blue-500 to-blue-600'
        hoverColor='hover:from-blue-600 hover:to-blue-700'
      />
    </div>
  );
}

/**
 * Mini calendar component that redirects to the calendar page with the selected date
 * Uses CalendarService directly to fetch events and show event indicators
 */
function MiniCalendar() {
  const router = useRouter();
  const app = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get month name and year
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  // Calculate date range for the current month view
  const dateRange = useMemo(() => {
    const month = currentDate.getMonth();

    // Start date is first day of current month
    const startDate = new Date(year, month, 1);

    // End date is last day of current month
    const endDate = new Date(year, month + 1, 0);

    // Format dates for API
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    return { startDateStr, endDateStr };
  }, [currentDate, year]);

  // Fetch events with React Query
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['miniCalendarEvents', dateRange.startDateStr, dateRange.endDateStr],
    queryFn: async () => {
      const result = await CalendarService.getCalendarEvents(dateRange.startDateStr, dateRange.endDateStr);

      if (result.error) {
        console.error('Error fetching calendar events:', result.error);
        return [];
      }

      return result.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Create a set of dates that have events
  const eventDates = useMemo(() => {
    const dateSet = new Set<string>();

    events.forEach((event: EventSchema) => {
      // Use startTime if available, otherwise fall back to date
      const eventDate = event.startTime ? new Date(event.startTime) : event.date ? new Date(event.date) : null;
      if (eventDate) {
        const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
        dateSet.add(dateKey);
      }
    });

    return dateSet;
  }, [events]);

  // Helper function to check if a specific date has events
  const hasEventsForDate = useCallback(
    (day: number): boolean => {
      if (!day) return false;

      const dateKey = `${year}-${currentDate.getMonth()}-${day}`;
      return eventDates.has(dateKey);
    },
    [currentDate, year, eventDates],
  );

  // Month navigation handlers
  const nextMonth = useCallback(() => {
    const nextMonthIndex = currentDate.getMonth() + 1;
    const yearToUse = nextMonthIndex > 11 ? year + 1 : year;
    const monthToUse = nextMonthIndex > 11 ? 0 : nextMonthIndex;

    // Always set to first day of month
    setCurrentDate(new Date(yearToUse, monthToUse, 1));
  }, [currentDate, year]);

  const prevMonth = useCallback(() => {
    const prevMonthIndex = currentDate.getMonth() - 1;
    const yearToUse = prevMonthIndex < 0 ? year - 1 : year;
    const monthToUse = prevMonthIndex < 0 ? 11 : prevMonthIndex;

    // Always set to first day of month
    setCurrentDate(new Date(yearToUse, monthToUse, 1));
  }, [currentDate, year]);

  // Check if a date is today
  const isToday = useCallback(
    (day: number) => {
      if (!day) return false;
      const today = new Date();
      return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    },
    [currentDate],
  );

  // Handle day click to navigate to calendar page with selected date in WEEK mode
  const handleDayClick = useCallback(
    (day: number | null) => {
      if (day === null) return;

      // Create date object for the selected day with time set to noon to avoid timezone issues
      // Using noon ensures we're in the middle of the day and won't accidentally shift to another day
      const selectedDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day, 12, 0, 0));

      // Format date manually to ensure the correct day
      const year = selectedDate.getUTCFullYear();
      const month = String(selectedDate.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-based
      const dayStr = String(selectedDate.getUTCDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${dayStr}`;

      // Navigate to calendar page with the selected date and set to WEEK mode
      // This ensures the user sees the week containing the day they clicked
      app.setMainView(AppRoute.CALENDAR);
      router.push(`/calendar?date=${formattedDate}&mode=WEEK`);
    },
    [app, router, currentDate],
  );

  // Generate calendar data
  const { calendarDays } = useMemo(() => {
    // Generate days for the current month
    const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, currentDate.getMonth(), 1).getDay();

    // Generate calendar days including empty spots for proper alignment
    const calendarDays = Array.from({ length: firstDayOfMonth }, (_, i) => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

    return { calendarDays, firstDayOfMonth, daysInMonth };
  }, [currentDate, year]);

  return (
    <div className='rounded-xl bg-white/80 p-4 shadow-sm'>
      {/* Month selector with transitions */}
      <div className='mb-4 flex items-center justify-between'>
        <button
          onClick={prevMonth}
          className='rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700'
          aria-label='Previous month'
        >
          <ChevronLeftIcon className='size-5' />
        </button>

        <div className='relative h-7 flex-1 overflow-hidden text-center'>
          <h2 className='text-base font-semibold text-slate-800 transition-opacity duration-200'>
            {monthName} {year}
          </h2>
        </div>

        <button
          onClick={nextMonth}
          className='rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700'
          aria-label='Next month'
        >
          <ChevronRightIcon className='size-5' />
        </button>
      </div>

      {/* Weekday headers */}
      <div className='mb-2 grid grid-cols-7'>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className='text-center text-xs font-medium text-slate-500'>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid with transition effects */}
      <div className='grid grid-cols-7 gap-1.5 transition-opacity duration-150'>
        {calendarDays.map((day, i) => (
          <div
            key={i}
            className={`relative flex h-8 w-8 transform items-center justify-center rounded-full text-sm transition-all duration-150 ${
              day === null ? 'pointer-events-none opacity-0' : 'cursor-pointer hover:bg-slate-100'
            } ${
              isToday(day as number)
                ? 'bg-blue-100 font-bold text-blue-700 shadow-sm'
                : hasEventsForDate(day as number)
                ? 'font-medium text-slate-800'
                : 'text-slate-500'
            } `}
            onClick={() => handleDayClick(day)}
          >
            {day}
            {/* Event indicator - blue dot for days with events */}
            {day !== null && hasEventsForDate(day) && (
              <div className='absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 transform rounded-full bg-blue-500'></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Default side panel component
 * Shown when no specific route panel is active
 */
export function DefaultSidePanel({ title }: DefaultSidePanelProps) {
  return (
    <SidePanelLayout>
      {title && <h2 className='mb-4 text-lg font-bold text-slate-700'>{title}</h2>}
      <ActionButtons />
      <Divider />
      <MiniCalendar />
    </SidePanelLayout>
  );
}
