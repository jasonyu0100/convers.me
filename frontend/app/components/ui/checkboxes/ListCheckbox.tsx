'use client';

import { CheckIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface ListCheckboxProps {
  id: string;
  content: string;
  completed: boolean;
  onChange: (id: string, completed: boolean) => void;
  isSubStep?: boolean;
}

export function ListCheckbox({ id, content, completed, onChange, isSubStep = false }: ListCheckboxProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    onChange(id, !completed);
  };

  return (
    <div
      className={`group flex items-center py-1.5 ${isSubStep ? 'pl-7' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onClick={handleToggle}
        className={` ${
          isSubStep ? 'h-4 w-4' : 'h-5 w-5'
        } mr-3 flex flex-shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors duration-150 ${
          completed ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 group-hover:border-blue-400 hover:border-blue-400'
        } `}
      >
        {completed && <CheckIcon className={`${isSubStep ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />}
      </div>

      <span
        className={`flex-1 text-sm transition-opacity duration-150 ${completed ? 'text-gray-400 line-through' : isSubStep ? 'text-gray-700' : 'text-gray-800'}`}
      >
        {content}
      </span>
    </div>
  );
}
