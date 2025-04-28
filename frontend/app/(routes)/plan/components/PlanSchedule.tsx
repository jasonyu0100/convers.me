'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { Button } from '@/app/components/ui/buttons';
import { EmptyStateDisplay } from '@/app/components/ui/errors/EmptyStateDisplay';
import { LoadingSpinner } from '@/app/components/ui/loading/LoadingSpinner';
import { ProgressBar } from '@/app/components/ui/stats/ProgressBar';
import { plan } from '@/app/types/api-types';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';
import { usePlan } from '../hooks';

/**
 * Memoized day event component - renders a clickable event card
 */
const DayEvent = React.memo(({ event, onEventClick }: { event: plan.PlanEvent; onEventClick: (eventId: string) => void }) => {
  const startTime = parseISO(event.startTime);
  const timeString = format(startTime, 'h:mm a');

  // Interactive card wrapper with hover and active state animations
  return (
    <button
      type='button'
      className='group flex w-full cursor-pointer items-center rounded-lg border border-slate-200 bg-white/90 p-3 text-left transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md active:translate-y-[1px]'
      onClick={() => onEventClick(event.id)}
    >
      <div className='flex-1'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-slate-700 group-hover:text-blue-700'>{event.title}</span>
          <span className='text-xs text-slate-500'>{timeString}</span>
        </div>
        <div className='mt-1.5 flex items-center gap-2'>
          {event.effort && (
            <div className='rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700'>
              {event.effort.charAt(0).toUpperCase() + event.effort.slice(1)} Effort
            </div>
          )}
          <div className='text-xs text-slate-500'>{event.processId.replace('process-', '')}</div>
        </div>
      </div>
    </button>
  );
});
DayEvent.displayName = 'DayEvent';

// Memoized day section component
const DaySection = React.memo(
  ({
    dayIndex,
    dayEvents,
    currentDayOfWeek,
    dateStr,
    getDayLetter,
    formatDate,
    onEventClick,
  }: {
    dayIndex: number;
    dayEvents: plan.PlanEvent[];
    currentDayOfWeek: number;
    dateStr: string;
    getDayLetter: (day: number) => string;
    formatDate: (dateStr: string) => string;
    onEventClick: (eventId: string) => void;
  }) => {
    const isCurrentDay = dayIndex === currentDayOfWeek;

    return (
      <div className='flex' key={dayIndex}>
        <div className='mr-4 flex flex-col items-center'>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
              isCurrentDay
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 ring-4 ring-blue-100'
                : dayIndex < currentDayOfWeek
                ? 'bg-slate-400'
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}
          >
            <span className='text-xs font-medium'>{getDayLetter(dayIndex)}</span>
          </div>
          {dayIndex < 6 && <div className='h-full w-0.5 bg-slate-200'></div>}
        </div>

        <div className='flex-1'>
          <div className={`rounded-xl p-4 ${isCurrentDay ? 'bg-white shadow-md' : 'bg-white shadow-sm'}`}>
            <div className='mb-2 flex items-center'>
              <span className={`text-sm font-medium ${isCurrentDay ? 'text-blue-700' : 'text-slate-700'}`}>{formatDate(dateStr)}</span>
              {isCurrentDay && (
                <span className='ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700'>
                  <span className='flex items-center'>
                    <span className='mr-1 flex h-2 w-2 rounded-full bg-amber-500'></span>
                    Today
                  </span>
                </span>
              )}
            </div>

            <div className='space-y-2'>
              {dayEvents.map((event) => (
                <DayEvent key={event.id} event={event} onEventClick={onEventClick} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  },
);
DaySection.displayName = 'DaySection';

/**
 * Component that displays the generated weekly schedule
 */
const PlanSchedule = React.memo(() => {
  const { generatedEvents, hasGeneratedPlan, isSubmitting, formState } = usePlan();
  const app = useApp();
  const router = useRouter();

  // Memoize navigation handler to avoid recreating on every render
  const handleEventClick = useCallback(
    (eventId: string) => {
      router.push(`/room?id=${eventId}`);
      app.setMainView(AppRoute.ROOM);
    },
    [app, router],
  );

  // Memoize calendar button handler
  const handleCalendarClick = useCallback(() => {
    app.setMainView(AppRoute.CALENDAR);
    router.push('/calendar');
  }, [app, router]);

  // Memoize schedule button handler
  const handleScheduleClick = useCallback(() => {
    app.setMainView(AppRoute.SCHEDULE);
    router.push('/schedule');
  }, [app, router]);

  // Get current day of week - memoize to avoid recalculation
  const currentDayOfWeek = useMemo(() => new Date().getDay(), []);

  // Memoize grouping function to prevent recalculation on each render
  const groupedEvents = useMemo(() => {
    return generatedEvents.reduce((acc, event) => {
      const date = new Date(event.startTime);
      const dayOfWeek = date.getDay();
      if (!acc[dayOfWeek]) {
        acc[dayOfWeek] = [];
      }
      acc[dayOfWeek].push(event);
      return acc;
    }, {} as Record);
  }, [generatedEvents]);

  // Memoize helper functions
  const getDayLetter = useCallback((day: number) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days[day];
  }, []);

  // Memoize date formatting function
  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateDay = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });

    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return `${month} ${dateDay}`;
    }
  }, []);

  // Create week sections with useMemo outside of conditional rendering
  const weekSections = useMemo(() => {
    return Array.from({ length: 7 }).map((_, dayIndex) => {
      const dayEvents = groupedEvents[dayIndex] || [];
      if (dayEvents.length === 0) return null;

      const dateStr = dayEvents[0]?.startTime || '';

      return (
        <DaySection
          key={dayIndex}
          dayIndex={dayIndex}
          dayEvents={dayEvents}
          currentDayOfWeek={currentDayOfWeek}
          dateStr={dateStr}
          getDayLetter={getDayLetter}
          formatDate={formatDate}
          onEventClick={handleEventClick}
        />
      );
    });
  }, [groupedEvents, currentDayOfWeek, getDayLetter, formatDate, handleEventClick]);

  if (isSubmitting && !hasGeneratedPlan) {
    return (
      <div className='flex h-full flex-col items-center justify-center'>
        <LoadingSpinner size='lg' text='Generating Your Plan' />
        <p className='mt-3 max-w-md text-center text-slate-500'>
          Our AI is analyzing your goals, effort level, and template preferences to create an optimized weekly schedule...
        </p>

        <div className='mt-8 w-72'>
          <ProgressBar label='Analyzing requirements' value={100} max={100} color='bg-blue-500' height='h-2' />

          <div className='mt-4'>
            <ProgressBar label='Scheduling events' value={75} max={100} color='bg-blue-500' height='h-2' />
          </div>

          <div className='mt-4'>
            <ProgressBar label='Optimizing plan' value={45} max={100} color='bg-blue-500' height='h-2' />
          </div>

          {formState.autoGenerateProcess && (
            <div className='mt-4'>
              <ProgressBar label='Generating processes' value={20} max={100} color='bg-blue-500' height='h-2' />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!hasGeneratedPlan) {
    return (
      <EmptyStateDisplay
        title='Ready to Plan Your Week?'
        description="Fill out your preferences on the left and click 'Generate Weekly Plan' to create a personalized schedule optimized for your goals and available hours."
        icon={
          <div className='rounded-full bg-gradient-to-br from-slate-100 to-slate-200 p-8 shadow-inner'>
            <svg xmlns='http://www.w3.org/2000/svg' className='h-16 w-16 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
          </div>
        }
        className='p-6'
      />
    );
  }

  return (
    <div className='flex h-full w-full flex-shrink-0 flex-col bg-white/80 p-6 shadow-sm backdrop-blur-xl'>
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='text-sm font-semibold tracking-wider text-slate-700 uppercase'>
          <span className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>Weekly Schedule</span>
        </h2>
        <Button
          variant='text'
          size='sm'
          onClick={handleCalendarClick}
          className='rounded-full px-2.5 py-1 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
          icon={
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='h-3 w-3'
            >
              <path d='m9 18 6-6-6-6' />
            </svg>
          }
          iconPosition='right'
        >
          All Events
        </Button>
      </div>

      {/* Render the content section conditionally */}
      <div className='flex-1 overflow-auto'>
        {isSubmitting ? (
          <div className='py-4 text-center text-gray-500'>
            <div className='inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600'></div>
            <p className='mt-2 text-sm'>Loading schedule...</p>
          </div>
        ) : generatedEvents.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-10 text-center'>
            <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50'>
              <CalendarDaysIcon className='h-8 w-8 text-blue-400' />
            </div>
            <p className='text-sm font-medium text-slate-600'>No upcoming events this week</p>
            <p className='mt-1.5 mb-3 max-w-[220px] text-xs text-slate-500'>Generate a plan to fill your week</p>
          </div>
        ) : (
          <div className='space-y-4 overflow-auto' style={{ maxHeight: 'calc(100% - 160px)' }}>
            {/* Week Overview */}
            {/* Using useMemo outside of conditional rendering */}
            {weekSections}
          </div>
        )}
      </div>

      <div className='mt-auto pt-6'>
        <Button
          variant='primary'
          size='lg'
          fullWidth
          onClick={handleScheduleClick}
          icon={<CalendarDaysIcon className='h-4 w-4' />}
          className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
        >
          Schedule New Event
        </Button>
      </div>
    </div>
  );
});
PlanSchedule.displayName = 'PlanSchedule';

export { PlanSchedule };
