'use client';

import { StatusBadge } from '@/app/components/ui/status';
import { EventStatus } from '@/app/types/shared';
import { useEffect, useRef, useState } from 'react';

interface StatusSelectProps {
  status: EventStatus;
  onChange: (status: EventStatus) => void;
}

// Define status options available in the dropdown
const statusOptions: EventStatus[] = ['Pending', 'Planning', 'Execution', 'Review', 'Administrative', 'Done'];

export function StatusSelect({ status, onChange }: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (newStatus: EventStatus) => {
    // Only proceed if status is actually changing
    if (newStatus !== status) {
      onChange(newStatus);
    }
    setIsOpen(false);
  };

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Status button using StatusBadge */}
      <button
        type='button'
        onClick={toggleDropdown}
        className='focus:ring-opacity-50 flex items-center justify-between gap-2 rounded-md pr-2 transition-all hover:brightness-95 focus:ring-2 focus:ring-blue-500 focus:outline-none'
        aria-expanded={isOpen}
        aria-haspopup='true'
      >
        <StatusBadge status={status} withIcon={true} />

        <svg
          className={`h-4 w-4 flex-shrink-0 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 20 20'
          fill='currentColor'
          aria-hidden='true'
        >
          <path
            fillRule='evenodd'
            d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
            clipRule='evenodd'
          />
        </svg>
      </button>

      {/* Dropdown with improved styling */}
      {isOpen && (
        <div
          className='ring-opacity-5 absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white/80 shadow-lg ring-1 ring-black backdrop-blur-sm'
          role='menu'
          aria-orientation='vertical'
          aria-labelledby='status-options-menu'
        >
          <div className='py-1' role='none'>
            {statusOptions.map((optionStatus) => (
              <button
                key={optionStatus}
                onClick={() => handleSelect(optionStatus)}
                className='block w-full px-3 py-2 text-left hover:bg-gray-100'
                role='menuitem'
              >
                <StatusBadge
                  status={optionStatus}
                  withIcon={true}
                  className={`w-full justify-between ${status === optionStatus ? 'ring-2 ring-offset-1' : ''}`}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
