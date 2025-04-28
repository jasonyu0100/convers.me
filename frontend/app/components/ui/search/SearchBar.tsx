'use client';

import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  variant?: 'default' | 'rounded' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent) => void;
}

/**
 * Reusable search bar component with search icon and input field
 */
export function SearchBar({ onSearch, placeholder = 'Search...', ariaLabel, variant = 'pill', size = 'md', className = '', value, onChange }: SearchBarProps) {
  const [internalQuery, setInternalQuery] = useState('');

  // Use controlled or uncontrolled input based on props
  const isControlled = value !== undefined && onChange !== undefined;
  const query = isControlled ? value : internalQuery;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg',
  };

  // Variant classes
  const variantClasses = {
    default: 'rounded-md',
    rounded: 'rounded-lg',
    pill: 'rounded-full',
  };

  return (
    <form
      className={`flex w-full flex-row items-center border border-slate-200 bg-slate-100 px-3 transition-colors ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onSubmit={handleSubmit}
      role='search'
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth={1.5}
        stroke='currentColor'
        className='h-5 w-5 text-slate-500'
        aria-hidden='true'
      >
        <path strokeLinecap='round' strokeLinejoin='round' d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' />
      </svg>

      <input
        type='text'
        value={query}
        onChange={(e) => (isControlled ? onChange(e) : setInternalQuery(e.target.value))}
        className='ml-2 w-full bg-transparent text-center outline-none placeholder:text-slate-400'
        aria-label={ariaLabel || placeholder}
      />
    </form>
  );
}
