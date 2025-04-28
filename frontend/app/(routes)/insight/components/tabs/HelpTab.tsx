import { useState } from 'react';
import { HelpTopic } from '../../../../types/insight';
import { useInsight } from '../../hooks/useInsight';

/**
 * Help section component displays topics of a specific category
 */
function HelpSection({ category, title, topics }: { category: string; title: string; topics: HelpTopic[] }) {
  return (
    <div className='mb-6 rounded-lg border border-gray-200 bg-white/80 p-6'>
      <h3 className='mb-4 text-lg font-medium text-gray-800'>{title}</h3>

      <div className='space-y-5'>
        {topics.map((topic) => (
          <div key={topic.term} className='space-y-1'>
            <h4 className='font-medium text-gray-900'>{topic.term}</h4>
            <p className='text-sm text-gray-700'>{topic.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Search component for filtering help topics
 */
function HelpSearch({ searchTerm, setSearchTerm }: { searchTerm: string; setSearchTerm: (term: string) => void }) {
  return (
    <div className='mb-6'>
      <div className='relative'>
        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
          <svg className='h-4 w-4 text-gray-500' aria-hidden='true' fill='none' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'>
            <path stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z'></path>
          </svg>
        </div>
        <input
          type='search'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='block w-full rounded-lg border border-gray-300 bg-white/80 p-2 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500'
          placeholder='Search for terms...'
        />
        {searchTerm && (
          <button type='button' className='absolute inset-y-0 right-0 flex items-center pr-3' onClick={() => setSearchTerm('')}>
            <svg className='h-4 w-4 text-gray-500 hover:text-gray-700' aria-hidden='true' fill='none' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'>
              <path d='M6 18L18 6M6 6l12 12' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Help tab component
 */
export function HelpTab() {
  const { helpTopics } = useInsight();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter topics based on search term
  const filteredTopics =
    searchTerm.trim() === ''
      ? helpTopics
      : helpTopics.filter(
          (topic) => topic.term.toLowerCase().includes(searchTerm.toLowerCase()) || topic.description.toLowerCase().includes(searchTerm.toLowerCase()),
        );

  // Group topics by category
  const generalTopics = filteredTopics.filter((topic) => topic.category === 'general');
  const kpiTopics = filteredTopics.filter((topic) => topic.category === 'kpi');
  const workTopics = filteredTopics.filter((topic) => topic.category === 'work');
  const timeTopics = filteredTopics.filter((topic) => topic.category === 'time');
  const effortTopics = filteredTopics.filter((topic) => topic.category === 'effort');

  const hasResults = filteredTopics.length > 0;

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <div className='mb-4'>
        <HelpSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        {searchTerm && (
          <div className='mb-2'>
            <span className='text-sm text-gray-500'>
              {filteredTopics.length} {filteredTopics.length === 1 ? 'result' : 'results'} found
            </span>
          </div>
        )}
      </div>

      <div className='flex-1 overflow-y-auto pr-1'>
        {!hasResults && (
          <div className='flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white/80 p-6 text-center'>
            <svg className='mb-4 h-12 w-12 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              ></path>
            </svg>
            <p className='mb-2 text-gray-700'>No matching terms found</p>
            <p className='text-sm text-gray-500'>Try using different keywords or browsing all topics</p>
          </div>
        )}

        {generalTopics.length > 0 && <HelpSection category='general' title='General Terms' topics={generalTopics} />}

        {kpiTopics.length > 0 && <HelpSection category='kpi' title='KPI Terms' topics={kpiTopics} />}

        {workTopics.length > 0 && <HelpSection category='work' title='Work Terms' topics={workTopics} />}

        {timeTopics.length > 0 && <HelpSection category='time' title='Time Terms' topics={timeTopics} />}

        {effortTopics.length > 0 && <HelpSection category='effort' title='Effort Terms' topics={effortTopics} />}
      </div>
    </div>
  );
}
