'use client';

import React from 'react';
import { UserAvatarProps, AVATAR_SIZE_CLASSES, STATUS_SIZE_CLASSES, STATUS_COLOR_CLASSES } from './types';

/**
 * Reusable user avatar component with status indicator
 */
export function UserAvatar({ user, size = 'md', className = '', onClick, showStatus = false, status = 'offline' }: UserAvatarProps) {
  // Get initials from user name
  const getInitials = () => {
    if (!user || !user.name) return '?';

    const name = user.name.trim();
    if (name === '') return '?';

    const parts = name.split(' ').filter((part) => part.length > 0);
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className='relative inline-block'>
      <div
        className={`overflow-hidden rounded-full border border-slate-200 bg-slate-100 ${AVATAR_SIZE_CLASSES[size]} ${
          onClick ? 'cursor-pointer transition-all duration-200 hover:border-slate-400' : ''
        } ${className}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        aria-label={onClick ? `${user.name}'s profile` : undefined}
      >
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt={`${user.name}'s profile`}
            className='h-full w-full object-cover'
            onError={(e) => {
              // Log the failed image URL for debugging
              const target = e.target as HTMLImageElement;
              console.error('Failed to load profile image:', target.src);

              // Try to fix the URL if it's a relative path by adding the base URL
              if (target.src && !target.src.startsWith('http') && !target.dataset.retried) {
                console.log('Attempting to fix relative URL');
                target.dataset.retried = 'true';

                // Try with /public prefix for Next.js public directory
                if (target.src.startsWith('/')) {
                  target.src = target.src;
                } else {
                  target.src = '/' + target.src;
                }
                return; // Don't create fallback yet, try the new URL first
              }

              // If we reach here, image loading has failed even after fixing URL
              target.style.display = 'none';

              // Create colorful fallback
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');

                // Calculate a consistent color based on name
                const initials = getInitials();
                const colors = [
                  'bg-blue-100 text-blue-800',
                  'bg-green-100 text-green-800',
                  'bg-purple-100 text-purple-800',
                  'bg-yellow-100 text-yellow-800',
                  'bg-pink-100 text-pink-800',
                  'bg-indigo-100 text-indigo-800',
                  'bg-red-100 text-red-800',
                  'bg-teal-100 text-teal-800',
                ];

                const charSum = user.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                const colorIndex = charSum % colors.length;
                const colorClasses = colors[colorIndex].split(' ');

                // Apply classes individually
                fallback.className = 'flex h-full w-full items-center justify-center font-medium';
                colorClasses.forEach((cls) => fallback.classList.add(cls));
                fallback.innerText = initials;
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          (() => {
            // Generate a consistent color based on the user's name
            const initials = getInitials();
            const colors = [
              'bg-blue-100 text-blue-800',
              'bg-green-100 text-green-800',
              'bg-purple-100 text-purple-800',
              'bg-yellow-100 text-yellow-800',
              'bg-pink-100 text-pink-800',
              'bg-indigo-100 text-indigo-800',
              'bg-red-100 text-red-800',
              'bg-teal-100 text-teal-800',
            ];

            // Use the sum of character codes to pick a consistent color for this user
            const charSum = user.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
            const colorIndex = charSum % colors.length;
            const colorClass = colors[colorIndex];

            return <div className={`flex h-full w-full items-center justify-center ${colorClass}`}>{initials}</div>;
          })()
        )}
      </div>

      {showStatus && (
        <div
          className={`absolute right-0 bottom-0 rounded-full border border-white ${STATUS_SIZE_CLASSES[size]} ${STATUS_COLOR_CLASSES[status]}`}
          aria-hidden='true'
        ></div>
      )}
    </div>
  );
}
