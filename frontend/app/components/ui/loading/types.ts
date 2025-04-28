/**
 * Types for Loading components
 */

export type LoadingSize = 'sm' | 'md' | 'lg';
export type LoadingColor = 'blue' | 'white';

export interface LoadingSpinnerProps {
  size?: LoadingSize;
  color?: LoadingColor;
  text?: string;
  fullScreen?: boolean;
}

export interface PageLoadingProps {
  message?: string;
  showBackground?: boolean;
}

export const LOADING_SIZE_CLASSES: Record = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

export const LOADING_COLOR_CLASSES: Record = {
  blue: 'text-blue-600',
  white: 'text-white',
};
