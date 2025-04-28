'use client';

import { useCalendar } from '@/app/(routes)/calendar/hooks';
import { AppRoute } from '@/app/components/router';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Divider } from '../../ui';
import { SidePanelActionButton, SidePanelLayout } from '../common';

/**
 * Calendar side panel component
 * Provides month calendar view and event management
 */
export function CalendarSidePanel() {
  // Use the calendar context with default values, wrapped in try/catch for safety
  let calendar;
  try {
    calendar = useCalendar();
  } catch (error) {
    console.error('Failed to load calendar context:', error);
  }

  return (
    <SidePanelLayout>
      <ActionButtons />
      <Divider />
      <MiniCalendar calendar={calendar} />
    </SidePanelLayout>
  );
}

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
 * Mini calendar component with month navigation and event indicators
 * Uses calendar context when available, otherwise uses local state
 * Shows blue dot indicators for days that have events
 */
function MiniCalendar({ calendar }: { calendar: any }) {
  // Check if calendar is defined before destructuring
  if (!calendar) {
    // Return a loading state or default empty state
    return <div className='p-4 text-center text-gray-500'>Loading calendar...</div>;
  }

  // Use context values directly - the context already has default values
  const { currentDate, monthName, year, prevMonth, nextMonth } = calendar;

  // Generate days for the current month
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, currentDate.getMonth(), 1).getDay();

  // Check if a date is today
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  // Check if a date is the selected day
  const isSelectedDay = (day: number) => {
    return day === currentDate.getDate();
  };

  // Handle day click to update selected date in main view
  const handleDayClick = (day: number | null) => {
    if (day === null) return;

    // Set the current date to the selected day but keep the same month/year
    const newDate = new Date(year, currentDate.getMonth(), day);
    calendar.setCurrentDate(newDate);
  };

  // Calendar navigation is now handled only through button clicks

  // Generate calendar days including empty spots for proper alignment
  const calendarDays = Array.from({ length: firstDayOfMonth }, (_, i) => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

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
                : isSelectedDay(day as number)
                ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-400'
                : calendar.getEventsForDate(day as number)
                ? 'font-medium text-slate-800'
                : 'text-slate-500'
            } `}
            onClick={() => handleDayClick(day)}
          >
            {day}
            {/* Event indicator - better styling for days with events */}
            {day !== null && calendar.getEventsForDate(day) && (
              <div className='absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 transform rounded-full bg-blue-500'></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
