'use client';

import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { ListCheckbox } from './ListCheckbox';

export interface ChecklistStep {
  id: string;
  content: string;
  completed: boolean;
  subSteps?: ChecklistSubStep[];
}

export interface ChecklistSubStep {
  id: string;
  content: string;
  completed: boolean;
}

interface ChecklistPanelProps {
  title: string;
  steps: ChecklistStep[];
  onStepChange: (stepId: string, completed: boolean) => void;
  onSubStepChange: (stepId: string, subStepId: string, completed: boolean) => void;
}

export function ChecklistPanel({ title, steps, onStepChange, onSubStepChange }: ChecklistPanelProps) {
  // Initialize expandedStepIds with all step IDs that have substeps to expand them by default
  const [expandedStepIds, setExpandedStepIds] = useState<Set>(() => {
    const initialExpanded = new Set();
    steps.forEach((step) => {
      if (step.subSteps && step.subSteps.length > 0) {
        initialExpanded.add(step.id);
      }
    });
    return initialExpanded;
  });

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

  const hasSubSteps = (step: ChecklistStep) => {
    return !!step.subSteps && step.subSteps.length > 0;
  };

  const handleStepChange = (stepId: string, completed: boolean) => {
    onStepChange(stepId, completed);
  };

  const handleSubStepChange = (stepId: string, subStepId: string, completed: boolean) => {
    onSubStepChange(stepId, subStepId, completed);
  };

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className='w-full'>
      <h3 className='mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase'>{title}</h3>

      <div className='space-y-1'>
        {/* Incomplete steps */}
        {incompleteSteps.map((step) => (
          <div key={step.id} className='rounded-md'>
            <div className='flex items-center'>
              <ListCheckbox id={step.id} content={step.content} completed={step.completed} onChange={handleStepChange} />

              {hasSubSteps(step) && (
                <button onClick={() => toggleStepExpanded(step.id)} className='ml-1 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600'>
                  {isStepExpanded(step.id) ? <ChevronDownIcon className='h-3.5 w-3.5' /> : <ChevronRightIcon className='h-3.5 w-3.5' />}
                </button>
              )}
            </div>

            {hasSubSteps(step) && isStepExpanded(step.id) && (
              <div className='mt-1 ml-2 space-y-1'>
                {step.subSteps?.map((subStep) => (
                  <ListCheckbox
                    key={subStep.id}
                    id={subStep.id}
                    content={subStep.content}
                    completed={subStep.completed}
                    onChange={(id, completed) => handleSubStepChange(step.id, id, completed)}
                    isSubStep
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Completed steps (if any) */}
        {completedSteps.length > 0 && (
          <div className='mt-4 border-t border-slate-100 pt-2'>
            <div className='mb-2 text-xs font-medium text-gray-500'>Completed</div>
            {completedSteps.map((step) => (
              <div key={step.id} className='rounded-md'>
                <div className='flex items-center'>
                  <ListCheckbox id={step.id} content={step.content} completed={step.completed} onChange={handleStepChange} />

                  {hasSubSteps(step) && (
                    <button onClick={() => toggleStepExpanded(step.id)} className='ml-1 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600'>
                      {isStepExpanded(step.id) ? <ChevronDownIcon className='h-3.5 w-3.5' /> : <ChevronRightIcon className='h-3.5 w-3.5' />}
                    </button>
                  )}
                </div>

                {hasSubSteps(step) && isStepExpanded(step.id) && (
                  <div className='mt-1 ml-2 space-y-1'>
                    {step.subSteps?.map((subStep) => (
                      <ListCheckbox
                        key={subStep.id}
                        id={subStep.id}
                        content={subStep.content}
                        completed={subStep.completed}
                        onChange={(id, completed) => handleSubStepChange(step.id, id, completed)}
                        isSubStep
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
