import { ChevronDownIcon, ChevronRightIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface StepInputProps {
  stepIndex: number;
  value: string;
  hasSubSteps: boolean;
  isExpanded: boolean;
  onRemove: () => void;
  onChange: (value: string) => void;
  onAddSubStep: () => void;
  onToggleExpand: () => void;
}

export function StepInput({ stepIndex, value, hasSubSteps, isExpanded, onRemove, onChange, onAddSubStep, onToggleExpand }: StepInputProps) {
  return (
    <div className='mb-3 flex flex-col'>
      <div className='group flex items-center'>
        <div className='mr-3 h-5 w-5 flex-shrink-0 rounded-full border border-slate-300'></div>
        <input
          type='text'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='flex-1 border-0 border-b border-slate-200 p-2 focus:border-blue-500 focus:ring-0'
          placeholder={`Task ${stepIndex + 1}`}
        />

        <div className='flex items-center'>
          {hasSubSteps && (
            <button type='button' onClick={onToggleExpand} className='mx-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600'>
              {isExpanded ? <ChevronDownIcon className='h-4 w-4' /> : <ChevronRightIcon className='h-4 w-4' />}
            </button>
          )}

          <button
            type='button'
            onClick={onAddSubStep}
            className='mx-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-500'
            title='Add subtask'
          >
            <PlusIcon className='h-4 w-4' />
          </button>

          <button
            type='button'
            onClick={onRemove}
            className='rounded-full p-1 text-gray-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-gray-100 hover:text-red-500'
          >
            <TrashIcon className='h-4 w-4' />
          </button>
        </div>
      </div>
    </div>
  );
}
