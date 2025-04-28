import { CheckIcon, ChevronDownIcon, ChevronRightIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { ProcessesSubStep } from '../../../../types/process';
import { useProcess } from '../../hooks';
import { ProcessSubStepItem } from './ProcessSubStepItem';

interface ProcessStepItemProps {
  step: ProcessesSubStep;
  listId: string;
}

export function ProcessStepItem({ step, listId }: ProcessStepItemProps) {
  const { handleCompleteStep, handleToggleStepExpanded, isStepExpanded, hasSubSteps, handleEditStep, handleDeleteStep, handleAddSubStep } = useProcess();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(step.content);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isExpanded = isStepExpanded(step.id);
  // Single check for substeps existence and validity
  const hasSubStepsArray = step.subSteps && Array.isArray(step.subSteps) && step.subSteps.length > 0;
  const showSubSteps = hasSubStepsArray && isExpanded;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      handleEditStep(listId, step.id, editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditValue(step.content);
      setIsEditing(false);
    }
  };

  return (
    <>
      <div
        className={`group rounded-lg px-3 py-2.5 transition-all ${isHovered ? 'bg-slate-50' : step.completed ? 'bg-slate-50/50' : 'bg-white/80'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className='flex items-center'>
          <div
            onClick={() => handleCompleteStep(listId, step.id, !step.completed)}
            className={`mr-3 flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors ${
              step.completed ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 hover:border-blue-500'
            }`}
          >
            {step.completed && <CheckIcon className='h-3 w-3' />}
          </div>

          {isEditing ? (
            <input
              ref={inputRef}
              type='text'
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              className='flex-1 rounded border-0 border-b border-blue-400 bg-blue-50 p-1.5 focus:border-blue-500 focus:ring-0'
              autoFocus
            />
          ) : (
            <span
              className={`flex-1 cursor-pointer font-medium transition-colors ${step.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}
              onClick={() => setIsEditing(true)}
            >
              {step.content}
            </span>
          )}

          <div className='ml-2 flex items-center space-x-1'>
            {/* Only show add/edit/delete when hovered */}
            {isHovered && (
              <>
                <button
                  onClick={() => handleAddSubStep(listId, step.id)}
                  className='rounded-full p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600'
                  title='Add subtask'
                >
                  <PlusIcon className='h-3.5 w-3.5' />
                </button>

                <button
                  onClick={() => setIsEditing(true)}
                  className='rounded-full p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600'
                  title='Edit step'
                >
                  <PencilIcon className='h-3.5 w-3.5' />
                </button>

                <button
                  onClick={() => handleDeleteStep(listId, step.id)}
                  className='rounded-full p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600'
                  title='Delete step'
                >
                  <TrashIcon className='h-3.5 w-3.5' />
                </button>
              </>
            )}

            {/* Always show expand/collapse if has subtasks */}
            {hasSubStepsArray && (
              <button
                onClick={() => handleToggleStepExpanded(step.id)}
                className={`rounded-full p-1.5 transition-colors ${isHovered ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400'}`}
              >
                {isExpanded ? <ChevronDownIcon className='h-4 w-4' /> : <ChevronRightIcon className='h-4 w-4' />}
              </button>
            )}
          </div>
        </div>

        {/* If has subtasks and expanded, show the subtask count */}
        {hasSubStepsArray && !isExpanded && (
          <div className='mt-1.5 ml-8'>
            <span className='rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400'>
              {step.subSteps?.length} subtask
              {step.subSteps?.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Subtasks section */}
      {showSubSteps && (
        <div className='mt-0.5 mb-1 ml-6 border-l border-slate-100 pl-4'>
          <div className='space-y-1 py-1'>
            {step.subSteps?.map((subStep) => <ProcessSubStepItem key={subStep.id} subStep={subStep} listId={listId} stepId={step.id} />)}
          </div>

          <div className='py-1.5 pl-2'>
            <button
              onClick={() => handleAddSubStep(listId, step.id)}
              className='flex items-center rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800'
            >
              <PlusIcon className='mr-1.5 h-3 w-3' />
              <span>Add subtask</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
