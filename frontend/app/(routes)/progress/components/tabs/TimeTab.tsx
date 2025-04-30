import { useProgress } from '../../hooks/useProgress';
import { BarChart, PieChart } from '@/app/components/ui/charts';

/**
 * Time allocation component - shows time spent by category
 */
function TimeAllocation() {
  const { effortDistribution, activeProcesses, completedProcesses, selectedTimeFrame } = useProgress();

  // Data comes from API
  const timeData = effortDistribution || [];

  // Create data for pie chart
  const chartData = timeData.map((item) => ({
    id: item.category,
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
        <h3 className='text-lg font-medium text-gray-800'>Time Allocation</h3>
        <p className='text-sm text-gray-600'>Time spent by category (in minutes)</p>
      </div>

      <div className='my-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3'>
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
          <p className='text-xl font-semibold text-green-700'>{chartData.length}</p>
        </div>
      </div>

      <div className='flex-1'>
        {chartData.length > 0 ? (
          <div className='grid h-full grid-cols-1 gap-8 lg:grid-cols-2'>
            <PieChart data={chartData} height='100%' donut={true} showLabels={true} showLegend={true} labelPosition='outside' />

            <div className='flex flex-col justify-center space-y-3'>
              {chartData
                .sort((a, b) => b.value - a.value)
                .map((item) => (
                  <div key={item.id} className='flex items-center space-x-2'>
                    <div className='h-4 w-4 rounded-full' style={{ backgroundColor: item.color }}></div>
                    <div className='flex-1'>
                      <div className='h-6 w-full overflow-hidden rounded-full bg-gray-100'>
                        <div
                          className='h-6 rounded-full'
                          style={{
                            width: `${(item.value / totalTime) * 100}%`,
                            backgroundColor: item.color,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className='min-w-[60px] text-right'>
                      <span className='font-medium'>{Math.round(item.value / 60)}</span>
                      <span className='text-gray-500'> hrs</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className='flex h-full items-center justify-center'>
            <div className='text-center'>
              <div className='mb-4 inline-flex rounded-full bg-gray-50 p-4'>
                <svg className='h-8 w-8 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <p className='font-medium text-gray-500'>No time data available</p>
              <p className='mt-1 text-sm text-gray-400'>Track time in your processes to see distribution</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Daily activity component - shows activity by day
 */
function DailyActivity() {
  const { dailyActivities, selectedTimeFrame } = useProgress();

  // Data is from API
  const activities = dailyActivities || [];

  // Create data for bar chart
  const chartData = activities.map((activity) => ({
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
          <h3 className='text-lg font-medium text-gray-800'>Time Tracking</h3>
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
        <BarChart
          data={chartData}
          height='100%'
          showLabels={true}
          showValues={true}
          yAxisLabel='Time Spent (min)'
          xAxisLabel='Days of Week'
          valueFormat={(value) => `${value}m`}
          minValue={0}
        />
      </div>
    </div>
  );
}

/**
 * Time tab component
 */
export function TimeTab() {
  return (
    <div className='flex h-full flex-col'>
      <div className='mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2'>
        <TimeAllocation />
        <DailyActivity />
      </div>
    </div>
  );
}
