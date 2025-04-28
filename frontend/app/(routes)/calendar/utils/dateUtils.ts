/**
 * Helper functions for date calculations and formatting
 */

// Standard time configuration to be used across scheduling components
export const SCHEDULE_CONFIG = {
  HOUR_START: 9, // 9 AM
  HOUR_END: 17, // 5 PM (17:00)
  INTERVAL_MINUTES: 30, // 30-minute intervals
  DAYS_TO_SHOW: 5, // Show 5 days in the calendar
};
import { format, addDays, startOfWeek, parseISO } from 'date-fns';

export const dateUtils = {
  isToday: (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  },

  formatEventDate: (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      weekday: 'long',
    }).format(date);
  },

  formatDate: (dateString: string): string => {
    const date = parseISO(dateString);
    return format(date, 'EEEE, MMMM do, yyyy');
  },

  formatShortDate: (dateString: string): string => {
    const date = parseISO(dateString);
    return format(date, 'MMM d');
  },

  formatMonthYear: (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  },

  formatTime: (time: string): string => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  },

  calculateEndTime: (startTime: string, durationMinutes: number = 60): string => {
    const [hour, minute] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + durationMinutes;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  },

  generateWeekDays: (startDate: Date = new Date(), count: number = 7): string[] => {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Start from Monday
    return Array.from({ length: count }, (_, i) => {
      const day = addDays(weekStart, i);
      return format(day, 'yyyy-MM-dd');
    });
  },

  generateAvailabilityData: (weekDays: string[], hourStart: number = 8, hourEnd: number = 18, intervalMinutes: number = 30) => {
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
  },

  isPastDate: (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  },

  isCurrentMonth: (date: Date, currentMonth: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth();
  },

  getQuarter: (date: Date): number => {
    return Math.floor(date.getMonth() / 3) + 1;
  },

  getWeekNumber: (date: Date): number => {
    // Copy date to avoid modifying the original
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  },
};
