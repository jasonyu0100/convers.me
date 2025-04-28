/**
 * Types for Button components
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonBaseProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export interface ButtonProps extends ButtonBaseProps, Omit {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  iconPosition?: 'left' | 'right';
}

export interface LinkButtonProps extends ButtonBaseProps {
  href?: string;
  onClick?: () => void;
}

export const BUTTON_BASE_CLASSES = 'inline-flex items-center justify-center font-bold rounded-full transition-all duration-200';

export const BUTTON_SIZE_CLASSES: Record = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const BUTTON_VARIANT_CLASSES: Record = {
  primary: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm',
  secondary: 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-sm',
  outline: 'border border-slate-200 hover:border-slate-400 bg-transparent hover:bg-slate-50 text-slate-700',
  text: 'bg-transparent hover:bg-slate-50 text-slate-700',
};
