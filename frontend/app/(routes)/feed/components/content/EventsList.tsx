import { EventSchema } from '@/app/types/schema';
import { EventsListItem } from './EventsListItem';

interface EventsListProps {
  events: EventSchema[];
  title?: string;
}

export function EventsList({ events, title = 'Events' }: EventsListProps) {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className='mb-6'>
      <h2 className='mb-3 text-lg font-semibold text-slate-800'>{title}</h2>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {events.map((event) => (
          <EventsListItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
