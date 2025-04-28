import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({ children, onClick, variant = 'primary', size = 'md', className = '', icon, iconPosition = 'left' }: ButtonProps) {
  const baseClasses = 'flex items-center justify-center rounded-full font-bold transition-colors cursor-pointer';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700',
    secondary: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white hover:from-slate-600 hover:to-slate-700',
    outline: 'bg-transparent border-2 border-slate-200 text-slate-800 hover:bg-slate-100',
  };

  const sizeClasses = {
    sm: 'h-[3rem] px-4 text-sm',
    md: 'h-[4rem] px-6 text-base',
    lg: 'h-[5rem] px-6 text-2xl',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} onClick={onClick}>
      {icon && iconPosition === 'left' && <span className='mr-4'>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className='ml-4'>{icon}</span>}
    </button>
  );
}
