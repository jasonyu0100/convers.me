'use client';

import { Button } from '@/app/components/ui/buttons/Button';
import { SelectField } from '@/app/components/ui/inputs/SelectField';
import { dateUtils } from '../../calendar/utils/dateUtils';

// Import shared schedule config and generate availability data
import { useEffect, useState } from 'react';
import { SCHEDULE_CONFIG } from '../../calendar/utils/dateUtils';
import { useSchedule } from '../hooks/useSchedule';
import { ScheduleCalendar } from './ScheduleCalendar';
import { ScheduleTimeSelector } from './ScheduleTimeSelector';

// Generate week days for availability
const weekDays = dateUtils.generateWeekDays(new Date(), SCHEDULE_CONFIG.DAYS_TO_SHOW);
// Use shared utility to generate mock availability data with standard time configuration
const mockAvailabilityData = dateUtils.generateAvailabilityData(
  weekDays,
  SCHEDULE_CONFIG.HOUR_START,
  SCHEDULE_CONFIG.HOUR_END,
  SCHEDULE_CONFIG.INTERVAL_MINUTES,
);
const mockDirectories = [{ id: 'client-onboarding', name: 'Client Onboarding', color: 'bg-blue-500' }];
const mockEventTypes = [
  {
    id: 'client-onboarding-process',
    title: 'Client Onboarding',
    directoryId: 'client-onboarding',
    estimatedTime: '30 min',
    complexity: 3,
    description: 'Initial client onboarding process',
    tags: ['Client', 'Onboarding'],
  },
];

export function ScheduleForm() {
  const { formState, errors, isSubmitting, handleInputChange, handleNewProcess, handleScheduleRoom } = useSchedule();

  // Filtered processes for the selected directory
  const [filteredProcesses, setFilteredProcesses] = useState(mockEventTypes);

  // State for calendar and time selection
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Filter processes when directory changes
  useEffect(() => {
    if (formState.directoryId) {
      const processes = mockEventTypes.filter((type) => type.directoryId === formState.directoryId);
      setFilteredProcesses(processes);

      // If current event is not in this directory, select first one
      if (!processes.some((p) => p.id === formState.eventType)) {
        handleInputChange({
          target: {
            name: 'eventType',
            value: processes[0]?.id || '',
          },
        } as any);
      }
    } else {
      setFilteredProcesses(mockEventTypes);
    }
  }, [formState.directoryId]);

  // Handle directory change
  const handleDirectoryChange = (e: React.ChangeEvent) => {
    handleInputChange(e);
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);

    // Update formState with the selected date and time
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Legacy format (date, time, datetime)
      const dateTimeString = `${dateStr}T${time}:00`;

      // Calculate end time using shared utility (default 1 hour duration)
      const endTimeStr = dateUtils.calculateEndTime(time);
      const endTimeString = `${dateStr}T${endTimeStr}:00`;

      // Set all the necessary fields for compatibility

      // 1. Legacy datetime field
      const legacyEvent = {
        target: {
          name: 'datetime',
          value: dateTimeString,
        },
      } as React.ChangeEvent;

      // 2. Legacy date and time fields
      const dateEvent = {
        target: {
          name: 'date',
          value: dateStr,
        },
      } as React.ChangeEvent;

      const timeEvent = {
        target: {
          name: 'time',
          value: time,
        },
      } as React.ChangeEvent;

      // 3. Default duration (1 hour)
      const durationEvent = {
        target: {
          name: 'duration',
          value: '60min',
        },
      } as React.ChangeEvent;

      // 4. New startTime and endTime fields
      const startTimeEvent = {
        target: {
          name: 'startTime',
          value: dateTimeString,
        },
      } as React.ChangeEvent;

      const endTimeEvent = {
        target: {
          name: 'endTime',
          value: endTimeString,
        },
      } as React.ChangeEvent;

      // Update all the fields in formState
      handleInputChange(legacyEvent);
      handleInputChange(dateEvent);
      handleInputChange(timeEvent);
      handleInputChange(durationEvent);
      handleInputChange(startTimeEvent);
      handleInputChange(endTimeEvent);
    }
  };

  // Format options for select dropdowns
  const directoryOptions = mockDirectories.map((dir) => ({
    value: dir.id,
    label: dir.name,
  }));

  const processOptions = filteredProcesses.map((process) => ({
    value: process.id,
    label: process.title,
  }));

  return (
    <div className='h-full w-full overflow-auto'>
      <div className='flex h-full w-full flex-col justify-center p-6'>
        <div className='mx-auto w-full max-w-xl space-y-6'>
          <div className='mb-6 text-center'>
            <h2 className='text-2xl font-bold text-slate-800'>Schedule Time</h2>
          </div>

          <div className='grid grid-cols-1 gap-6'>
            {/* Directory Selector */}
            <SelectField
              label='Directory'
              name='directoryId'
              value={formState.directoryId}
              onChange={handleDirectoryChange}
              options={directoryOptions}
              fullWidth
              error={!!errors.directoryId}
              errorText={errors.directoryId}
            />

            {/* Process Selector */}
            <SelectField
              label='Process Type'
              name='eventType'
              value={formState.eventType}
              onChange={handleInputChange}
              options={processOptions}
              fullWidth
              error={!!errors.eventType}
              errorText={errors.eventType}
            />

            {/* Calendar and Time Picker */}
            <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
              <ScheduleCalendar onDateSelect={handleDateSelect} selectedDate={selectedDate} availabilityData={mockAvailabilityData} />

              <ScheduleTimeSelector
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
                availabilityData={mockAvailabilityData}
              />
              {errors.datetime && <p className='mt-1 text-xs text-red-500'>{errors.datetime}</p>}
            </div>

            <Button variant='primary' size='lg' fullWidth onClick={handleScheduleRoom} disabled={isSubmitting || !selectedDate || !selectedTime}>
              {isSubmitting ? 'Scheduling...' : 'Schedule Time'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
