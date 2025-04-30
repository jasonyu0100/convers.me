import { CalendarEvent, EventColor } from '../../../../types/calendar';
import { useCalendar } from '../../hooks';

interface CalendarWeekDayProps {
  day: string;
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  onClick: () => void;
}

export function CalendarWeekDay({ day, date, isToday, isSelected, events, onClick }: CalendarWeekDayProps) {
  const { handleEventClick } = useCalendar();

  const formattedDate = date.getDate().toString();

  // Sort events by time - handle events without time
  const sortedEvents = [...events].sort((a, b) => {
    // Handle undefined times
    if (!a.time && !b.time) return 0;
    if (!a.time) return -1; // Events without time go first
    if (!b.time) return 1;

    // Get first part of time range or the whole time if no range
    const timeA = a.time.includes(' - ') ? a.time.split(' - ')[0] : a.time;
    const timeB = b.time.includes(' - ') ? b.time.split(' - ')[0] : b.time;

    return timeA.localeCompare(timeB);
  });

  // Determine background color based on state
  const getBgColor = () => {
    if (isSelected && isToday) return 'bg-blue-50/40';
    if (isSelected) return 'bg-blue-50/40';
    if (isToday) return 'bg-blue-50/20';
    return 'bg-white hover:bg-slate-50/40';
  };

  return (
    <div className={`flex h-full w-full flex-col border-r border-slate-100 ${getBgColor()} cursor-pointer transition-all duration-150`} onClick={onClick}>
      <CalendarWeekDayHeader day={day} date={formattedDate} isToday={isToday} isSelected={isSelected} />
      <div className='relative flex-1 overflow-auto'>
        <CalendarWeekDayEvents>
          {sortedEvents.length > 0 ? (
            sortedEvents.map((event) => (
              <CalendarWeekDayEvent
                key={event.id}
                event={event}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering day click
                  handleEventClick(event);
                }}
              />
            ))
          ) : (
            <div className='absolute top-4 right-0 left-0 flex justify-center text-[10px] text-slate-300'>No events</div>
          )}
        </CalendarWeekDayEvents>
      </div>
    </div>
  );
}

interface CalendarWeekDayHeaderProps {
  day: string;
  date: string;
  isToday: boolean;
  isSelected: boolean;
}

function CalendarWeekDayHeader({ day, date, isToday, isSelected }: CalendarWeekDayHeaderProps) {
  // Get the appropriate styling based on day state
  const getHeaderStyle = () => {
    if (isSelected && isToday) return 'bg-blue-50';
    if (isSelected) return 'bg-blue-50';
    if (isToday) return 'bg-blue-50/50';
    return 'bg-slate-50/50';
  };

  const getDateStyle = () => {
    if (isSelected && isToday) return 'text-blue-600';
    if (isSelected) return 'text-blue-600';
    if (isToday) return 'text-blue-500';
    return 'text-slate-700';
  };

  return (
    <div className={`flex items-center justify-between border-b border-slate-100 px-2 ${getHeaderStyle()}`} style={{ height: '40px' }}>
      <p className={`text-xs font-medium ${isToday ? 'text-blue-500' : 'text-slate-500'}`}>{day}</p>
      <p className={`text-xs font-medium ${getDateStyle()}`}>{date}</p>
    </div>
  );
}

function CalendarWeekDayEvents({ children }: { children: React.ReactNode }) {
  return (
    <div className='relative h-full w-full overflow-auto'>
      {/* Events layer */}
      <div className='relative z-10 flex h-full w-full flex-col p-1'>{children}</div>
    </div>
  );
}

// Function to get color classes based on event color
const getColorClasses = (color?: EventColor) => {
  const colorMap = {
    blue: 'bg-blue-100 border-blue-300 text-blue-800',
    purple: 'bg-purple-100 border-purple-300 text-purple-800',
    pink: 'bg-pink-100 border-pink-300 text-pink-800',
    yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    green: 'bg-green-100 border-green-300 text-green-800',
    orange: 'bg-orange-100 border-orange-300 text-orange-800',
    teal: 'bg-teal-100 border-teal-300 text-teal-800',
    indigo: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    red: 'bg-red-100 border-red-300 text-red-800',
    emerald: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    amber: 'bg-amber-100 border-amber-300 text-amber-800',
  };

  return color && colorMap[color] ? colorMap[color] : 'bg-slate-100 border-slate-300 text-slate-800';
};

interface CalendarWeekDayEventProps {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
}

export function CalendarWeekDayEvent({ event, onClick }: CalendarWeekDayEventProps) {
  const colorClasses = getColorClasses(event.color);

  // Position the event based on its time
  const getEventPosition = () => {
    // Default positioning if we can't parse the time
    let topPosition = 0;
    let height = 48; // Default 1-hour height (now 48px instead of 56px)

    try {
      // Skip positioning calculation if time is missing or empty
      if (!event.time || event.time === '') {
        return {
          top: `${topPosition}px`,
          height: `${height}px`,
        };
      }

      // Extract start and end times
      let startTime, endTime;
      if (event.time.includes(' - ')) {
        [startTime, endTime] = event.time.split(' - ');
      } else {
        // If there's no range, use the time as start and add 1 hour for end
        startTime = event.time;
        // Default endTime will be calculated below if needed
      }

      // Parse the times
      const parseTime = (timeStr: string) => {
        if (!timeStr) return { hours: 9, minutes: 0 }; // Default to 9 AM if no time

        const parts = timeStr.split(' ');
        const period = parts.length > 1 ? parts[1] : 'AM'; // Default to AM if no period
        const time = parts[0];

        let [hours, minutes] = time.includes(':') ? time.split(':').map(Number) : [parseInt(time, 10), 0]; // Handle times without minutes

        // Handle invalid times
        if (isNaN(hours)) hours = 9;
        if (isNaN(minutes)) minutes = 0;

        // Convert to 24-hour format
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        // Handle midnight displayed as 12 AM - ensure it's properly categorized as the end of the day
        if (period === 'AM' && hours === 0 && timeStr.toLowerCase().includes('12')) {
          hours = 24; // Treat as end of day (midnight)
        }

        return { hours, minutes };
      };

      const start = parseTime(startTime);
      const end = endTime ? parseTime(endTime) : { hours: start.hours + 1, minutes: start.minutes };

      // Calculate position relative to 6 AM
      const startHoursFrom6am = start.hours - 6 + start.minutes / 60;
      const endHoursFrom6am = end.hours - 6 + end.minutes / 60;

      // Handle events that start before 6 AM
      const adjustedStartHours = startHoursFrom6am < 0 ? 0 : startHoursFrom6am;

      // Handle events that end after midnight
      const adjustedEndHours = end.hours >= 24 ? 18 : endHoursFrom6am; // 18 hours = midnight (6am to midnight)

      // Each hour is 48px
      topPosition = Math.max(0, adjustedStartHours * 48);

      // Calculate height - ensure minimum of 1 hour
      const heightHours = Math.max(1, adjustedEndHours - adjustedStartHours);
      height = Math.max(48, heightHours * 48);
    } catch (error) {
      // If time parsing fails, use default positioning
      console.error('Error parsing event time:', error);
    }

    return {
      top: `${topPosition}px`,
      height: `${height}px`,
    };
  };

  const positionStyle = getEventPosition();

  return (
    <div
      className={`absolute right-1 left-1 z-20 m-0.5 cursor-pointer overflow-hidden rounded border ${colorClasses} shadow-sm transition-all duration-150 hover:shadow`}
      onClick={onClick}
      style={positionStyle}
    >
      <div className='p-1.5'>
        <p className='truncate text-xs font-medium'>{event.title}</p>
        {event.time && <p className='mt-0.5 truncate text-[10px] opacity-80'>{event.time}</p>}
      </div>
    </div>
  );
}
