/**
 * Weekly/Monthly summary view component for the Review section
 */

import { WeeklySummary } from '@/app/types/review';
import { Fragment } from 'react';

interface WeeklySummaryViewProps {
  summaries: WeeklySummary[];
  isMonthly?: boolean;
}

function PeriodSummaryCard({ summary, isMonthly = false }: { summary: WeeklySummary; isMonthly?: boolean }) {
  return (
    <div>
      <div className='mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row'>
        <h2 className='text-base font-medium text-slate-700'>{summary.title}</h2>
        <div className='rounded bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500'>
          {isMonthly ? new Date(summary.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : summary.weekProgress?.week || 'Week'}
        </div>
      </div>

      <div className='mb-6 max-w-none text-sm text-slate-600'>
        {summary.content.split('\n').map((paragraph, i) => (
          <Fragment key={i}>
            <p className='leading-relaxed'>{paragraph}</p>
            {i < summary.content.split('\n').length - 1 && <div className='h-3'></div>}
          </Fragment>
        ))}
      </div>

      {summary.weekProgress && (
        <div className='mb-6 grid grid-cols-2 gap-4 md:grid-cols-4'>
          <MetricCard label='Events' value={summary.weekProgress.eventsCompleted} />
          <MetricCard label='Steps' value={summary.weekProgress.stepsCompleted} />
          <MetricCard label='Hours' value={Math.round(summary.weekProgress.totalTimeSpent / 60)} />
          <MetricCard label='Efficiency' value={`${summary.weekProgress.efficiency}%`} highlight={summary.weekProgress.efficiency > 75} />
        </div>
      )}

      {summary.topProcesses && summary.topProcesses.length > 0 && (
        <div className='mb-6'>
          <h3 className='mb-3 text-sm font-medium text-slate-700'>Top Processes</h3>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {summary.topProcesses.map((process) => (
              <div key={process.id} className='rounded-lg bg-white p-3'>
                <div className='mb-2 flex items-center justify-between'>
                  <h4 className='text-sm font-medium text-slate-700'>{process.name}</h4>
                  <span className='text-xs font-medium text-blue-600'>{process.progress}%</span>
                </div>
                <div className='h-1.5 w-full overflow-hidden rounded-full bg-slate-200'>
                  <div className='h-1.5 rounded-full bg-blue-500' style={{ width: `${process.progress}%` }} />
                </div>
                <div className='mt-2 flex justify-between text-xs text-slate-500'>
                  <span>
                    {process.completedSteps}/{process.totalSteps} steps
                  </span>
                  <span>{Math.round(process.timeSpent / 60)} hrs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.achievements && summary.achievements.length > 0 && (
        <div className='mb-6'>
          <h3 className='mb-3 text-sm font-medium text-slate-700'>Key Achievements</h3>
          <ul className='space-y-1.5 pl-1'>
            {summary.achievements.map((achievement, index) => (
              <li key={index} className='flex items-start gap-2 text-sm text-slate-700'>
                <span className='mt-0.5 text-blue-600'>•</span>
                <span>{achievement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
    <div className='rounded-lg bg-white p-3'>
      <div className='mb-1 text-xs font-medium text-slate-500'>{label}</div>
      <div className={`text-base font-medium ${highlight ? 'text-blue-600' : 'text-slate-700'}`}>{value}</div>
    </div>
  );
}

export function WeeklySummaryView({ summaries, isMonthly = false }: WeeklySummaryViewProps) {
  const periodType = isMonthly ? 'Monthly' : 'Weekly';

  // If no summaries available, render placeholder content with mock data
  if (!summaries.length) {
    // Create a mock summary for display based on the period type
    const today = new Date();
    let startDate = new Date(today);
    let endDate = new Date(today);
    let mockWeek = '';

    if (isMonthly) {
      startDate.setDate(1); // First day of month
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of month
    } else {
      startDate.setDate(today.getDate() - today.getDay()); // First day of week (Sunday)
      endDate.setDate(startDate.getDate() + 6); // Last day of week (Saturday)
      const weekNum = Math.ceil((startDate.getDate() + startDate.getMonth() * 30) / 7);
      mockWeek = `Week ${weekNum}`;
    }

    // Format dates
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const mockSummary: WeeklySummary = {
      id: Math.random().toString(36).substring(2, 15),
      title: `${periodType} Performance Highlights`,
      content: isMonthly
        ? 'This month you completed 36 tasks across 4 major projects. Your efficiency average was 81%, which is 5% higher than last month.\n\nThe most significant progress was made on the Product Redesign project, where you completed 18 of the 22 tasks, putting you ahead of schedule for the quarterly goal.\n\nYou also conducted 15 successful meetings and implemented 3 new feature sets that received positive feedback from stakeholders.'
        : 'This week you focused on code refactoring and performance improvements. You completed 14 tasks and participated in 5 planning sessions.\n\nYour most productive day was Wednesday with 5 completed tasks. The database optimization you implemented resulted in a 30% improvement in query response times.\n\nYou also helped onboard a new team member by providing documentation and pair programming sessions.',
      timeFrame: isMonthly ? 'month' : 'week',
      category: 'summary',
      date: today.toISOString().split('T')[0],
      userId: 'user123',
      weekProgress: {
        week: mockWeek,
        startDate: startDateStr,
        endDate: endDateStr,
        eventsCompleted: isMonthly ? 22 : 8,
        stepsCompleted: isMonthly ? 46 : 14,
        totalTimeSpent: isMonthly ? 4800 : 1680,
        efficiency: 81,
        progress: 78,
      },
      topProcesses: [
        {
          id: Math.random().toString(36).substring(2, 15),
          name: isMonthly ? 'Product Redesign' : 'Code Refactoring',
          completedSteps: isMonthly ? 18 : 8,
          totalSteps: isMonthly ? 22 : 10,
          timeSpent: isMonthly ? 1260 : 620,
          complexity: 4,
          lastActivity: new Date().toISOString().split('T')[0],
          progress: isMonthly ? 82 : 80,
        },
        {
          id: Math.random().toString(36).substring(2, 15),
          name: isMonthly ? 'System Integration' : 'Performance Optimization',
          completedSteps: isMonthly ? 12 : 6,
          totalSteps: isMonthly ? 18 : 8,
          timeSpent: isMonthly ? 840 : 380,
          complexity: 5,
          lastActivity: new Date().toISOString().split('T')[0],
          progress: isMonthly ? 67 : 75,
        },
      ],
      achievements: isMonthly
        ? [
            'Deployed major product redesign to production',
            'Reduced system response time by 35%',
            'Completed documentation for 3 key modules',
            'Onboarded 2 new team members successfully',
          ]
        : [
            'Optimized database queries reducing load time by 30%',
            'Refactored authentication system improving security',
            'Created comprehensive test suite for the API',
            'Helped onboard a new developer to the team',
          ],
      tags: isMonthly ? ['Product', 'Performance', 'Documentation', 'Onboarding'] : ['Refactoring', 'Performance', 'Testing', 'Mentoring'],
    };

    return <PeriodSummaryCard summary={mockSummary} isMonthly={isMonthly} />;
  }

  // Sort summaries by date (newest first)
  const sortedSummaries = [...summaries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className='space-y-5'>
      {sortedSummaries.map((summary) => (
        <PeriodSummaryCard key={summary.id} summary={summary} isMonthly={isMonthly} />
      ))}
    </div>
  );
}
