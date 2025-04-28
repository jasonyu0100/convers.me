export * from './Calendar';
export * from './TimeSelector';
export * from './DateTimeSelector';
export * from './UserInfo';

/**
 * Scheduling components for date and time selection
 *
 * These components provide reusable UI for selecting dates and times for scheduling across
 * different features like Connect and Schedule.
 */

// A helper function to generate availability data for a set of days
export function generateAvailabilityData(weekDays: string[], hourStart: number = 8, hourEnd: number = 18, intervalMinutes: number = 30) {
  const data = {
    dates: {} as Record,
    times: {} as Record,
  };

  // Add available time slots for each weekday
  weekDays.forEach((day) => {
    const times = [];
    for (let hour = hourStart; hour < hourEnd; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }

    data.dates[day] = times;
    data.times[day] = times;
  });

  return data;
}

// A helper function to calculate an end time given a start time and duration
export function calculateEndTime(startTime: string, durationMinutes: number = 60): string {
  const [hour, minute] = startTime.split(':').map(Number);
  const totalMinutes = hour * 60 + minute + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMinute = totalMinutes % 60;
  return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
}
