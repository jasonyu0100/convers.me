import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { CategorySelector } from './components/CategorySelector';
import { DailySummaryView } from './components/DailySummaryView';
import { RecommendationsView } from './components/RecommendationsView';
import { TimeFrameSelector } from './components/TimeFrameSelector';
import { TimeTrackSelector } from './components/TimeTrackSelector';
import { WeeklySummaryView } from './components/WeeklySummaryView';
import { useReview } from './hooks/useReview';
import { useReviewHeader } from './hooks/useReviewHeader';

/**
 * Header section for the Review view
 */
function ReviewHeader() {
  const { selectedTimeFrame, setSelectedTimeFrame, selectedCategory } = useReview();

  // Get category name for display
  const getCategoryName = () => {
    if (!selectedCategory) return 'All Categories';

    const categories = [
      { id: 'summary', name: 'Summary' },
      { id: 'insight', name: 'Insights' },
      { id: 'recommendation', name: 'Recommendations' },
      { id: 'achievement', name: 'Achievements' },
      { id: 'learning', name: 'Learnings' },
    ];

    return categories.find((c) => c.id === selectedCategory)?.name || 'All Categories';
  };

  return (
    <div className='sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur-sm'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <span className='text-sm font-medium text-slate-900'>{getCategoryName()}</span>
        </div>
        <div className='flex items-center space-x-4'>
          <TimeFrameSelector selectedTimeFrame={selectedTimeFrame} onSelect={setSelectedTimeFrame} />
          <CategorySelector />
        </div>
      </div>
    </div>
  );
}

/**
 * Main content for the Review view
 */
function ReviewContent() {
  const { isLoading, error, selectedTimeFrame, selectedDate, setSelectedDate, dailySummaries, weeklySummaries, recommendations, clearError, refreshData } =
    useReview();

  // Format the selected date for display
  const formattedDate = (() => {
    if (selectedTimeFrame === 'day') {
      return selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    } else if (selectedTimeFrame === 'week') {
      // Get the start and end of the selected week
      const weekStart = new Date(selectedDate);
      weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    } else {
      return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  })();

  if (isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center bg-gradient-to-br from-white to-slate-50/80'>
        <PageLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-1 items-center justify-center bg-gradient-to-br from-white to-slate-50/80'>
        <ErrorDisplay error={error} title='Review Data Error' onRetry={clearError} />
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col overflow-hidden'>
      <div className='flex-1 overflow-auto bg-gradient-to-br from-white to-slate-50/80'>
        <div className='px-8 py-6'>
          {/* Date header with refresh button */}
          <div className='mb-6 flex items-center justify-between'>
            <h2 className='text-base font-medium text-slate-800'>{formattedDate}</h2>
            <button
              onClick={refreshData}
              className='rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600'
              aria-label='Refresh data'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M21 2v6h-6'></path>
                <path d='M3 12a9 9 0 0 1 15-6.7L21 8'></path>
                <path d='M3 22v-6h6'></path>
                <path d='M21 12a9 9 0 0 1-15 6.7L3 16'></path>
              </svg>
            </button>
          </div>

          {/* Main content section */}
          <div className='mb-8'>
            <div className='mb-4 flex items-center'>
              <h3 className='text-base font-semibold text-slate-800'>
                {selectedTimeFrame === 'day' && 'Daily Performance'}
                {selectedTimeFrame === 'week' && 'Weekly Summary'}
                {selectedTimeFrame === 'month' && 'Monthly Overview'}
              </h3>
            </div>

            {selectedTimeFrame === 'day' && <DailySummaryView summaries={dailySummaries} />}
            {selectedTimeFrame === 'week' && <WeeklySummaryView summaries={weeklySummaries} />}
            {selectedTimeFrame === 'month' && <WeeklySummaryView summaries={weeklySummaries} isMonthly />}
          </div>

          {/* Recommendations section */}
          <div>
            <div className='mb-5 flex items-center justify-between'>
              <h3 className='text-base font-semibold text-slate-800'>Recommendations</h3>
              <button className='rounded px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700'>
                View All ({recommendations.length})
              </button>
            </div>

            <RecommendationsView recommendations={recommendations.slice(0, 3)} />
          </div>
        </div>
      </div>

      {/* Time Track Selector */}
      <TimeTrackSelector selectedTimeFrame={selectedTimeFrame} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
    </div>
  );
}

/**
 * Main Review view component
 */
export function ReviewView() {
  const headerProps = useReviewHeader();

  return (
    <div className='flex h-full w-full flex-col'>
      <AppHeader
        title={headerProps.title}
        subtitle={headerProps.subtitle}
        searchPlaceholder={headerProps.searchPlaceholder}
        searchValue={headerProps.searchValue}
        onSearchChange={headerProps.onSearchChange}
        onSearchSubmit={headerProps.onSearchSubmit}
      />
      <div className='flex flex-1 flex-col overflow-hidden'>
        <ReviewHeader />
        <ReviewContent />
      </div>
    </div>
  );
}
