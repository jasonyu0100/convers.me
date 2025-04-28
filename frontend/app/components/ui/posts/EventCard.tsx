import { Tag } from '@/app/components/ui/tags';
import { EventCardProps } from './types';

export function EventCard({
  eventId,
  title,
  participants = [], // Include but don't use
  tags = ['Meeting', 'Event'],
  duration = '60min',
  complexity = 3,
  publishedAt = 'Today',
  roomName,
  onClick,
  onTagClick,
}: EventCardProps) {
  // Function to display complexity as dots
  const renderComplexity = (level: number) => {
    const dots = [];
    const maxDots = 5;

    for (let i = 1; i <= maxDots; i++) {
      dots.push(<div key={i} className={`mx-0.5 h-1.5 w-1.5 rounded-full ${i <= level ? 'bg-blue-500' : 'bg-slate-200'}`} />);
    }

    return <div className='flex items-center'>{dots}</div>;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to room when event card is clicked
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className='relative mb-2 w-full max-w-[360px]'>
      {/* Room redirect indicator removed - handled in PostItem */}

      <div
        className='flex w-full cursor-pointer flex-col overflow-hidden rounded-md border border-slate-200 bg-white/80 text-left transition hover:bg-gray-50'
        onClick={handleClick}
      >
        <div className='flex w-full flex-col justify-between p-3'>
          {/* Event badge */}
          <div className='mb-2 flex'>
            <span className='rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700'>Event</span>
          </div>

          {/* Title */}
          <h3 className='text-sm font-medium text-gray-800'>{title}</h3>

          {/* Date info */}
          <div className='mt-1 flex items-center text-xs text-slate-500'>
            <span>{publishedAt}</span>
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className='mt-2 flex flex-wrap gap-1'>
              {tags.map((tag, index) => (
                <Tag
                  key={index}
                  className='bg-blue-50 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-100'
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick && onTagClick(tag);
                  }}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          )}

          {/* Bottom section: duration and complexity */}
          <div className='mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500'>
            {/* Duration with clock icon */}
            <div className='flex items-center'>
              <svg className='mr-1 h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <span>{duration}</span>
            </div>

            {/* Complexity with lightning icon */}
            <div className='flex items-center'>
              <svg className='mr-1 h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 10V3L4 14h7v7l9-11h-7z' />
              </svg>
              {renderComplexity(complexity)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
