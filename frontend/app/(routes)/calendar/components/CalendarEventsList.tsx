'use client';
import { CalendarMode } from '../../../types/calendar';
import { useCalendar } from '../hooks';
import { CalendarHeader } from './headers/CalendarHeader';
import { CalendarMonthView } from './month/CalendarMonthView';
import { CalendarWeekView } from './week/CalendarWeekView';

/**
 * Main component: List of calendar events, grouped by date
 */
export function CalendarEventsList() {
  const { mode } = useCalendar();

  return (
    <div className='relative flex h-full w-full flex-col'>
      <CalendarHeader />
      <div className='relative flex flex-1 flex-col overflow-hidden px-6 pt-6'>
        {mode === CalendarMode.MONTH && <CalendarMonthView />}
        {mode === CalendarMode.WEEK && <CalendarWeekView />}
      </div>
    </div>
  );
}
