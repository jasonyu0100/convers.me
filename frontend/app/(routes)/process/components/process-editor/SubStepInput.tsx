import { TrashIcon } from '@heroicons/react/24/outline';

interface SubStepInputProps {
  stepIndex: number;
  subStepIndex: number;
  value: string;
  onRemove: () => void;
  onChange: (value: string) => void;
}

export function SubStepInput({ stepIndex, subStepIndex, value, onRemove, onChange }: SubStepInputProps) {
  return (
    <div className='group mb-2 flex items-center pl-10'>
      <div className='mr-3 h-4 w-4 flex-shrink-0 rounded-full border border-slate-300'></div>
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='flex-1 border-0 border-b border-slate-200 p-2 text-sm focus:border-blue-500 focus:ring-0'
        placeholder={`Subtask ${subStepIndex + 1}`}
      />
      <button
        type='button'
        onClick={onRemove}
        className='ml-2 text-gray-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:text-red-500'
      >
        <TrashIcon className='h-4 w-4' />
      </button>
    </div>
  );
}
