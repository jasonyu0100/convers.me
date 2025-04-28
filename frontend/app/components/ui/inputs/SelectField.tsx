'use client';

import { cn } from '@/app/lib/utils';
import { forwardRef, useState } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit {
  label?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;
  fullWidth?: boolean;
  className?: string;
  options: SelectOption[];
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, name, helperText, error = false, errorText, fullWidth = false, className = '', options = [], ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className={cn('flex flex-col space-y-2', fullWidth ? 'w-full' : 'max-w-md', className)}>
        {label && <label className='text-sm font-medium text-slate-700'>{label}</label>}

        <div className='relative'>
          <div
            className={cn(
              'relative flex h-12 items-center rounded-xl border px-3 transition-all duration-200',
              error ? 'border-red-400 bg-red-50' : isFocused ? 'border-blue-400 bg-white/80 shadow-sm' : 'border-slate-200 bg-slate-50',
            )}
          >
            <select
              ref={ref}
              className='w-full appearance-none bg-transparent pr-8 focus:outline-none'
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              name={name}
              {...props}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Custom dropdown arrow - positioned with flex */}
            <div className='pointer-events-none absolute right-3'>
              <svg className='h-4 w-4 text-slate-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
              </svg>
            </div>
          </div>
        </div>

        {error && errorText ? <p className='text-xs text-red-500'>{errorText}</p> : helperText ? <p className='text-xs text-slate-500'>{helperText}</p> : null}
      </div>
    );
  },
);

SelectField.displayName = 'SelectField';
