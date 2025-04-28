'use client';

import { AvatarProps, AVATAR_SIZE_CLASSES } from './types';

/**
 * Reusable avatar component with multiple sizes
 */
export function Avatar({ src, alt = 'User avatar', size = 'md', fallback, onClick, className = '' }: AvatarProps) {
  // Get initials from fallback or alt text
  const getInitials = () => {
    if (fallback) return fallback.charAt(0).toUpperCase();

    if (alt && alt !== 'User avatar') {
      const parts = alt.split(' ');
      if (parts.length > 1) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      return alt.charAt(0).toUpperCase();
    }

    return 'U';
  };

  // Container classes
  const containerClasses = `overflow-hidden rounded-full border border-slate-200 ${
    onClick ? 'cursor-pointer hover:border-slate-400 transition-all duration-200' : ''
  } ${AVATAR_SIZE_CLASSES[size]} ${className}`;

  // If no image source is provided, show fallback with initials in a colorful background
  if (!src) {
    // Generate a consistent color based on the initials
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

    // Use the sum of character codes to pick a consistent color
    const charSum = initials.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const colorIndex = charSum % colors.length;
    const colorClass = colors[colorIndex];

    return (
      <div
        className={`${containerClasses} flex items-center justify-center ${colorClass}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        aria-label={onClick ? alt : undefined}
      >
        <span className='font-medium'>{initials}</span>
      </div>
    );
  }

  // Otherwise show the image
  return (
    <div className={containerClasses} onClick={onClick} role={onClick ? 'button' : undefined} aria-label={onClick ? alt : undefined}>
      <img src={src} alt={alt} className='h-full w-full object-cover' />
    </div>
  );
}
