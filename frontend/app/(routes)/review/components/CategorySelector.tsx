/**
 * Category selector component with styled design matching library for Review section
 */
import { KnowledgeCategoryType } from '@/app/types/review';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useReview } from '../hooks/useReview';

export function CategorySelector() {
  const { selectedCategory, setSelectedCategory } = useReview();

  const categories: { id: KnowledgeCategoryType; label: string }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'insight', label: 'Insights' },
    { id: 'recommendation', label: 'Recommendations' },
    { id: 'achievement', label: 'Achievements' },
    { id: 'learning', label: 'Learnings' },
  ];

  return (
    <div className='flex items-center'>
      <div className='relative'>
        <div className='flex items-center space-x-1'>
          <AdjustmentsHorizontalIcon className='h-4 w-4 text-slate-500' />
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value === '' ? undefined : (e.target.value as KnowledgeCategoryType))}
            className='appearance-none border-0 bg-transparent py-1.5 pr-8 pl-1 text-sm font-medium text-slate-700 focus:ring-0 focus:outline-none'
            aria-label='Filter by category'
          >
            <option value=''>All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <div className='pointer-events-none absolute right-0 flex items-center pr-1 text-slate-500'>
            <svg className='h-4 w-4 fill-current' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
