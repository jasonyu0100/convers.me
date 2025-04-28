import { useApp } from '@/app/components/app/hooks';
import { ProfileHeaderProps } from '../../../../types/profile';
import { useState } from 'react';

/**
 * Get initials from a user's name
 */
const getInitials = (name: string): string => {
  if (!name || name.trim() === '') return '?';

  const parts = name
    .trim()
    .split(' ')
    .filter((part) => part.length > 0);
  if (parts.length > 1) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

/**
 * Profile-specific header component with user info and stats
 */
export function ProfileAboutHeader({ user }: ProfileHeaderProps) {
  const app = useApp();
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className='flex flex-col space-y-8 p-6'>
      <div className='flex w-full flex-row items-center justify-between space-x-8'>
        <div className='flex flex-row items-center space-x-4'>
          <div
            className='h-36 w-36 flex-shrink-0 overflow-hidden rounded-full border-1 border-slate-200 bg-slate-200'
            aria-label={`${user.name}'s profile picture`}
          >
            {!imageError && user.profileImage ? (
              <img
                src={user.profileImage}
                className='h-full w-full object-cover'
                alt={user.name}
                onError={(e) => {
                  console.error('Profile header image failed to load:', e.currentTarget.src);

                  // Try to fix the URL if it's a relative path
                  const target = e.currentTarget;
                  if (target.src && !target.src.startsWith('http') && !target.getAttribute('data-retried')) {
                    console.log('Attempting to fix profile header image URL');
                    target.setAttribute('data-retried', 'true');

                    // Try with public prefix for Next.js public directory
                    if (target.src.startsWith('/')) {
                      target.src = target.src;
                    } else {
                      target.src = '/' + target.src;
                    }
                    return; // Try loading again with the new URL
                  }

                  // If still fails, use the fallback
                  handleImageError();
                }}
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center bg-slate-200 text-3xl font-bold text-slate-600'>
                {getInitials(user.name || 'Anonymous User')}
              </div>
            )}
          </div>
          <div className='flex flex-col space-y-[0.5rem]'>
            <h1 className='text-3xl font-bold'>{user.name}</h1>
            <div className='flex flex-row items-center space-x-[0.5rem]'>
              <div className='h-[1rem] w-[1rem] rounded-full bg-green-500' aria-hidden={!user.isOnline} />
              <p className='text-md font-medium'>{user.profileUrl}</p>
            </div>
          </div>
        </div>
      </div>
      <p className='font-medium'>{user.biography}</p>
    </div>
  );
}
