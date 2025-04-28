/**
 * Common type definitions for Avatar components
 */

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'away' | 'busy';

export interface AvatarBaseProps {
  size?: AvatarSize;
  onClick?: () => void;
  className?: string;
}

export interface AvatarProps extends AvatarBaseProps {
  src?: string;
  alt?: string;
  fallback?: string;
}

export interface UserData {
  id?: string;
  name: string;
  profileImage?: string;
}

export interface UserAvatarProps extends AvatarBaseProps {
  user: UserData;
  showStatus?: boolean;
  status?: AvatarStatus;
}

export const AVATAR_SIZE_CLASSES: Record = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export const STATUS_SIZE_CLASSES: Record = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-4 w-4',
};

export const STATUS_COLOR_CLASSES: Record = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};
