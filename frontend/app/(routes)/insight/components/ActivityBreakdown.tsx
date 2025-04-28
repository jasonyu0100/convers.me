import { useInsight } from '../hooks/useInsight';

/**
 * Component for displaying activity breakdown - tag distribution removed
 */
export function ActivityBreakdown() {
  return (
    <div className='rounded-lg border border-gray-200 bg-white/80 p-6'>
      <h3 className='mb-4 text-lg font-medium text-gray-800'>Activity Breakdown</h3>
      <p className='py-10 text-center text-gray-500'>Activity by tag feature has been removed.</p>
    </div>
  );
}
