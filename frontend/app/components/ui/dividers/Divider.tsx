'use client';

interface DividerProps {
  text?: string;
  orientation?: 'horizontal' | 'vertical';
  thickness?: 'thin' | 'medium' | 'thick';
  className?: string;
}

/**
 * Reusable divider component with optional text
 */
export function Divider({ text, orientation = 'horizontal', thickness = 'thin', className = '' }: DividerProps) {
  // Thickness classes
  const thicknessClasses = {
    thin: orientation === 'horizontal' ? 'border-t' : 'border-l',
    medium: orientation === 'horizontal' ? 'border-t-2' : 'border-l-2',
    thick: orientation === 'horizontal' ? 'border-t-4' : 'border-l-4',
  };

  // If there's text, render a divider with text in the middle
  if (text) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className={`flex-grow ${thicknessClasses[thickness]} border-slate-100`} />
        <span className='mx-3 flex-shrink text-slate-500'>{text}</span>
        <div className={`flex-grow ${thicknessClasses[thickness]} border-slate-200`} />
      </div>
    );
  }

  // Otherwise, render a simple divider
  return <div className={` ${orientation === 'horizontal' ? 'w-full' : 'h-full'} ${thicknessClasses[thickness]} border-slate-200 ${className} `} />;
}
