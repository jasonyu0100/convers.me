import { PieChart } from '@/app/components/ui/charts';
import { useProgress } from '../../hooks/useProgress';

/**
 * Effort distribution component
 */
function EffortDistribution() {
  const { effortDistribution } = useProgress();

  // Data comes from API
  const distributionData = effortDistribution || [];

  // Create chart data
  const chartData = distributionData.map((item) => ({
    id: item.category,
    label: item.category,
    value: item.value,
    color: item.color,
  }));

  // Calculate total
  const total = distributionData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <h3 className='text-lg font-medium text-gray-800'>Effort Distribution</h3>
      <p className='text-sm text-gray-600'>How your effort is distributed across different categories</p>

      <div className='mt-4 flex-1'>
        {chartData.length > 0 ? (
          <div className='grid h-full grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='flex items-center justify-center'>
              <PieChart data={chartData} height='100%' donut={true} showLabels={true} showLegend={false} labelPosition='inside' />
            </div>

            <div className='flex flex-col justify-center space-y-4'>
              {chartData
                .sort((a, b) => b.value - a.value)
                .map((item) => (
                  <div key={item.id} className='flex flex-col space-y-1'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center'>
                        <div className='mr-2 h-3 w-3 rounded-full' style={{ backgroundColor: item.color }}></div>
                        <span className='text-sm font-medium text-gray-700'>{item.label}</span>
                      </div>
                      <span className='text-sm font-semibold'>{item.value} points</span>
                    </div>
                    <div className='h-2 w-full overflow-hidden rounded-full bg-gray-100'>
                      <div
                        className='h-2 rounded-full'
                        style={{
                          width: `${(item.value / total) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      ></div>
                    </div>
                    <p className='text-xs text-gray-500'>{Math.round((item.value / total) * 100)}% of total effort</p>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className='flex h-full items-center justify-center'>
            <div className='text-center'>
              <div className='mb-4 inline-flex rounded-full bg-gray-50 p-4'>
                <svg className='h-8 w-8 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                  />
                </svg>
              </div>
              <p className='font-medium text-gray-500'>No effort data available</p>
              <p className='mt-1 text-sm text-gray-400'>Track effort in your processes to see distribution</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Activity breakdown component
 */
function ActivityBreakdown() {
  const { activeProcesses, dailyActivities } = useProgress();

  // Generate activity stats
  const activityStats = [
    {
      title: 'Active Processes',
      value: activeProcesses.length,
      description: 'Processes currently in progress',
      icon: (
        <svg className='h-6 w-6 text-blue-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
          />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Steps Completed',
      value: dailyActivities.reduce((total, day) => total + day.stepsCompleted, 0),
      description: 'Total steps completed in period',
      icon: (
        <svg className='h-6 w-6 text-green-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
        </svg>
      ),
      color: 'bg-green-50 text-green-700',
    },
    {
      title: 'Events Completed',
      value: dailyActivities.reduce((total, day) => total + day.eventsCompleted, 0),
      description: 'Total events completed in period',
      icon: (
        <svg className='h-6 w-6 text-purple-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
      ),
      color: 'bg-purple-50 text-purple-700',
    },
    {
      title: 'Time Spent',
      value: `${Math.round(dailyActivities.reduce((total, day) => total + day.timeSpent, 0) / 60)}h`,
      description: 'Total time spent on activities',
      icon: (
        <svg className='h-6 w-6 text-yellow-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
        </svg>
      ),
      color: 'bg-yellow-50 text-yellow-700',
    },
  ];

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <h3 className='text-lg font-medium text-gray-800'>Activity Summary</h3>
      <p className='text-sm text-gray-600'>Key metrics about your activities this period</p>

      <div className='mt-6 grid flex-1 grid-cols-1 gap-6 md:grid-cols-2'>
        {activityStats.map((stat, index) => (
          <div key={index} className={`flex rounded-lg ${stat.color} p-4`}>
            <div className='mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-white shadow-sm'>{stat.icon}</div>
            <div>
              <p className='font-medium'>{stat.title}</p>
              <p className='text-2xl font-bold'>{stat.value}</p>
              <p className='mt-1 text-xs opacity-80'>{stat.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Effort tab component
 */
export function EffortTab() {
  return (
    <div className='flex h-full flex-col'>
      <div className='mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2'>
        <EffortDistribution />
        <ActivityBreakdown />
      </div>
    </div>
  );
}
