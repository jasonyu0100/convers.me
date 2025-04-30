import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useProcess } from '../../hooks';
import { ProcessStepItem } from './ProcessStepItem';

/**
 * Progress calculation helper
 */
function calculateCompletion(steps) {
  if (!steps || steps.length === 0) return { completed: 0, total: 0, percent: 0 };

  let totalItems = steps.length;
  let completedItems = steps.filter((step) => step.completed).length;

  // Count substeps
  steps.forEach((step) => {
    if (step.subSteps && step.subSteps.length > 0) {
      totalItems += step.subSteps.length;
      completedItems += step.subSteps.filter((subStep) => subStep.completed).length;
    }
  });

  return {
    completed: completedItems,
    total: totalItems,
    percent: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
  };
}

/**
 * Empty state display component
 */
function EmptyStateDisplay() {
  return (
    <div className='py-12 text-center'>
      <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50'>
        <CheckCircleIcon className='h-7 w-7 text-blue-400' />
      </div>
      <p className='text-lg font-medium text-slate-700'>No tasks in this template yet</p>
      <p className='mx-auto mt-2 max-w-xs text-sm text-slate-500'>Add tasks to create a structured process template for your workflow</p>
    </div>
  );
}

/**
 * Completed state display component
 */
function CompletedStateDisplay() {
  return (
    <div className='py-8 text-center'>
      <div className='mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100'>
        <CheckCircleIcon className='h-7 w-7 text-green-600' />
      </div>
      <p className='text-lg font-medium text-slate-700'>All tasks completed! 🎉</p>
      <p className='mt-1 text-sm text-slate-500'>This process template is ready to use</p>
    </div>
  );
}

/**
 * Progress header component
 */
function ProgressHeader({ progress }) {
  return (
    <div className='border-b border-slate-100 bg-white/80 px-4 py-3'>
      <div className='mb-2 flex items-center justify-between'>
        <div className='text-xs text-slate-500'>
          {progress.completed} of {progress.total} {progress.total === 1 ? 'item' : 'items'} complete
        </div>
        <span className='text-xs font-medium text-slate-700'>{progress.percent}%</span>
      </div>
      <div className='h-1 w-full overflow-hidden rounded-full bg-slate-100'>
        <div className='h-full rounded-full bg-blue-500 transition-all duration-300' style={{ width: `${progress.percent}%` }}></div>
      </div>
    </div>
  );
}

/**
 * Process list view component
 * Displays steps in a list format with progress tracking
 */
export function ProcessListView() {
  const { selectedList } = useProcess();

  if (!selectedList) {
    return null;
  }

  // Handle case where steps might be undefined
  const steps = selectedList.steps || [];
  const progress = calculateCompletion(steps);

  // Split into completed and incomplete steps
  const completedSteps = steps.filter((step) => step.completed);
  const incompleteSteps = steps.filter((step) => !step.completed);

  // Get color from the selectedList if available or use a default
  const cardColor = selectedList.color || 'from-blue-500 to-indigo-500';

  return (
    <div className='rounded-lg bg-white'>
      {/* Progress header */}
      {steps.length > 0 && <ProgressHeader progress={progress} />}

      {/* Steps display */}
      <div className='p-3'>
        {incompleteSteps.length === 0 && completedSteps.length === 0 ? (
          <EmptyStateDisplay />
        ) : incompleteSteps.length === 0 ? (
          <CompletedStateDisplay />
        ) : (
          <div className='space-y-1.5 py-2'>
            <h3 className='mb-3 px-3 text-sm font-medium text-slate-700'>Tasks to Complete</h3>
            {incompleteSteps.map((step) => (
              <ProcessStepItem key={step.id} step={step} listId={selectedList.id} />
            ))}
          </div>
        )}

        {/* Completed tasks section */}
        {completedSteps.length > 0 && (
          <div className='mt-6 border-t border-slate-100 pt-4'>
            <h3 className='mb-3 flex items-center px-3 text-sm font-medium text-slate-700'>
              <span className='mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-100'>
                <CheckCircleIcon className='h-3 w-3 text-green-600' />
              </span>
              Completed Tasks
            </h3>
            <div className='space-y-1.5'>
              {completedSteps.map((step) => (
                <ProcessStepItem key={step.id} step={step} listId={selectedList.id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
