'use client';

import { ButtonProps, BUTTON_BASE_CLASSES, BUTTON_SIZE_CLASSES, BUTTON_VARIANT_CLASSES } from './types';

/**
 * Reusable button component with multiple variants and sizes
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}: ButtonProps) {
  // Width class
  const widthClass = fullWidth ? 'w-full' : '';

  // Disabled/loading state
  const stateClasses = props.disabled || isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      className={`${BUTTON_BASE_CLASSES} ${BUTTON_SIZE_CLASSES[size]} ${BUTTON_VARIANT_CLASSES[variant]} ${widthClass} ${stateClasses} ${className}`}
      disabled={props.disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className='mr-2 -ml-1 h-4 w-4 animate-spin text-current' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' aria-hidden='true'>
          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          ></path>
        </svg>
      )}

      {icon && iconPosition === 'left' && !isLoading && <span className='mr-2'>{icon}</span>}

      {children}

      {icon && iconPosition === 'right' && <span className='ml-2'>{icon}</span>}
    </button>
  );
}
