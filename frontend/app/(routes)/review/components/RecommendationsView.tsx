/**
 * Recommendations view component for the Review section
 * Using consistent design with the Library components
 */
import { KnowledgeRecommendation } from '@/app/types/review';
import { ArrowRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface RecommendationsViewProps {
  recommendations: KnowledgeRecommendation[];
}

export function RecommendationsView({ recommendations }: RecommendationsViewProps) {
  // If no recommendations available, render placeholder content
  if (!recommendations.length) {
    return (
      <div className='flex h-60 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white/80 p-6 text-center'>
        <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100'>
          <InformationCircleIcon className='h-6 w-6 text-slate-400' />
        </div>
        <p className='text-sm font-medium text-slate-600'>No recommendations available</p>
        <p className='mt-1 max-w-md text-xs text-slate-500'>Complete more processes and events to receive personalized recommendations</p>
      </div>
    );
  }

  // Sort recommendations by priority (high first)
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {sortedRecommendations.map((recommendation) => (
        <div
          key={recommendation.id}
          className='relative flex aspect-[4/3] cursor-pointer flex-col rounded-lg border border-slate-200 bg-white transition-all hover:bg-slate-50'
        >
          {/* Card content with padding */}
          <div className='flex flex-1 flex-col p-4'>
            {/* Card header with priority badge */}
            <div className='mb-2 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <PriorityBadge priority={recommendation.priority} />
                <h3 className='truncate text-sm font-medium text-slate-800'>{recommendation.title}</h3>
              </div>
              {recommendation.dueDate && (
                <span className='ml-1 text-xs font-medium text-slate-500'>
                  Due{' '}
                  {new Date(recommendation.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>

            {/* Description - grows to fill available space */}
            <p className='mb-auto line-clamp-3 text-xs text-slate-600' title={recommendation.content}>
              {recommendation.content}
            </p>

            {/* Card footer with action button */}
            {recommendation.actionable && (
              <div className='mt-3 flex items-end justify-end'>
                <button className='flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800'>
                  <span>Take Action</span>
                  <ArrowRightIcon className='ml-1 h-3 w-3' />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper component for the priority badge
function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' }) {
  const badgeConfig = {
    high: {
      classes: 'text-red-500',
      label: '●', // Using a dot character instead of a background
    },
    medium: {
      classes: 'text-yellow-500',
      label: '●',
    },
    low: {
      classes: 'text-green-500',
      label: '●',
    },
  };

  const config = badgeConfig[priority];

  return (
    <span className={`${config.classes} text-xs`} aria-label={`Priority: ${priority}`}>
      {config.label}
    </span>
  );
}
