/**
 * Daily summary view component for the Review section
 * Using minimalist design consistent with process route
 */
import { DailySummary } from '@/app/types/review';
import { Fragment } from 'react';

interface DailySummaryViewProps {
  summaries: DailySummary[];
}

function SummaryCard({ summary }: { summary: DailySummary }) {
  return (
    <div className='overflow-hidden rounded-lg'>
      <div className='mb-4'>
        <h2 className='text-base font-medium text-slate-700'>{summary.title}</h2>
        <div className='mt-1 text-xs text-slate-500'>
          {new Date(summary.date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className='mb-6 text-sm text-slate-600'>
        {summary.content.split('\n').map((paragraph, i) => (
          <Fragment key={i}>
            <p className='mb-2 leading-relaxed'>{paragraph}</p>
          </Fragment>
        ))}
      </div>

      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <MetricCard label='Completed Events' value={summary.completedEvents || 0} />

        <MetricCard label='Completed Steps' value={summary.completedSteps || 0} />

        <MetricCard
          label='Performance'
          value={`${summary.performanceScore || 0}%`}
          highlight={summary.performanceScore ? summary.performanceScore > 75 : false}
        />
      </div>

      {summary.tags && summary.tags.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {summary.tags.map((tag) => (
            <span key={tag} className='rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600'>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper component for metrics
function MetricCard({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className='rounded bg-slate-50 p-3'>
      <div className='mb-1 text-xs font-medium text-slate-500'>{label}</div>
      <div className={`text-base font-medium ${highlight ? 'text-blue-600' : 'text-slate-700'}`}>{value}</div>
    </div>
  );
}

export function DailySummaryView({ summaries }: DailySummaryViewProps) {
  // If no summaries available, render placeholder content using mock data
  if (!summaries.length) {
    // Create a mock summary for display
    const mockSummary: DailySummary = {
      id: Math.random().toString(36).substring(2, 15),
      title: 'Daily Progress Summary',
      content:
        'Today was focused on development tasks for the mobile application. You completed the user authentication flow and fixed several UI issues reported in the latest testing cycle.\n\nYou participated in 2 planning meetings and spent approximately 4.5 hours on focused coding work. Your efficiency score is above your weekly average.\n\nThe team made good progress on the sprint goals, with your contributions pushing the overall completion rate to 68%.',
      timeFrame: 'day',
      category: 'summary',
      date: new Date().toISOString().split('T')[0],
      userId: 'user123',
      activities: {
        day: new Date().toLocaleString('en-US', { weekday: 'long' }),
        date: new Date().toISOString().split('T')[0],
        eventsCompleted: 4,
        stepsCompleted: 7,
        timeSpent: 420,
        efficiency: 82,
      },
      completedEvents: 4,
      completedSteps: 7,
      performanceScore: 82,
      tags: ['Development', 'Mobile', 'Authentication'],
    };

    return <SummaryCard summary={mockSummary} />;
  }

  // Sort summaries by date (newest first)
  const sortedSummaries = [...summaries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className='space-y-5'>
      {sortedSummaries.map((summary) => (
        <SummaryCard key={summary.id} summary={summary} />
      ))}
    </div>
  );
}
