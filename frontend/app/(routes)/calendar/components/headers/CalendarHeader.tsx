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
    <div className='px-4 pt-4'>
      <div className='grid grid-cols-3 items-center px-8'>
        {/* Left navigation */}
        <div className='flex justify-start'>
          <div className='flex overflow-hidden rounded-full bg-slate-100 shadow-sm'>
            {/* Double Previous (Month) */}
            <button
              onClick={prevMonth}
              className='flex h-16 w-16 items-center justify-center transition-colors hover:bg-blue-200'
              aria-label='Previous month'
              title='Previous month'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5' />
              </svg>
            </button>
            <button
              onClick={prevWeek}
              className='flex h-16 w-16 items-center justify-center transition-colors hover:bg-blue-200'
              aria-label='Previous week'
              title='Previous week'
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
          </div>
        </div>

        {/* Date information - center */}
        <div className='flex flex-col items-center justify-center'>
          <h1 className={`text-2xl font-medium ${isToday ? 'text-red-500' : 'text-slate-800'}`}>
            {currentDate.getDate()} {monthName}
            {isToday && <span className='ml-2 rounded-full bg-red-50/50 px-1.5 py-0.5 text-xs font-medium text-red-500'>Today</span>}
          </h1>
          <div className='flex items-center text-lg text-slate-500'>
            <span className='font-medium text-slate-600'>Q{currentQuarter}</span>
            <span className='mx-2 text-slate-300'>•</span>
            <span>Week {currentWeek}</span>
            <span className='mx-2 text-slate-300'>•</span>
            <span>{year}</span>
          </div>
          {/* View toggle - below and centered */}
          <div className='mt-4 flex justify-center'>
            <div className='flex space-x-3'>
              <button
                onClick={isScheduleMode ? toggleCalendarView : undefined}
                className={`rounded-full px-6 py-2 text-base font-medium transition-colors ${
                  isListMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                aria-label='Month view'
                title='Month view'
              >
                Monthly
              </button>
              <button
                onClick={isListMode ? toggleCalendarView : undefined}
                className={`rounded-full px-6 py-2 text-base font-medium transition-colors ${
                  isScheduleMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                aria-label='Week view'
                title='Week view'
              >
                Weekly
              </button>
            </div>
          </div>
        </div>

        {/* Right navigation */}
        <div className='flex justify-end'>
          <div className='flex overflow-hidden rounded-full bg-slate-100 shadow-sm'>
            {/* Next (Week) */}
            <button
              onClick={nextWeek}
              className='flex h-16 w-16 items-center justify-center transition-colors hover:bg-blue-200'
              aria-label='Next week'
              title='Next week'
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
            <button
              onClick={nextMonth}
              className='flex h-16 w-16 items-center justify-center transition-colors hover:bg-blue-200'
              aria-label='Next month'
              title='Next month'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5' />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
