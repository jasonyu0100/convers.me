import { useCalendar } from '../../hooks';
import { CalendarWeekDay } from './CalendarWeekDay';

export function CalendarWeekView() {
  const { currentDate, getEventsForDay, setCurrentDate } = useCalendar();

  // Get the start of the week (Monday)
  const startOfWeek = new Date(currentDate);
  const dayOfWeek = startOfWeek.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract);

  // Generate dates for the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return {
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      events: getEventsForDay(date),
    };
  });

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  // Check if a date is the currently selected date
  const isSelected = (date: Date) => {
    return date.getDate() === currentDate.getDate() && date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  };

  // Handle click on a day
  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
  };

  // Generate the time ruler hours (6 AM to 12 AM)
  const timeRulerHours = Array.from({ length: 19 }, (_, i) => {
    const hour = i + 6; // Start at 6 AM
    const hourFormatted = hour === 12 ? '12 PM' : hour === 24 ? '12 AM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    return { hour, hourFormatted };
  });

  // Calculate current time indicator position
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Only show time indicator during visible hours (6 AM to 12 AM)
    if (hours < 6 || hours >= 24) return null;

    // Calculate position (each hour block is 48px in height)
    const hoursSince6am = hours - 6;
    const minutePercentage = minutes / 60;

    // Position in pixels (hourly height is 48px)
    const position = (hoursSince6am + minutePercentage) * 48;

    return {
      top: `${position + 10}px`, // 10px for the header
    };
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className='flex h-full w-full flex-1 flex-row overflow-hidden'>
      {/* Time ruler */}
      <div className='flex min-h-[912px] w-12 flex-col border-r border-slate-100 bg-white'>
        {/* Empty header cell to align with day headers */}
        <div className='h-10 border-b border-slate-100'></div>

        {/* Time labels */}
        <div className='flex flex-1 flex-col overflow-auto'>
          {timeRulerHours.map(({ hour, hourFormatted }) => (
            <div key={hour} className='relative flex h-12 items-start justify-end border-b border-slate-100 pt-1 pr-2'>
              <span className='text-[10px] text-slate-400'>{hourFormatted}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Week days grid with current time indicator */}
      <div className='relative grid h-full min-h-[912px] w-full flex-1 grid-cols-7 bg-white'>
        {/* Hour gridlines */}
        <div className='pointer-events-none absolute inset-0 z-10 w-full'>
          {/* Skip header space */}
          <div className='h-10'></div>

          {/* Hour lines */}
          {timeRulerHours.map(({ hour }) => (
            <div key={hour} className='h-12 w-full border-b border-slate-100'></div>
          ))}
        </div>

        {/* Current time indicator line */}
        {currentTimePosition && (
          <div className='absolute right-0 left-0 z-20 border-t border-blue-400' style={{ top: currentTimePosition.top }}>
            <div className='absolute -top-1 -left-1.5 h-2 w-2 rounded-full bg-blue-500'></div>
          </div>
        )}

        {weekDays.map((day, index) => (
          <CalendarWeekDay
            key={index}
            day={day.dayName}
            date={day.date}
            isToday={isToday(day.date)}
            isSelected={isSelected(day.date)}
            events={day.events}
            onClick={() => handleDayClick(day.date)}
          />
        ))}
      </div>
    </div>
  );
}
