'use client';

import { cn } from '@/app/lib/utils';
import { forwardRef, InputHTMLAttributes, useState } from 'react';

interface TextFieldProps extends InputHTMLAttributes {
  label?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;
  fullWidth?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  className?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, name, helperText, error = false, errorText, fullWidth = false, inputSize = 'md', startIcon, endIcon, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const sizeClasses = {
      sm: 'h-9 text-sm',
      md: 'h-12 text-base',
      lg: 'h-14 text-lg',
    };

    const inputWrapperClasses = cn(
      'flex items-center rounded-lg border px-3 transition-all duration-200 shadow-sm',
      sizeClasses[inputSize],
      error 
        ? 'border-red-400 bg-red-50' 
        : props.disabled
          ? 'border-slate-200 bg-gray-50 opacity-70'
          : isFocused 
            ? 'border-blue-400 bg-white' 
            : 'border-slate-200 bg-white',
    );

    return (
      <div className={cn('flex flex-col space-y-2', fullWidth ? 'w-full' : 'max-w-md', className)}>
        {label && <label className='text-sm font-medium text-slate-700'>{label}</label>}

        <div className={inputWrapperClasses}>
          {startIcon && <span className='mr-2 text-slate-500'>{startIcon}</span>}

          <input
            ref={ref}
            className={cn(
              'w-full bg-transparent focus:outline-none',
              props.disabled ? 'cursor-not-allowed text-gray-500' : 'text-gray-800'
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            name={name}
            {...props}
          />

          {endIcon && <span className='ml-2 text-slate-500'>{endIcon}</span>}
        </div>

        {error && errorText ? <p className='text-xs text-red-500'>{errorText}</p> : helperText ? <p className='text-xs text-slate-500'>{helperText}</p> : null}
      </div>
    );
  },
);

TextField.displayName = 'TextField';
