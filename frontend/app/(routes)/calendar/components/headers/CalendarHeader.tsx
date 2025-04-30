'use client';

import { useCallback } from 'react';
import { CalendarMode } from '../../../../types/calendar';
import { useCalendar } from '../../hooks';
import { dateUtils } from '../../utils/dateUtils';

/**
 * Header showing current date, month, year and time information
 * Also contains navigation controls
 */
export function CalendarHeader() {
  const { mode, setMode, monthName, year, currentDate, prevWeek, nextWeek, prevEvent, nextEvent, prevMonth, nextMonth, createNewEvent } = useCalendar();

  // Calculate current quarter and week
  const currentQuarter = dateUtils.getQuarter(currentDate);
  const currentWeek = dateUtils.getWeekNumber(currentDate);

  // Check if current date is today
  const isToday = dateUtils.isToday(currentDate);

  // Toggle between List and Schedule view
  const toggleCalendarView = useCallback(() => {
    if (mode === CalendarMode.MONTH) {
      setMode(CalendarMode.WEEK);
    } else {
      setMode(CalendarMode.MONTH);
    }
  }, [mode, setMode]);

  // Determine active mode for styling
  const isListMode = mode === CalendarMode.MONTH;
  const isScheduleMode = mode === CalendarMode.WEEK;

  return (
    <div className='border-b border-slate-100 p-3'>
      <div className='flex items-center justify-between'>
        {/* Left navigation */}
        <div className='flex items-center space-x-2'>
          <button
            onClick={prevMonth}
            className='flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100'
            aria-label='Previous month'
            title='Previous month'
          >
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
            >
              <polyline points='15 18 9 12 15 6'></polyline>
            </svg>
          </button>

          {/* Date information */}
          <div className='flex items-center'>
            <h1 className={`text-base font-medium ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
              {monthName} {year}
              {isToday && <span className='ml-2 text-xs font-medium text-blue-500'>• Today</span>}
            </h1>
          </div>

          <button
            onClick={nextMonth}
            className='flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100'
            aria-label='Next month'
            title='Next month'
          >
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
            >
              <polyline points='9 18 15 12 9 6'></polyline>
            </svg>
          </button>
        </div>

        {/* View toggle */}
        <div className='flex overflow-hidden rounded-md'>
          <button
            onClick={isScheduleMode ? toggleCalendarView : undefined}
            className={`px-3 py-1.5 text-xs font-medium ${isListMode ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            aria-label='Month view'
            title='Month view'
          >
            Month
          </button>
          <button
            onClick={isListMode ? toggleCalendarView : undefined}
            className={`px-3 py-1.5 text-xs font-medium ${isScheduleMode ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            aria-label='Week view'
            title='Week view'
          >
            Week
          </button>
        </div>
      </div>
    </div>
  );
}
