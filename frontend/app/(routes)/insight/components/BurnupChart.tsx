import { LineChart } from '@/app/components/ui/charts';
import { LoadingSpinner } from '@/app/components/ui/loading';
import { useState, useEffect } from 'react';
import { useInsight } from '../hooks/useInsight';

/**
 * Burnup chart component that visualizes progress towards completion
 */
export function BurnupChart() {
  const { selectedTimeFrame, dailyBurnup, quarterlyBurnup } = useInsight();
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);

  // Process data separately to improve performance
  useEffect(() => {
    setIsLoading(true);

    // Use setTimeout to defer processing and not block the UI
    const timer = setTimeout(() => {
      let data: { label: string; value: number }[] = [];

      if (selectedTimeFrame === 'week') {
        // Process daily burnup data with null checks
        if (dailyBurnup && Array.isArray(dailyBurnup)) {
          data = dailyBurnup
            .filter((item) => item !== null && item !== undefined)
            .map((item) => ({
              label: item && item.day ? item.day.substring(0, 3) : 'Day', // Mon, Tue, etc.
              value: item && typeof item.progress === 'number' ? item.progress : 0,
            }));
        }
      } else {
        // Process quarterly burnup data with null checks
        if (quarterlyBurnup && Array.isArray(quarterlyBurnup)) {
          data = quarterlyBurnup
            .filter((item) => item !== null && item !== undefined)
            .map((item) => ({
              label: item && item.week ? item.week.replace('Week ', 'W') : 'W',
              value: item && typeof item.progress === 'number' ? item.progress : 0,
            }));
        }
      }

      setChartData(data);
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedTimeFrame, dailyBurnup, quarterlyBurnup]);

  return (
    <div className='rounded-lg border border-gray-200 bg-white/80 p-6'>
      <h3 className='mb-4 text-lg font-medium text-gray-800'>Progress Burnup Chart</h3>

      <div className='mt-6'>
        <h4 className='mb-2 text-sm font-medium text-gray-700'>{selectedTimeFrame === 'week' ? 'Daily Progress' : 'Weekly Progress'}</h4>

        {isLoading ? (
          <div className='flex h-[200px] items-center justify-center'>
            <LoadingSpinner size='md' />
          </div>
        ) : (
          <LineChart
            data={chartData}
            height='200px'
            lineColor='#10b981' // Green color
            fillColor='rgba(16, 185, 129, 0.1)' // Light green fill
            yAxisLabel='Completion %'
            minValue={0}
            maxValue={100}
          />
        )}
      </div>

      <div className='mt-4 text-sm text-gray-500'>
        <p>
          This chart shows your progress towards completion over time.
          {selectedTimeFrame === 'week'
            ? ' Daily progress indicates how your completion rate has improved throughout the week.'
            : ' Weekly progress shows your quarter-to-date completion trend.'}
        </p>
      </div>
    </div>
  );
}
