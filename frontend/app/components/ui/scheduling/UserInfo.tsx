'use client';

export interface User {
  name: string;
  role?: string;
  profileImage?: string;
  avatarUrl?: string;
}

export interface UserInfoProps {
  user: User;
  title?: string;
  className?: string;
}

/**
 * A component for displaying user information in scheduling context
 */
export function UserInfo({ user, title = 'Ticket Owner', className = 'mt-6 border-t border-slate-100 pt-5' }: UserInfoProps) {
  const avatarSrc = user.profileImage || user.avatarUrl;

  return (
    <div className={className}>
      <div className='flex items-center justify-start space-x-3'>
        {avatarSrc ? (
          <img src={avatarSrc} alt={user.name || 'User'} className='h-10 w-10 rounded-full border border-slate-200 object-cover' />
        ) : (
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600'>
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
            </svg>
          </div>
        )}
        <div>
          <p className='text-base font-medium text-slate-700'>{user.name || 'Unassigned'}</p>
          <p className='text-sm text-slate-500'>{title}</p>
        </div>
      </div>
    </div>
  );
}
