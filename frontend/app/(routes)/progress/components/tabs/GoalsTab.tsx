import { PlusIcon, FlagIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { useProgress } from '../../hooks/useProgress';
import { Goal, GoalEvaluation } from '../../../../types/progress';

/**
 * Individual goal item with its current week evaluation
 */
function GoalItem({ goal, evaluation }: { goal: Goal; evaluation?: GoalEvaluation }) {
  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Format date to relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Get goal color band based on score or default
  const getGoalColor = (score?: number) => {
    if (!score) return 'from-blue-500 to-indigo-500';

    if (score >= 8) return 'from-emerald-500 to-green-500';
    if (score >= 5) return 'from-orange-500 to-yellow-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className='relative mb-6 flex flex-col rounded-lg bg-white transition-all hover:shadow-sm'>
      {/* Top color band */}
      <div className={`h-1.5 w-full rounded-t-xl bg-gradient-to-r ${getGoalColor(evaluation?.score)}`}></div>

      <div className='p-5'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <h3 className='text-lg font-semibold text-slate-800'>{goal.text}</h3>
            <div className='mt-1 flex items-center text-xs text-slate-500'>
              <ClockIcon className='mr-1 h-3.5 w-3.5' />
              <span>Created {formatDate(goal.createdAt)}</span>
              <span className='mx-2'>•</span>
              <span className={goal.active ? 'text-green-600' : 'text-slate-500'}>{goal.active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          {evaluation && (
            <div className={`ml-4 flex items-center rounded-full px-3 py-1 ${getScoreColor(evaluation.score)}`}>
              <div className='mr-1 font-bold text-lg'>{evaluation.score}</div>
              <div className='text-xs opacity-80'>/10</div>
            </div>
          )}
        </div>

        {evaluation && (
          <div className='mt-4 rounded-lg bg-slate-50 p-4'>
            <p className='text-slate-700'>{evaluation.comment}</p>
          </div>
        )}

        {!evaluation && (
          <div className='mt-4 rounded-lg bg-slate-50 p-4 text-center text-slate-500'>
            <p>No evaluation for current week</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Header component for the goals view
 */
function GoalsHeader({ weekStart, weekEnd }) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className='sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-sm'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <span className='font-medium text-sm text-slate-900'>Key Performance Indicators</span>
        </div>
        <div className='inline-flex items-center rounded-full bg-blue-50 px-3 py-1 font-medium text-xs text-blue-700'>
          Week of {formatDate(weekStart)} - {formatDate(weekEnd)}
        </div>
      </div>
    </div>
  );
}

/**
 * Form for adding a new goal
 */
function AddGoalForm({ onAddGoal }: { onAddGoal: (text: string) => void }) {
  const [goalText, setGoalText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalText.trim()) {
      onAddGoal(goalText.trim());
      setGoalText('');
      setIsExpanded(false);
    }
  };

  return (
    <div className='mb-6'>
      {!isExpanded ? (
        <div
          onClick={() => setIsExpanded(true)}
          className='flex cursor-pointer items-center rounded-lg border border-dashed border-slate-200 bg-white/50 p-4 text-slate-500 hover:bg-slate-50'
        >
          <div className='mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600'>
            <PlusIcon className='h-5 w-5' />
          </div>
          <span className='font-medium text-sm'>Add a new KPI</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm'>
          <div className='mb-3 flex items-center'>
            <FlagIcon className='mr-2 h-5 w-5 text-blue-600' />
            <h3 className='font-medium text-sm text-slate-800'>New Key Performance Indicator</h3>
          </div>
          <textarea
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            className='mb-3 w-full rounded-lg border border-slate-200 p-3 text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
            placeholder='Define your KPI with a measurable target and timeframe...'
            rows={3}
          />
          <div className='flex justify-end space-x-2'>
            <button
              type='button'
              onClick={() => setIsExpanded(false)}
              className='rounded-lg border border-slate-200 px-4 py-2 font-medium text-sm text-slate-600 hover:bg-slate-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='rounded-lg bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            >
              Add Goal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/**
 * Goals tab component displaying all user goals with current week evaluations
 */
export function GoalsTab() {
  // Current week - for demo purposes using a fixed date
  const currentWeekOf = '2023-04-03T00:00:00Z';

  // Note: In a real implementation, these would come from the API via useProgress hook
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      text: 'Increase customer satisfaction score to 85+ across all product lines',
      createdAt: '2023-01-15T12:00:00Z',
      active: true,
    },
    {
      id: '2',
      text: 'Reduce customer acquisition cost by 15% while maintaining growth targets',
      createdAt: '2023-02-10T09:30:00Z',
      active: true,
    },
    {
      id: '3',
      text: 'Launch 3 new enterprise features by EOQ to meet competitive market demands',
      createdAt: '2023-01-05T15:45:00Z',
      active: true,
    },
  ]);

  // Sample evaluations for current week only - would come from API
  const [currentEvaluations, setCurrentEvaluations] = useState<GoalEvaluation[]>([
    {
      goalId: '1',
      weekOf: currentWeekOf,
      score: 7,
      comment:
        'CSAT improved to 82.3% this week, up 1.2% from last week. Support ticket resolution time decreased by 15%. Need to address recurring UI issues in dashboard that are impacting scores.',
    },
    {
      goalId: '2',
      weekOf: currentWeekOf,
      score: 8,
      comment:
        'CAC reduced by 12.4% while maintaining 7% user growth. Optimized ad spend and improved conversion rate by 3.5%. On track to exceed 15% target if trends continue.',
    },
    {
      goalId: '3',
      weekOf: currentWeekOf,
      score: 4,
      comment:
        'Only 1 of 3 planned features is on schedule. Team bandwidth issues and technical debt are causing delays. Recommend revisiting timeline or adjusting resource allocation.',
    },
  ]);

  // Function to add a new goal
  const addGoal = (text: string) => {
    const newGoal: Goal = {
      id: `${goals.length + 1}`,
      text,
      createdAt: new Date().toISOString(),
      active: true,
    };
    setGoals([...goals, newGoal]);
  };

  // Get the week range for display
  const weekStart = new Date(currentWeekOf);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div className='flex h-full w-full flex-col overflow-hidden'>
      <GoalsHeader weekStart={weekStart} weekEnd={weekEnd} />

      <div className='flex-1 overflow-auto p-6'>
        <div className='mb-6'>
          <p className='text-sm text-slate-600'>
            Key performance indicators are evaluated weekly by AI based on data from connected systems and progress metrics. Each KPI receives a score from 0-10
            to track progress toward quarterly targets.
          </p>
        </div>

        <AddGoalForm onAddGoal={addGoal} />

        {goals.length > 0 ? (
          goals.map((goal) => {
            // Find current week evaluation for this goal if it exists
            const currentEvaluation = currentEvaluations.find((e) => e.goalId === goal.id);

            return <GoalItem key={goal.id} goal={goal} evaluation={currentEvaluation} />;
          })
        ) : (
          <div className='mb-8 flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-10 text-center'>
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100'>
              <FlagIcon className='h-6 w-6 text-slate-400' />
            </div>
            <h3 className='mb-2 text-lg font-semibold text-slate-700'>No KPIs defined yet</h3>
            <p className='text-slate-500'>Add your first key performance indicator to start tracking business metrics</p>
          </div>
        )}
      </div>
    </div>
  );
}
