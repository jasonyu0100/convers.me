import React from 'react';

interface AuthFormErrorProps {
  message: string | null;
}

export function AuthFormError({ message }: AuthFormErrorProps) {
  if (!message) return null;

  return (
    <div className='mb-6 flex items-start rounded-xl border border-red-200 bg-red-50/80 p-4 text-red-600 shadow-sm' role='alert' aria-live='assertive'>
      <div className='mr-3 shrink-0'>
        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
          <path
            fillRule='evenodd'
            d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
            clipRule='evenodd'
          />
        </svg>
      </div>
      <p className='text-sm font-medium'>{message}</p>
    </div>
  );
}
