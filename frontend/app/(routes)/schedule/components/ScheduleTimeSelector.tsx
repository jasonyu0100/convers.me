'use client';

import { AvailabilitySlot } from './ScheduleCalendar';
import { dateUtils } from '../../calendar/utils/dateUtils';

interface TimeSelectorProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  availabilityData: any; // Could be array of AvailabilitySlot or object with dates/times
}

export function ScheduleTimeSelector({ selectedDate, selectedTime, onTimeSelect, availabilityData }: TimeSelectorProps) {
  // If no date is selected, show a message
  if (!selectedDate) {
    return <div className='mt-4 p-4 text-center text-slate-500'>Please select a date to view available times</div>;
  }

  // Get available time slots for the selected date
  const dateString = selectedDate.toISOString().split('T')[0];

  // Determine which format the data is in and extract available slots accordingly
  let availableSlots: string[] = [];

  if (Array.isArray(availabilityData)) {
    // Array format
    availableSlots = availabilityData.find((item) => item.date === dateString)?.availableSlots || [];
  } else if (availabilityData && typeof availabilityData === 'object') {
    // Object format with dates property
    if (availabilityData.dates && dateString in availabilityData.dates) {
      availableSlots = availabilityData.dates[dateString] || [];
    }
  }

  // If no available slots for the selected date
  if (availableSlots.length === 0) {
    return <div className='mt-4 p-4 text-center text-slate-500'>No available times for the selected date</div>;
  }

  return (
    <div className='mt-4'>
      <h3 className='mb-2 text-sm font-medium text-slate-700'>Available Times</h3>
      <div className='grid grid-cols-3 gap-2'>
        {availableSlots.map((time) => {
          const isSelected = time === selectedTime;

          return (
            <button
              key={time}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                isSelected ? 'bg-blue-500 text-white' : 'border border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50'
              } `}
              onClick={() => onTimeSelect(time)}
            >
              {dateUtils.formatTime(time)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
