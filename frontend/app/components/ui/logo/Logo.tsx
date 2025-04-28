'use client';

import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid } from '@heroicons/react/24/solid';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

const logoVariants = cva(
  // Base styles
  'flex items-center transition-all duration-300',
  {
    variants: {
      // Size variants
      size: {
        xs: 'gap-1',
        sm: 'gap-1.5',
        md: 'gap-2',
        lg: 'gap-3',
      },
      // Theme variants (color schemes)
      theme: {
        default: 'text-blue-500',
        light: 'text-blue-400',
        dark: 'text-blue-600',
        white: 'text-white',
        gray: 'text-slate-700',
      },
      // Display variants
      display: {
        full: 'space-x-1', // Show icon and text
        icon: '', // Icon only
        text: '', // Text only
      },
      // Icon style variants
      iconStyle: {
        outline: '',
        solid: '',
        gradient: '',
      },
    },
    // Default variants
    defaultVariants: {
      size: 'md',
      theme: 'default',
      display: 'full',
      iconStyle: 'outline',
    },
  },
);

export interface LogoProps extends VariantProps {
  className?: string;
  textClassName?: string;
  iconClassName?: string;
  onClick?: () => void;
}

/**
 * Modern reusable Logo component
 * Can be configured to show icon, text or both with various styles and sizes
 */
export function Logo({
  size = 'md',
  theme = 'default',
  display = 'full',
  iconStyle = 'outline',
  className = '',
  textClassName = '',
  iconClassName = '',
  onClick,
}: LogoProps) {
  // Text size based on the size prop
  const textSizeClasses = {
    xs: 'text-sm font-bold',
    sm: 'text-base font-bold',
    md: 'text-xl font-bold',
    lg: 'text-3xl font-bold',
  };

  // Icon size based on the size prop
  const iconSizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  // Gradient background for the icon when iconStyle is gradient
  const gradientIconClasses = iconStyle === 'gradient' ? 'p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm' : '';

  // Select the appropriate icon based on the iconStyle
  const IconComponent = iconStyle === 'solid' ? ChatBubbleLeftRightIconSolid : ChatBubbleLeftRightIcon;

  return (
    <div
      className={`${logoVariants({
        size,
        theme,
        display,
        iconStyle,
      })} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {display !== 'text' && (
        <div className={`${gradientIconClasses} ${iconClassName}`}>
          <IconComponent
            className={`${iconSizeClasses[size || 'md']} transition-transform duration-300 ${onClick ? 'group-hover:scale-110' : ''}`}
            aria-hidden='true'
          />
        </div>
      )}

      {display !== 'icon' && <span className={`${textSizeClasses[size || 'md']} transition-colors duration-300 ${textClassName}`}>convers.me</span>}
    </div>
  );
}
