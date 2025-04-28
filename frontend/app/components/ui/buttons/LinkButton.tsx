'use client';

import Link from 'next/link';
import { LinkButtonProps } from './types';

/**
 * Link button component that can function as either a link or a button
 * Styled to match the button in the process section
 */
export function LinkButton({ children, href, icon, className = '', onClick }: LinkButtonProps) {
  // Classes to match the provided link element with gradient
  const baseClasses =
    'flex items-center rounded-md bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700';
  const allClasses = `${baseClasses} ${className}`;

  const content = (
    <>
      {icon && <span className='mr-1.5'>{icon}</span>}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={allClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button className={allClasses} onClick={onClick} type='button'>
      {content}
    </button>
  );
}
