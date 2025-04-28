'use client';

export interface EventCardProps {
  id: string;
  title: string;
  date: string;
  duration: string;
  tags: string[];
  description?: string;
  participants?: number;
  complexity?: number;
  onEventClick?: (id: string) => void;
  onTagClick?: (tag: string) => void;
}

/**
 * Reusable EventCard component for displaying events across the application
 */
export function EventCard({ id, title, date, duration, tags, description, participants, complexity = 0, onEventClick, onTagClick }: EventCardProps) {
  // Function to display complexity as dots (similar to RoomCard)
  const renderComplexity = (level: number) => {
    const dots = [];
    const maxDots = 5;

    for (let i = 1; i <= maxDots; i++) {
      dots.push(<div key={i} className={`bg-opacity-80 mx-0.5 h-2 w-2 rounded-full ${i <= level ? 'bg-blue-500' : 'bg-slate-200'}`} />);
    }

    return <div className='flex items-center'>{dots}</div>;
  };

  // Get tag colors based on tag name (for consistent coloring)
  const getTagColor = (tagName: string): string => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-indigo-100 text-indigo-800',
      'bg-pink-100 text-pink-800',
    ];

    // Simple hash function for consistent colors
    const hash = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div
      className='group flex w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/80 p-4 transition hover:bg-gray-50'
      onClick={() => onEventClick && onEventClick(id)}
      role={onEventClick ? 'button' : 'article'}
      tabIndex={onEventClick ? 0 : undefined}
    >
      <div className='flex h-full flex-col justify-between'>
        {/* Top section: title and description */}
        <div>
          <h3 className='text-lg font-medium text-gray-900 group-hover:text-blue-700'>{title}</h3>

          {description && <p className='mt-1 line-clamp-2 text-sm text-gray-500'>{description}</p>}

          {/* Date and duration info */}
          <div className='mt-2 flex items-center text-sm text-gray-500'>
            <svg className='mr-1 h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
            <span>{date}</span>
            <span className='mx-2'>•</span>
            <svg className='mr-1 h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            <span>{duration}</span>

            {participants && (
              <>
                <span className='mx-2'>•</span>
                <svg className='mr-1 h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                  />
                </svg>
                <span>{`${participants} ${participants === 1 ? 'participant' : 'participants'}`}</span>
              </>
            )}
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className='mt-3 flex flex-wrap gap-2'>
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className={`inline-flex cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium ${getTagColor(tag)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick && onTagClick(tag);
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom section: complexity if available */}
        {complexity > 0 && (
          <div className='mt-4 flex items-center space-x-2 border-t border-slate-100 pt-2 text-sm text-slate-500'>
            <span>Complexity:</span>
            {renderComplexity(complexity)}
          </div>
        )}
      </div>
    </div>
  );
}
