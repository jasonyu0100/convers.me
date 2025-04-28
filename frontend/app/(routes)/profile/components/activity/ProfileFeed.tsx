import { ProfilePostsListProps } from '../../../../types/profile';
import { ProfilePost } from './ProfilePost';
import { useProfile } from '../../hooks';

/**
 * Component to display the activity feed in the profile
 */
export function ProfileFeed({ posts }: ProfilePostsListProps) {
  const { selectedYear, selectedQuarter, selectedWeek } = useProfile();

  // Create period string for showing timeframe
  const getPeriodText = () => {
    let periodText = `Q${selectedQuarter} ${selectedYear}`;
    if (selectedWeek) {
      periodText += ` - Week ${selectedWeek}`;
    }
    return periodText;
  };

  return (
    <div className='flex flex-col space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-medium text-slate-800'>Activity</h2>
        <span className='rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600'>{getPeriodText()}</span>
      </div>

      <div className='flex flex-col' role='feed' aria-label='Profile activity feed'>
        {posts.length === 0 ? (
          <div className='flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white/80 p-6 text-center'>
            <div>
              <p className='text-gray-500'>No activity found for this period</p>
              <p className='mt-1 text-sm text-gray-400'>Try selecting a different time period</p>
            </div>
          </div>
        ) : (
          <div className='space-y-6'>
            {posts.map((post) => (
              <ProfilePost key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
