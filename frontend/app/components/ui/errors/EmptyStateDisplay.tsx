import React from 'react';

export interface EmptyStateDisplayProps {
  /**
   * The title message for the empty state
   */
  title: string;

  /**
   * Optional description text
   */
  description?: string;

  /**
   * Optional action button text
   */
  actionText?: string;

  /**
   * Optional action callback
   */
  onAction?: () => void;

  /**
   * Optional icon component to display
   */
  icon?: React.ReactNode;

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Standardized empty state display component for use across all routes
 * Shows a message when no content is available
 */
export function EmptyStateDisplay({ title, description, actionText, onAction, icon, className = '' }: EmptyStateDisplayProps) {
  return (
    <div className={`flex flex-1 flex-col items-center justify-center p-8 text-center ${className}`}>
      {icon && <div className='mb-4'>{icon}</div>}
      <h3 className='text-xl font-medium text-gray-700'>{title}</h3>
      {description && <p className='mt-2 text-gray-500'>{description}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className='mt-4 rounded-md bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:outline-none'
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
