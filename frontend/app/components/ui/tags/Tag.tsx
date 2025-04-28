'use client';

import { TagProps, TAG_BASE_CLASSES, TAG_VARIANT_CLASSES, TAG_GRADIENT_CLASSES } from './types';

/**
 * Reusable tag component for categories, topics, etc.
 */
export function Tag({ children, variant = 'default', gradient = 'purple', onClick, className = '' }: TagProps) {
  // Interactive classes if onClick provided
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-sm transition-all duration-200' : '';

  // Get the right variant class (using gradient class if the variant is gradient)
  const variantClass = variant === 'gradient' ? TAG_GRADIENT_CLASSES[gradient] : TAG_VARIANT_CLASSES[variant];

  return (
    <div
      className={`${TAG_BASE_CLASSES} ${variantClass} ${interactiveClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
