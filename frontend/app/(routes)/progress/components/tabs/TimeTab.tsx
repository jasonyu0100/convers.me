import { BarChart, PieChart } from '@/app/components/ui/charts';
import { useProgress } from '../../hooks/useProgress';

/**
 * Time allocation component - shows time spent by category with pie chart
 */
function TimeAllocation() {
  const { effortDistribution, selectedTimeFrame } = useProgress();

  // Data comes from API
  const timeData = effortDistribution || [];

  // Create data for pie chart
  const pieChartData = timeData.map((item) => ({
    label: item.category,
    value: item.value,
    color: item.color,
  }));

  // Calculate totals
  const totalTime = timeData.reduce((sum, item) => sum + item.value, 0);
  const averagePerDay = Math.round(totalTime / (selectedTimeFrame === 'week' ? 7 : 90)); // 7 days or ~90 days in quarter

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <div>
        <h3 className='font-medium text-lg text-gray-800'>Time Allocation</h3>
        <p className='text-sm text-gray-600'>Time spent by category (in minutes)</p>
      </div>

      <div className='my-4 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <div className='rounded-lg bg-blue-50 p-3 text-center'>
          <p className='text-sm text-gray-600'>Total Time</p>
          <p className='text-xl font-semibold text-blue-700'>{Math.round(totalTime / 60)} hrs</p>
        </div>
        <div className='rounded-lg bg-purple-50 p-3 text-center'>
          <p className='text-sm text-gray-600'>Daily Average</p>
          <p className='text-xl font-semibold text-purple-700'>{Math.round(averagePerDay / 60)} hrs</p>
        </div>
        <div className='rounded-lg bg-green-50 p-3 text-center'>
          <p className='text-sm text-gray-600'>Categories</p>
          <p className='text-xl font-semibold text-green-700'>{pieChartData.length}</p>
        </div>
      </div>

      <div className='flex-1 pt-2'>
        <PieChart data={pieChartData} height={300} donut={true} donutThickness={60} showLabels={true} showLegend={true} className='mx-auto' />
      </div>
    </div>
  );
}

/**
 * Daily activity component - shows activity by day with bar chart
 */
function DailyActivity() {
  const { dailyActivities, selectedTimeFrame } = useProgress();

  // Data is from API
  const activities = dailyActivities || [];

  // Create data for bar chart
  const barChartData = activities.map((activity) => ({
    label: activity.day ? activity.day.substring(0, 3) : 'N/A',
    value: activity.timeSpent, // Time in minutes
    color: activity.efficiency >= 80 ? '#10b981' : activity.efficiency >= 60 ? '#3b82f6' : activity.efficiency >= 40 ? '#f59e0b' : '#ef4444',
  }));

  // Calculate statistics
  const totalTimeSpent = activities.reduce((sum, activity) => sum + activity.timeSpent, 0);
  const mostProductive = [...activities].sort((a, b) => b.efficiency - a.efficiency)[0];
  const mostBusy = [...activities].sort((a, b) => b.timeSpent - a.timeSpent)[0];

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <div className='flex flex-col items-start justify-between sm:flex-row sm:items-center'>
        <div>
          <h3 className='font-medium text-lg text-gray-800'>Time Tracking</h3>
          <p className='text-sm text-gray-600'>Daily activity with efficiency</p>
        </div>

        <div className='mt-2 flex items-center space-x-4 sm:mt-0'>
          <div className='flex items-center'>
            <div className='mr-1 h-3 w-3 rounded-full bg-green-500'></div>
            <span className='text-xs text-gray-600'>High Efficiency</span>
          </div>
          <div className='flex items-center'>
            <div className='mr-1 h-3 w-3 rounded-full bg-red-500'></div>
            <span className='text-xs text-gray-600'>Low Efficiency</span>
          </div>
        </div>
      </div>

      <div className='my-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div className='rounded-lg bg-blue-50 p-3 text-center'>
          <p className='text-sm text-gray-600'>Total Hours</p>
          <p className='text-xl font-semibold text-blue-700'>{Math.round(totalTimeSpent / 60)}</p>
        </div>
        <div className='rounded-lg bg-green-50 p-3 text-center'>
          <p className='text-sm text-gray-600'>Most Efficient</p>
          <p className='text-xl font-semibold text-green-700'>
            {mostProductive ? `${mostProductive.day?.substring(0, 3) || 'N/A'} (${mostProductive.efficiency}%)` : 'N/A'}
          </p>
        </div>
        <div className='rounded-lg bg-purple-50 p-3 text-center'>
          <p className='text-sm text-gray-600'>Most Active</p>
          <p className='text-xl font-semibold text-purple-700'>
            {mostBusy ? `${mostBusy.day?.substring(0, 3) || 'N/A'} (${Math.round(mostBusy.timeSpent / 60)}h)` : 'N/A'}
          </p>
        </div>
      </div>

      <div className='mt-3 flex-1'>
        <BarChart data={barChartData} height='100%' showLabels={true} showValues={true} yAxisLabel='Time Spent (min)' xAxisLabel='Days of Week' minValue={0} />
      </div>
    </div>
  );
}

/**
 * Time tab component with enhanced visualization
 */
export function TimeTab() {
  return (
    <div className='flex h-full flex-col'>
      <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
        <TimeAllocation />
        <DailyActivity />
      </div>
    </div>
  );
}
