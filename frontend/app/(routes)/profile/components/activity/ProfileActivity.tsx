'use client';

import { useProfile } from '../../hooks';
import { ProfilePost } from './ProfilePost';

/**
 * Empty state component for when there are no activities
 */
function EmptyActivityState() {
  return (
    <div className='flex flex-col items-center justify-center px-4 py-12 text-center'>
      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50'>
        <svg xmlns='http://www.w3.org/2000/svg' className='h-8 w-8 text-blue-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
          />
        </svg>
      </div>
      <h3 className='mb-1 text-lg font-medium text-gray-900'>No Activity Yet</h3>
      <p className='max-w-md text-sm text-gray-500'>Activities you create will appear here. Create your first post or event to get started.</p>
    </div>
  );
}

/**
 * Component to display the user's activity feed
 */
export function ProfileActivity() {
  const { postsFromActivities } = useProfile();

  if (!postsFromActivities || postsFromActivities.length === 0) {
    return <EmptyActivityState />;
  }

  return (
    <div className='px-8 py-5'>
      <div className='space-y-6'>
        {postsFromActivities.map((post) => (
          <ProfilePost key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
