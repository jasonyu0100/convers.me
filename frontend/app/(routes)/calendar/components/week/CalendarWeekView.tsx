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

  // Generate the time ruler hours (7 AM to 9 PM)
  const timeRulerHours = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 7; // Start at 7 AM
    const hourFormatted = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    return { hour, hourFormatted };
  });

  // Calculate current time indicator position
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Only show time indicator during visible hours (7 AM to 9 PM)
    if (hours < 7 || hours > 21) return null;

    // Calculate position (each hour block is 56px in height)
    const hoursSince7am = hours - 7;
    const minutePercentage = minutes / 60;

    // Position in pixels (14px per hour = 56px)
    const position = (hoursSince7am + minutePercentage) * 56;

    return {
      top: `${position + 76}px`, // 76px for the header
    };
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className='flex h-full w-full flex-1 flex-row overflow-hidden rounded-t-[2rem] shadow-md'>
      {/* Time ruler */}
      <div className='flex min-h-[900px] w-16 flex-col border-r border-slate-100 bg-slate-100'>
        {/* Empty header cell to align with day headers */}
        <div className='h-[76px] border-b border-slate-100'></div>

        {/* Time labels */}
        <div className='flex flex-1 flex-col overflow-auto'>
          {timeRulerHours.map(({ hour, hourFormatted }) => (
            <div key={hour} className='relative flex h-14 items-start justify-end border-b border-slate-100 pt-1 pr-2'>
              <span className='text-xs font-medium text-slate-500'>{hourFormatted}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Week days grid with current time indicator */}
      <div className='relative grid h-full min-h-[900px] w-full flex-1 grid-cols-7 bg-white/80'>
        {/* Hour gridlines */}
        <div className='pointer-events-none absolute inset-0 z-10 w-full'>
          {/* Skip header space */}
          <div className='h-[76px]'></div>

          {/* Hour lines */}
          {timeRulerHours.map(({ hour }) => (
            <div key={hour} className='h-14 w-full border-b border-slate-100'></div>
          ))}
        </div>

        {/* Current time indicator line */}
        {currentTimePosition && (
          <div className='absolute right-0 left-0 z-20 border-t border-red-400' style={{ top: currentTimePosition.top }}>
            <div className='absolute -top-1.5 -left-2 h-3 w-3 rounded-full bg-red-500'></div>
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
