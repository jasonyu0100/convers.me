import React, { useState } from 'react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = 'Search...' }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form className='flex h-[2.5rem] w-full flex-row items-center rounded-full border-1 border-slate-200 bg-slate-100 px-[1rem]' onSubmit={handleSubmit}>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth={1.5}
        stroke='currentColor'
        className='size-6 text-gray-500'
        aria-hidden='true'
      >
        <path strokeLinecap='round' strokeLinejoin='round' d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' />
      </svg>

      <input
        type='text'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className='ml-2 w-full bg-transparent outline-none'
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </form>
  );
}
