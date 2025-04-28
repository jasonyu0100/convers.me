'use client';

import { CheckIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { StatusSelect } from '@/app/(routes)/room/components/ui/StatusSelect';
import { Button } from '@/app/components/ui/buttons/Button';

export interface ProcessStep {
  id: string;
  content: string;
  completed: boolean;
  subSteps?: ProcessSubStep[];
}

export interface ProcessSubStep {
  id: string;
  content: string;
  completed: boolean;
}

// For the detailed process list component
interface DetailedProcessProgressProps {
  title: string;
  description?: string;
  steps: ProcessStep[];
  onStepChange: (stepId: string, completed: boolean) => void;
  onSubStepChange: (stepId: string, subStepId: string, completed: boolean) => void;
  templateId?: string;
  isTemplate?: boolean;
  status?: string;
  onStatusChange?: (status: string) => void;
  onViewTemplate?: () => void;
}

// For simple progress bar in sidebar
interface SimpleProgressProps {
  progress: number;
  showPercentage?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
}

// Union type for all ProcessProgress props
type ProcessProgressProps = DetailedProcessProgressProps | SimpleProgressProps;

// Type guard to determine which component to render
function isDetailedProps(props: ProcessProgressProps): props is DetailedProcessProgressProps {
  return 'steps' in props && Array.isArray(props.steps);
}

export function ProcessProgress(props: ProcessProgressProps) {
  // Simple progress bar for sidebar
  if (!isDetailedProps(props)) {
    const { progress, showPercentage = false, size = 'md', color = 'blue' } = props;

    // Determine height based on size
    const heightClass = {
      xs: 'h-1',
      sm: 'h-1.5',
      md: 'h-2',
      lg: 'h-3',
    }[size];

    // Determine color class
    const colorClass =
      color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-green-500' : color === 'purple' ? 'bg-purple-500' : color === 'red' ? 'bg-red-500' : color; // Use the color directly if it's not one of the predefined values

    return (
      <div className='w-full'>
        {showPercentage && (
          <div className='mb-1 flex items-center justify-end'>
            <div className='text-xs font-medium text-slate-600'>{progress}%</div>
          </div>
        )}
        <div className={`w-full overflow-hidden rounded-full bg-slate-100`}>
          <div className={`${heightClass} ${colorClass} transition-all duration-300`} style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  }

  // Detailed process list component
  const { title, description, steps, onStepChange, onSubStepChange, status, onStatusChange, templateId, isTemplate, onViewTemplate } = props;

  // Calculate progress
  const calculateProgress = (steps: ProcessStep[]) => {
    let totalItems = steps.length;
    let completedItems = steps.filter((step) => step.completed).length;

    // Count substeps in the totals
    steps.forEach((step) => {
      if (step.subSteps && step.subSteps.length > 0) {
        totalItems += step.subSteps.length;
        completedItems += step.subSteps.filter((subStep) => subStep.completed).length;
      }
    });

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const progress = calculateProgress(steps);

  // Initialize expandedStepIds with all step IDs that have substeps to expand them by default
  const [expandedStepIds, setExpandedStepIds] = useState<Set>(() => {
    const initialExpanded = new Set<string>();
    steps.forEach((step) => {
      if (step.subSteps && step.subSteps.length > 0) {
        initialExpanded.add(step.id);
      }
    });
    return initialExpanded;
  });

  // Separate completed and incomplete steps
  const completedSteps = steps.filter((step) => step.completed);
  const incompleteSteps = steps.filter((step) => !step.completed);

  // Update expanded steps when new steps with substeps are added
  useEffect(() => {
    setExpandedStepIds((prev) => {
      const newSet = new Set(prev);
      steps.forEach((step) => {
        if (step.subSteps && step.subSteps.length > 0 && !prev.has(step.id)) {
          newSet.add(step.id);
        }
      });
      return newSet;
    });
  }, [steps]);

  const toggleStepExpanded = (stepId: string) => {
    setExpandedStepIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const isStepExpanded = (stepId: string) => {
    return expandedStepIds.has(stepId);
  };

  const hasSubSteps = (step: ProcessStep) => {
    return !!step.subSteps && step.subSteps.length > 0;
  };

  return (
    <div className='w-full'>
      {/* Status and Progress bar */}
      <div className='mb-6'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='text-sm font-medium text-slate-700'>Progress</div>
          <div className='text-sm font-medium text-blue-600'>{progress}%</div>
        </div>
        <div className='h-2 w-full overflow-hidden rounded-full bg-slate-100'>
          <div className='h-full rounded-full bg-blue-500 transition-all duration-300' style={{ width: `${progress}%` }} />
        </div>

        {/* Status Select */}
        {status && onStatusChange && (
          <div className='mt-4 flex items-center justify-between'>
            <div className='text-sm font-medium text-slate-700'>Status</div>
            <div className='flex-shrink-0'>
              {/* Import and use StatusSelect directly */}
              <StatusSelect status={status} onChange={onStatusChange} />
            </div>
          </div>
        )}

        {/* Template Button - Show if not a template and onViewTemplate is provided */}
        {!isTemplate && onViewTemplate && (
          <div className='mt-4'>
            {templateId && typeof templateId === 'string' && templateId.length > 0 ? (
              <Button
                variant='primary'
                fullWidth={true}
                onClick={onViewTemplate}
                icon={
                  <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='h-4 w-4'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z'
                    />
                  </svg>
                }
              >
                View Original Template
              </Button>
            ) : (
              <Button
                variant='outline'
                fullWidth={true}
                onClick={onViewTemplate}
                icon={
                  <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='h-4 w-4'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
                  </svg>
                }
              >
                Create New Template
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Steps list */}
      <div className='space-y-4'>
        <h4 className='text-xs font-semibold tracking-wider text-slate-500 uppercase'>STEPS</h4>

        {/* Show message if no steps */}
        {steps.length === 0 && <div className='rounded-xl bg-slate-50 py-4 text-center text-slate-500'>No steps available</div>}

        {/* Incomplete steps */}
        {incompleteSteps.length > 0 && (
          <div className='space-y-1'>
            {incompleteSteps.map((step) => (
              <div key={step.id} className='group rounded-lg transition-colors hover:bg-slate-50'>
                <div className='flex items-center px-3 py-2.5'>
                  <div
                    onClick={() => onStepChange(step.id, !step.completed)}
                    className={`mr-3 flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors ${
                      step.completed ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 hover:border-blue-500'
                    }`}
                  >
                    {step.completed && <CheckIcon className='h-3 w-3' />}
                  </div>

                  <span className={`flex-1 font-medium ${step.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{step.content}</span>

                  {hasSubSteps(step) && (
                    <button onClick={() => toggleStepExpanded(step.id)} className='rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600'>
                      {isStepExpanded(step.id) ? <ChevronDownIcon className='h-4 w-4' /> : <ChevronRightIcon className='h-4 w-4' />}
                    </button>
                  )}
                </div>

                {/* Substeps */}
                {hasSubSteps(step) && isStepExpanded(step.id) && (
                  <div className='mb-1 ml-6 space-y-1 border-l border-slate-100 pl-4'>
                    {step.subSteps?.map((subStep) => (
                      <div key={subStep.id} className='group flex items-center rounded-lg px-3 py-2 hover:bg-slate-50'>
                        <div
                          onClick={() => onSubStepChange(step.id, subStep.id, !subStep.completed)}
                          className={`mr-3 flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors ${
                            subStep.completed ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 hover:border-blue-500'
                          }`}
                        >
                          {subStep.completed && <CheckIcon className='h-2 w-2' />}
                        </div>

                        <span className={`flex-1 text-sm ${subStep.completed ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{subStep.content}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Completed steps */}
        {completedSteps.length > 0 && (
          <div className='mt-5 border-t border-slate-100 pt-5'>
            <h4 className='mb-2 text-xs font-medium text-slate-500'>COMPLETED</h4>

            <div className='space-y-1'>
              {completedSteps.map((step) => (
                <div key={step.id} className='group rounded-lg transition-colors hover:bg-slate-50/80'>
                  <div className='flex items-center px-3 py-2.5'>
                    <div
                      onClick={() => onStepChange(step.id, !step.completed)}
                      className={`mr-3 flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors ${
                        step.completed ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 hover:border-blue-500'
                      }`}
                    >
                      {step.completed && <CheckIcon className='h-3 w-3' />}
                    </div>

                    <span className={`flex-1 font-medium ${step.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{step.content}</span>

                    {hasSubSteps(step) && (
                      <button onClick={() => toggleStepExpanded(step.id)} className='rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600'>
                        {isStepExpanded(step.id) ? <ChevronDownIcon className='h-4 w-4' /> : <ChevronRightIcon className='h-4 w-4' />}
                      </button>
                    )}
                  </div>

                  {/* Substeps */}
                  {hasSubSteps(step) && isStepExpanded(step.id) && (
                    <div className='mb-1 ml-6 space-y-1 border-l border-slate-100 pl-4'>
                      {step.subSteps?.map((subStep) => (
                        <div key={subStep.id} className='group flex items-center rounded-lg px-3 py-2 hover:bg-slate-50'>
                          <div
                            onClick={() => onSubStepChange(step.id, subStep.id, !subStep.completed)}
                            className={`mr-3 flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors ${
                              subStep.completed ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 hover:border-blue-500'
                            }`}
                          >
                            {subStep.completed && <CheckIcon className='h-2 w-2' />}
                          </div>

                          <span className={`flex-1 text-sm ${subStep.completed ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{subStep.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
