'use client';

import { useEffect, useState } from 'react';

/**
 * Helper functions for date calculations
 */
const calendarUtils = {
  isToday: (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  },

  formatMonthYear: (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  },

  isPastDate: (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  },
};

export interface AvailabilitySlot {
  date: string; // ISO date string
  availableSlots: string[]; // Array of time strings (e.g., "09:00", "10:00")
}

// Use any type here to make it more flexible and accept both array and object formats
export interface CalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  availabilityData: any; // Could be array of AvailabilitySlot or object with dates/times
}

/**
 * A reusable calendar component for selecting dates
 */
export function Calendar({ onDateSelect, selectedDate, availabilityData }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  // Generate calendar days whenever the displayed month changes
  useEffect(() => {
    const days: Date[] = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    // Get the last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Get the day of the week of the first day (0 = Sunday, 6 = Saturday)
    const firstDayWeekday = firstDayOfMonth.getDay();

    // Fill in days from previous month to start the calendar on Sunday
    const daysFromPrevMonth = firstDayWeekday;
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push(day);
    }

    // Fill in all days of the current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    // Fill in days from next month to complete the grid (up to 6 rows)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }

    setCalendarDays(days);
  }, [currentMonth]);

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Check if a date is selected
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
  };

  // Check if a date is in the current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  // Check if a date has available slots
  const hasAvailability = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];

    // Handle array format
    if (Array.isArray(availabilityData)) {
      return availabilityData.some((item) => item.date === dateString && item.availableSlots.length > 0);
    }

    // Handle object format with dates property
    if (availabilityData && typeof availabilityData === 'object' && 'dates' in availabilityData) {
      return dateString in availabilityData.dates && Array.isArray(availabilityData.dates[dateString]) && availabilityData.dates[dateString].length > 0;
    }

    // Default to false if neither format matches
    return false;
  };

  return (
    <div className='rounded-xl bg-slate-50 p-4'>
      <div className='calendar-header mb-4 flex items-center justify-between'>
        <button onClick={prevMonth} className='rounded-full p-2 transition-colors hover:bg-slate-100' aria-label='Previous month'>
          <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='h-5 w-5'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5 8.25 12l7.5-7.5' />
          </svg>
        </button>
        <h2 className='text-md font-medium'>{calendarUtils.formatMonthYear(currentMonth)}</h2>
        <button onClick={nextMonth} className='rounded-full p-2 transition-colors hover:bg-slate-100' aria-label='Next month'>
          <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='h-5 w-5'>
            <path strokeLinecap='round' strokeLinejoin='round' d='m8.25 4.5 7.5 7.5-7.5 7.5' />
          </svg>
        </button>
      </div>

      <div className='calendar-grid'>
        <div className='mb-1 grid grid-cols-7'>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={index} className='text-center text-xs font-medium text-slate-500'>
              {day}
            </div>
          ))}
        </div>

        <div className='grid grid-cols-7 gap-1'>
          {calendarDays.map((date, index) => {
            const dayClasses = [
              'relative h-8 flex items-center justify-center text-sm rounded-full',
              isSelected(date) ? 'bg-blue-500 text-white' : '',
              !isCurrentMonth(date) ? 'text-slate-300' : '',
              calendarUtils.isToday(date) && !isSelected(date) ? 'font-bold text-blue-500' : '',
              calendarUtils.isPastDate(date) ? 'cursor-not-allowed text-slate-300' : 'cursor-pointer hover:bg-slate-100',
              hasAvailability(date) && !isSelected(date) && !calendarUtils.isPastDate(date) && isCurrentMonth(date) ? 'ring-2 ring-blue-200' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={index}
                className={dayClasses}
                onClick={() => {
                  if (!calendarUtils.isPastDate(date) && isCurrentMonth(date) && hasAvailability(date)) {
                    onDateSelect(date);
                  }
                }}
              >
                {date.getDate()}
                {hasAvailability(date) && !calendarUtils.isPastDate(date) && isCurrentMonth(date) && (
                  <span className='absolute bottom-0.5 h-1 w-1 rounded-full bg-blue-500'></span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
