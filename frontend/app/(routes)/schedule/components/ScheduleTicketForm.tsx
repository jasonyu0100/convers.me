'use client';

import { Button } from '@/app/components/ui/buttons/Button';
import { SelectField } from '@/app/components/ui/inputs/SelectField';
import { ProcessTemplate, ScheduledTicket, Ticket } from '@/app/types/connect';
import React, { memo, useCallback } from 'react';
import { dateUtils } from '../../calendar/utils/dateUtils';
import { ScheduleCalendar } from './ScheduleCalendar';
import { ScheduleTimeSelector } from './ScheduleTimeSelector';

interface ScheduleTimeRange {
  startTime: string;
  endTime: string;
}

interface ScheduleTicketFormProps {
  weekDays: string[];
  selectedDay: string;
  onDayChange: (day: string) => void;
  scheduleTimes: ScheduleTimeRange;
  onScheduleTimesChange: (times: ScheduleTimeRange) => void;
  processTemplates: ProcessTemplate[];
  selectedTemplate: string | undefined;
  onTemplateChange: (templateId: string) => void;
  autoCreateProcess: boolean;
  onAutoCreateProcessChange: (value: boolean) => void;
  onSubmit: (day: string, startTime: string, endTime: string, template: string, createProcess: boolean) => void;
  isSubmitDisabled: boolean;
  getScheduleForDay: (day: string) => ScheduledTicket[];
  formatDate: (date: string) => string;
  formatShortDate: (date: string) => string;
  onCreateProcess: (ticket: Ticket) => void;
  selectedCalendarDate: Date | null;
  selectedTime: string | null;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
}

/**
 * Schedule form component for scheduling tickets
 */
export const ScheduleTicketForm = memo(function ScheduleTicketForm({
  weekDays,
  selectedDay,
  onDayChange,
  scheduleTimes,
  onScheduleTimesChange,
  processTemplates,
  selectedTemplate,
  onTemplateChange,
  autoCreateProcess,
  onAutoCreateProcessChange,
  onSubmit,
  isSubmitDisabled,
  getScheduleForDay,
  formatDate,
  formatShortDate,
  onCreateProcess,
  selectedCalendarDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
}: ScheduleTicketFormProps) {
  const [availabilityData, setAvailabilityData] = React.useState<any>(() => {
    return dateUtils.generateAvailabilityData(
      weekDays,
      8, // start hour
      18, // end hour
      30, // interval in minutes
    );
  });

  // Handle time selection with calculated end time
  const handleTimeSelect = useCallback(
    (time: string) => {
      onTimeSelect(time);

      // Calculate end time (1 hour after start time)
      const endTime = dateUtils.calculateEndTime(time);

      // Update schedule times
      onScheduleTimesChange({
        startTime: time,
        endTime: endTime,
      });
    },
    [onTimeSelect, onScheduleTimesChange],
  );

  const handleTemplateChange = useCallback(
    (e: React.ChangeEvent) => {
      onTemplateChange(e.target.value);
    },
    [onTemplateChange],
  );

  const handleAutoCreateChange = useCallback(
    (e: React.ChangeEvent) => {
      onAutoCreateProcessChange(e.target.checked);
    },
    [onAutoCreateProcessChange],
  );

  // Handle form submission
  const handleSubmit = useCallback(() => {
    onSubmit(selectedDay, scheduleTimes.startTime, scheduleTimes.endTime, selectedTemplate || '', autoCreateProcess);
  }, [selectedDay, scheduleTimes, selectedTemplate, autoCreateProcess, onSubmit]);

  // Format options for template dropdown
  const templateOptions = [
    { value: '', label: 'None' },
    ...processTemplates.map((template) => ({
      value: template.id,
      label: template.title,
    })),
  ];

  return (
    <div className='h-full w-full overflow-auto'>
      <div className='flex h-full w-full flex-col p-6'>
        <div className='mx-auto w-full max-w-xl space-y-6'>
          <div className='mb-6 text-center'>
            <h2 className='text-2xl font-bold text-slate-800'>Schedule Time</h2>
          </div>

          <div className='grid grid-cols-1 gap-6'>
            {/* Calendar and Time Picker */}
            <div className='rounded-xl border border-slate-200 bg-slate-50'>
              <ScheduleCalendar onDateSelect={onDateSelect} selectedDate={selectedCalendarDate} availabilityData={availabilityData} />

              <ScheduleTimeSelector
                selectedDate={selectedCalendarDate}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
                availabilityData={availabilityData}
              />
            </div>

            {/* Process Template Selection */}
            <div>
              <SelectField
                label='Process Template (Optional)'
                name='template'
                value={selectedTemplate || ''}
                onChange={handleTemplateChange}
                options={templateOptions}
                fullWidth
              />

              {/* Auto-create Process */}
              <div className='mt-4 rounded-lg bg-blue-50 p-3'>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id='autoCreateProcess'
                    checked={autoCreateProcess}
                    onChange={handleAutoCreateChange}
                    className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  />
                  <label htmlFor='autoCreateProcess' className='ml-2 block text-sm font-medium text-blue-700'>
                    Auto-generate process from ticket
                  </label>
                </div>
                <p className='mt-1 ml-6 text-xs text-blue-600'>Creates a process with steps based on ticket type</p>
              </div>
            </div>

            <Button variant='primary' size='lg' fullWidth onClick={handleSubmit} disabled={isSubmitDisabled || !selectedTime}>
              {isSubmitDisabled ? 'Select Ticket First' : !selectedTime ? 'Select Time Slot' : 'Schedule Ticket'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
