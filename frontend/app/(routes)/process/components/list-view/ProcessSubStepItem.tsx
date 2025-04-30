import { CheckIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { ProcessesSubStep } from '../../../../types/process';
import { useProcess } from '../../hooks';

interface ProcessSubStepItemProps {
  subStep: ProcessesSubStep;
  listId: string;
  stepId: string;
}

export function ProcessSubStepItem({ subStep, listId, stepId }: ProcessSubStepItemProps) {
  const { handleCompleteSubStep, handleEditSubStep, handleDeleteSubStep } = useProcess();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(subStep.content);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      handleEditSubStep(listId, stepId, subStep.id, editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditValue(subStep.content);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`group flex items-center rounded-lg px-3 py-2 transition-all ${isHovered ? 'bg-slate-50' : subStep.completed ? 'bg-slate-50/30' : 'bg-white'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onClick={() => handleCompleteSubStep(listId, stepId, subStep.id, !subStep.completed)}
        className={`mr-3 flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors ${
          subStep.completed ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 hover:border-blue-500'
        }`}
      >
        {subStep.completed && <CheckIcon className='h-2 w-2' />}
      </div>

      {isEditing ? (
        <input
          ref={inputRef}
          type='text'
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className='flex-1 rounded border-0 border-b border-blue-400 bg-blue-50 p-1 text-sm focus:border-blue-500 focus:ring-0'
          autoFocus
        />
      ) : (
        <span
          className={`flex-1 cursor-pointer text-sm transition-colors ${subStep.completed ? 'text-slate-400 line-through' : 'text-slate-600'}`}
          onClick={() => setIsEditing(true)}
        >
          {subStep.content}
        </span>
      )}

      {/* Only show action buttons when hovered */}
      {isHovered && (
        <div className='ml-2 flex space-x-1'>
          <button
            onClick={() => setIsEditing(true)}
            className='rounded-full p-1 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600'
            title='Edit subtask'
          >
            <PencilIcon className='h-3 w-3' />
          </button>

          <button
            onClick={() => handleDeleteSubStep(listId, stepId, subStep.id)}
            className='rounded-full p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600'
            title='Delete subtask'
          >
            <TrashIcon className='h-3 w-3' />
          </button>
        </div>
      )}
    </div>
  );
}
