'use client';

interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  percentage?: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
  showPercentage?: boolean;
}

/**
 * Reusable progress bar component for statistics and metrics
 */
export function ProgressBar({
  label,
  value,
  max = 100,
  percentage = (value / max) * 100,
  color = 'bg-blue-500',
  height = 'h-2',
  showLabel = true,
  showPercentage = true,
}: ProgressBarProps) {
  return (
    <div className='w-full'>
      {showLabel && (
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-gray-700'>{label}</span>
          {showPercentage && <span className='text-sm text-gray-500'>{percentage.toFixed(1)}%</span>}
        </div>
      )}
      <div className={`mt-1 w-full rounded-full bg-gray-200 ${height}`}>
        <div className={`rounded-full ${color} ${height}`} style={{ width: `${Math.min(100, percentage)}%` }}></div>
      </div>
    </div>
  );
}
