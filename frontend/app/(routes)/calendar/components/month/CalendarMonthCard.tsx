import { CalendarEvent, EventColor } from '../../../../types/calendar';

interface CalendarMonthCardProps {
  event: CalendarEvent;
  onClick?: () => void;
}

// Function to get color classes based on event color
const getColorClasses = (color?: EventColor) => {
  const colorMap = {
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
    pink: 'border-l-pink-500',
    yellow: 'border-l-yellow-500',
    green: 'border-l-green-500',
    orange: 'border-l-orange-500',
    teal: 'border-l-teal-500',
    indigo: 'border-l-indigo-500',
    red: 'border-l-red-500',
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
  };

  return color && colorMap[color] ? colorMap[color] : 'border-l-slate-500';
};

export function CalendarMonthCard({ event, onClick }: CalendarMonthCardProps) {
  // Use the color from the event or fallback to status-based color
  const borderColor = getColorClasses(event.color);

  return (
    <div
      id={event.id}
      className={`w-full cursor-pointer rounded-xl border border-slate-200 ${borderColor} group relative flex flex-col overflow-hidden border-l-6 bg-slate-100 p-4 transition-all duration-200 hover:shadow-md`}
      onClick={onClick}
    >
      {/* Event title */}
      <div className='mb-3'>
        <h3 className='line-clamp-2 text-base font-medium text-slate-800 transition-colors group-hover:text-blue-600'>{event.title}</h3>
      </div>

      {/* Event time */}
      <div className='mb-3 flex items-center justify-between text-sm text-slate-600'>
        <span>{event.time}</span>
        {/* Removed recurring event indicator - recurring events are no longer supported */}
      </div>

      {/* Participants */}
      <div className='mb-3 flex items-center'>
        <p className='truncate text-sm text-slate-500'>
          {event.participants.name}
          {event.participants.count > 1 && <span className='ml-1 text-slate-400'>+{event.participants.count - 1}</span>}
        </p>
      </div>

      {/* Topics - shown as simple tags */}
      <div className='mt-auto flex flex-wrap gap-2'>
        {event.topics.slice(0, 3).map((topic, index) => (
          <span key={index} className='inline-block rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-xs whitespace-nowrap text-slate-600'>
            {topic}
          </span>
        ))}
        {event.topics.length > 3 && <span className='text-xs text-slate-400'>+{event.topics.length - 3}</span>}
      </div>

      {/* Status indicator */}
      <div className='absolute top-2 right-2'>
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            event.status === 'ready' ? 'bg-green-500' : event.status === 'pending' ? 'bg-amber-500' : 'bg-blue-500'
          }`}
        ></span>
      </div>
    </div>
  );
}
