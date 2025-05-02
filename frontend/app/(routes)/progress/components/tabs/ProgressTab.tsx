import { AreaChart, BarChart } from '@/app/components/ui/charts';
import { useProgress } from '../../hooks/useProgress';

/**
 * Progress pulse component - shows the rhythm of work throughout the week
 */
function ProgressPulse() {
  const { dailyActivities, weeklyProgress, quarterlyProgress, selectedTimeFrame } = useProgress();

  // Create data for progress pulse chart with null checks
  const getPulseData = () => {
    if (selectedTimeFrame === 'week') {
      // Ensure dailyActivities exists and is an array
      if (!dailyActivities || !Array.isArray(dailyActivities) || dailyActivities.length === 0) {
        return [];
      }

      return dailyActivities.map((day) => ({
        // Safely access properties with null checks
        label: day && day.day ? day.day.substring(0, 3) : 'N/A',
        value: day && day.stepsCompleted !== undefined ? day.stepsCompleted : 0,
        color:
          day && day.efficiency
            ? day.efficiency >= 80
              ? '#10b981'
              : day.efficiency >= 60
              ? '#3b82f6'
              : day.efficiency >= 40
              ? '#f59e0b'
              : '#ef4444'
            : '#6b7280', // Default gray color
      }));
    } else {
      // Ensure quarterlyProgress exists and contains weeks
      if (!quarterlyProgress || !quarterlyProgress.weeks || !Array.isArray(quarterlyProgress.weeks) || quarterlyProgress.weeks.length === 0) {
        return [];
      }

      return quarterlyProgress.weeks.map((week) => ({
        // Safely access properties with null checks
        label: week && week.week ? week.week.replace('Week ', 'W') : 'W?',
        value: week && week.stepsCompleted !== undefined ? week.stepsCompleted : 0,
        color:
          week && week.efficiency
            ? week.efficiency >= 80
              ? '#10b981'
              : week.efficiency >= 60
              ? '#3b82f6'
              : week.efficiency >= 40
              ? '#f59e0b'
              : '#ef4444'
            : '#6b7280', // Default gray color
      }));
    }
  };

  const pulseData = getPulseData();

  // Calculate total steps and average per day
  const totalSteps = pulseData.reduce((sum, item) => sum + item.value, 0);
  const activeDays = pulseData.filter((item) => item.value > 0).length;
  const avgStepsPerDay = activeDays > 0 ? Math.round(totalSteps / activeDays) : 0;
  // Fix for empty arrays causing -Infinity with Math.max
  const maxSteps = pulseData.length > 0 ? Math.max(...pulseData.map((item) => item.value)) : 0;

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <div className='flex flex-col items-start justify-between md:flex-row md:items-center'>
        <div>
          <h3 className='font-medium text-lg text-gray-800'>{selectedTimeFrame === 'week' ? 'Progress Rhythm' : 'Quarterly Progress Rhythm'}</h3>
          <p className='text-sm text-gray-600'>Steps completed over time with efficiency coloring</p>
        </div>

        <div className='mt-2 flex items-center space-x-4 md:mt-0'>
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
        <div className='rounded-lg bg-gray-50 p-3 text-center'>
          <p className='text-sm text-gray-600'>Total Steps</p>
          <p className='text-xl font-semibold text-gray-800'>{totalSteps}</p>
        </div>
        <div className='rounded-lg bg-gray-50 p-3 text-center'>
          <p className='text-sm text-gray-600'>Daily Average</p>
          <p className='text-xl font-semibold text-gray-800'>{avgStepsPerDay}</p>
        </div>
        <div className='rounded-lg bg-gray-50 p-3 text-center'>
          <p className='text-sm text-gray-600'>Peak Day</p>
          <p className='text-xl font-semibold text-gray-800'>{maxSteps} steps</p>
        </div>
      </div>

      <div className='h-full'>
        <BarChart
          data={pulseData}
          height='100%'
          showLabels={true}
          showValues={true}
          yAxisLabel='Steps Completed'
          xAxisLabel={selectedTimeFrame === 'week' ? 'Days of Week' : 'Weeks of Quarter'}
          minValue={0}
        />
      </div>
    </div>
  );
}

/**
 * Progress burnup chart component
 */
function ProgressBurnup() {
  const { weeklyProgress, quarterlyProgress, selectedTimeFrame, dailyBurnup, quarterlyBurnup } = useProgress();

  // Create data for the burnup chart based on selected time frame with null checks
  const getBurnupData = () => {
    if (selectedTimeFrame === 'week') {
      // Ensure dailyBurnup exists and is an array
      if (!dailyBurnup || !Array.isArray(dailyBurnup) || dailyBurnup.length === 0) {
        return [];
      }

      return (dailyBurnup || []).map((day) => ({
        // Safely access properties with null checks
        label: day && day.day ? day.day.substring(0, 3) : 'N/A',
        value: day && day.progress !== undefined ? day.progress : 0,
      }));
    } else {
      // Ensure quarterlyBurnup exists and is an array
      if (!quarterlyBurnup || !Array.isArray(quarterlyBurnup) || quarterlyBurnup.length === 0) {
        return [];
      }

      return (quarterlyBurnup || []).map((week) => ({
        // Safely access properties with null checks
        label: week && week.week ? week.week.replace('Week ', 'W') : 'W?',
        value: week && week.progress !== undefined ? week.progress : 0,
      }));
    }
  };

  const burnupData = getBurnupData();

  // Calculate progress statistics
  const currentProgress = burnupData[burnupData.length - 1]?.value || 0;
  const startProgress = burnupData[0]?.value || 0;
  const progressIncrease = currentProgress - startProgress;

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <div>
        <h3 className='font-medium text-lg text-gray-800'>{selectedTimeFrame === 'week' ? 'Weekly Progress' : 'Quarterly Progress'}</h3>
        <p className='text-sm text-gray-600'>Cumulative progress toward 100% completion</p>
      </div>

      <div className='my-3 flex items-center justify-between rounded-lg bg-green-50 p-3'>
        <div>
          <p className='text-sm text-gray-600'>Current</p>
          <p className='text-xl font-semibold text-green-700'>{currentProgress}%</p>
        </div>
        <div className='h-10 w-px bg-gray-200'></div>
        <div>
          <p className='text-sm text-gray-600'>Increase</p>
          <p className='text-xl font-semibold text-blue-700'>+{progressIncrease}%</p>
        </div>
        <div className='h-10 w-px bg-gray-200'></div>
        <div className='text-right'>
          <p className='text-sm text-gray-600'>Remaining</p>
          <p className='text-xl font-semibold text-gray-700'>{100 - currentProgress}%</p>
        </div>
      </div>

      <div className='mt-3 flex-1'>
        <AreaChart
          data={burnupData}
          height='100%'
          areaColor='#10b981' // green-500
          areaGradientStart='rgba(16, 185, 129, 0.7)'
          areaGradientEnd='rgba(16, 185, 129, 0.1)'
          yAxisLabel='Progress %'
          xAxisLabel={selectedTimeFrame === 'week' ? 'Days of Week' : 'Weeks of Quarter'}
          showTarget={true}
          minValue={0}
          maxValue={100}
        />
      </div>
    </div>
  );
}

/**
 * Process progress component - modern compact view
 */
function ProcessProgressBox() {
  const { activeProcesses, completedProcesses, selectedTimeFrame } = useProgress();

  // All data comes from the API now
  const currentActiveProcesses = activeProcesses;
  const currentCompletedProcesses = completedProcesses;

  // Sort processes by progress
  const sortedProcesses = [...currentActiveProcesses].sort((a, b) => b.progress - a.progress);

  // Calculate completion rates
  const totalProcesses = currentActiveProcesses.length + currentCompletedProcesses.length;
  const completionRate = totalProcesses ? (currentCompletedProcesses.length / totalProcesses) * 100 : 0;

  // Get top processes (3 for weekly, 4 for quarterly)
  const topProcesses = sortedProcesses.slice(0, selectedTimeFrame === 'week' ? 3 : 4);

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <div className='flex items-center justify-between'>
        <h3 className='font-medium text-lg text-gray-800'>{selectedTimeFrame === 'week' ? 'Process Tracker' : 'Quarterly Process Tracker'}</h3>
        <span className='rounded-full bg-blue-50 px-3 py-1 font-medium text-sm text-blue-700'>{completionRate.toFixed(0)}% Overall</span>
      </div>

      <div className='my-4 grid grid-cols-3 gap-3'>
        <div className='rounded-lg bg-green-50 p-3 text-center'>
          <p className='text-sm text-gray-600'>Completed</p>
          <p className='text-xl font-semibold text-green-700'>{completedProcesses.length}</p>
        </div>
        <div className='rounded-lg bg-blue-50 p-3 text-center'>
          <p className='text-sm text-gray-600'>Active</p>
          <p className='text-xl font-semibold text-blue-700'>{activeProcesses.length}</p>
        </div>
        <div className='rounded-lg bg-purple-50 p-3 text-center'>
          <p className='text-sm text-gray-600'>Total Steps</p>
          <p className='text-xl font-semibold text-purple-700'>
            {activeProcesses.reduce((sum, p) => sum + p.completedSteps, 0) + completedProcesses.reduce((sum, p) => sum + p.completedSteps, 0)}
          </p>
        </div>
      </div>

      {topProcesses.length > 0 ? (
        <div className='space-y-4'>
          <h4 className='border-b border-gray-100 pb-1 font-medium text-sm text-gray-700'>Top Active Processes</h4>

          {topProcesses.map((process) => (
            <div key={process.id} className='rounded-xl bg-gray-50 p-4 transition-shadow hover:shadow-sm'>
              <div className='flex items-start justify-between'>
                <div className='w-3/4'>
                  <h5 className='mb-1 truncate font-medium text-gray-800'>{process.name}</h5>
                  <div className='flex items-center gap-3 text-xs text-gray-500'>
                    <span>
                      {process.completedSteps}/{process.totalSteps} steps
                    </span>
                    <span>•</span>
                    <span>{(process.timeSpent / 60).toFixed(1)} hrs</span>
                  </div>
                </div>
                <div
                  className={`rounded-full px-2 py-1 font-medium text-xs ${
                    process.progress >= 75
                      ? 'bg-green-100 text-green-800'
                      : process.progress >= 50
                      ? 'bg-blue-100 text-blue-800'
                      : process.progress >= 25
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {process.progress}%
                </div>
              </div>

              <div className='mt-3'>
                <div className='h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                  <div
                    className={`h-2 rounded-full ${
                      process.progress >= 75 ? 'bg-green-500' : process.progress >= 50 ? 'bg-blue-500' : process.progress >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${process.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}

          {sortedProcesses.length > 3 && (
            <div className='pt-2 text-center'>
              <button className='flex w-full items-center justify-center font-medium text-sm text-blue-600 hover:text-blue-800'>
                View all {sortedProcesses.length} processes
                <svg className='ml-1 h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className='py-6 text-center'>
          <div className='mb-4 inline-flex rounded-full bg-gray-50 p-4'>
            <svg className='h-8 w-8 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
              />
            </svg>
          </div>
          <p className='font-medium text-gray-500'>No active processes to display</p>
          <p className='mt-1 text-sm text-gray-400'>Create a new process to get started</p>
        </div>
      )}
    </div>
  );
}

/**
 * Progress tab component
 */
export function ProgressTab() {
  return (
    <div className='flex h-full flex-col'>
      <div className='mb-5 grid grid-cols-1 gap-5 md:grid-cols-2'>
        <ProgressPulse />
        <ProcessProgressBox />
      </div>
    </div>
  );
}
