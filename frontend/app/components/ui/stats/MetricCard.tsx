'use client';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  change?: number;
  isPositive?: boolean;
  showChange?: boolean;
  className?: string;
}

/**
 * Reusable metric card component for displaying performance stats
 */
export function MetricCard({ title, value, unit = '', change, isPositive = true, showChange = true, className = '' }: MetricCardProps) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white/80 p-6 ${className}`}>
      <h3 className='text-sm font-medium text-gray-500'>{title}</h3>
      <p className='mt-1 text-3xl font-semibold text-gray-800'>
        {value}
        {unit && <span className='text-xl font-medium text-gray-500'>{unit}</span>}
      </p>

      {showChange && change !== undefined && (
        <div className='mt-1 flex items-center'>
          <span className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <svg className={`mr-1 h-4 w-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={isPositive ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
            </svg>
            {Math.abs(change)}%
          </span>
          <span className='ml-2 text-sm text-gray-500'>vs previous period</span>
        </div>
      )}
    </div>
  );
}
