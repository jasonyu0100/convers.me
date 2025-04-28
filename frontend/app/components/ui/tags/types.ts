/**
 * Types for Tag components
 */

import { ReactNode } from 'react';

export type TagVariant = 'default' | 'gradient' | 'outline';
export type TagGradient = 'purple' | 'blue' | 'orange' | 'dark';
export type TagSize = 'xs' | 'sm' | 'md' | 'lg';

export interface TagBaseProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface TagProps extends TagBaseProps {
  variant?: TagVariant;
  gradient?: TagGradient;
}

export interface InterestTagProps {
  label: string;
  onClick?: () => void;
  size?: TagSize;
  active?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export const TAG_BASE_CLASSES = 'flex flex-row items-center rounded-full px-3 py-1.5 text-sm font-bold';

export const TAG_VARIANT_CLASSES: Record = {
  default: 'border border-slate-200 text-slate-700 bg-white/80',
  outline: 'border border-slate-200 text-slate-700',
  gradient: '', // This will be determined by the gradient type
};

export const TAG_GRADIENT_CLASSES: Record = {
  purple: 'border border-slate-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  blue: 'border border-slate-200 bg-gradient-to-r from-blue-500 to-green-500 text-white',
  orange: 'border border-slate-200 bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
  dark: 'border border-slate-200 bg-black text-white',
};

export const TAG_SIZE_CLASSES: Record = {
  xs: 'text-xs py-1 px-2',
  sm: 'text-xs py-1.5 px-3',
  md: 'text-sm py-1.5 px-3',
  lg: 'text-base py-2 px-4',
};
