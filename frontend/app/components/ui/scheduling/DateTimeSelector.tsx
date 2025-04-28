'use client';

import { Calendar } from './Calendar';
import { TimeSelector } from './TimeSelector';

export interface DateTimeSelectorProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  availabilityData: any;
  className?: string;
}

/**
 * A combined date and time selector component
 */
export function DateTimeSelector({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  availabilityData,
  className = 'bg-slate-50 p-4 rounded-xl',
}: DateTimeSelectorProps) {
  return (
    <div className={className}>
      <Calendar onDateSelect={onDateSelect} selectedDate={selectedDate} availabilityData={availabilityData} />

      <TimeSelector selectedDate={selectedDate} selectedTime={selectedTime} onTimeSelect={onTimeSelect} availabilityData={availabilityData} />
    </div>
  );
}
