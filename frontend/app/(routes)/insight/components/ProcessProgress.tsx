import { LineChart } from '@/app/components/ui/charts';
import { ProgressBar } from '@/app/components/ui/stats';
import { useInsight } from '../hooks/useInsight';

/**
 * Component for displaying process progress
 */
export function ProcessProgress() {
  const { activeProcesses, weeklyProgress, quarterlyProgress, selectedTimeFrame } = useInsight();

  // Create data for the weekly progress chart
  const progressData =
    selectedTimeFrame === 'week'
      ? [
          { label: 'Mon', value: 75 },
          { label: 'Tue', value: 80 },
          { label: 'Wed', value: 62 },
          { label: 'Thu', value: 85 },
          { label: 'Fri', value: 78 },
          { label: 'Sat', value: null },
          { label: 'Sun', value: null },
        ]
      : quarterlyProgress.weeks.map((week) => ({
          label: week.week.replace('Week ', 'W'),
          value: week.progress,
        }));

  // Get the current progress data
  const currentProgress = selectedTimeFrame === 'week' ? weeklyProgress : quarterlyProgress;

  return (
    <div className='rounded-lg border border-gray-200 bg-white/80 p-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium text-gray-800'>{selectedTimeFrame === 'week' ? weeklyProgress.week : quarterlyProgress.quarter} Progress</h3>
        <span className='text-sm text-gray-500'>
          {currentProgress.startDate} - {currentProgress.endDate}
        </span>
      </div>

      <div className='mt-4'>
        <ProgressBar label='Overall Progress' value={currentProgress.progress} color='bg-blue-500' height='h-3' />
      </div>

      <div className='mt-4 grid grid-cols-2 gap-4'>
        <div>
          <p className='text-sm text-gray-500'>Events</p>
          <p className='text-xl font-semibold'>{currentProgress.eventsCompleted}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500'>Steps</p>
          <p className='text-xl font-semibold'>{currentProgress.stepsCompleted}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500'>Time Spent</p>
          <p className='text-xl font-semibold'>{(currentProgress.totalTimeSpent / 60).toFixed(1)} hrs</p>
        </div>
        <div>
          <p className='text-sm text-gray-500'>Efficiency</p>
          <p className='text-xl font-semibold'>{currentProgress.efficiency}%</p>
        </div>
      </div>

      <div className='mt-6'>
        <h4 className='mb-2 text-sm font-medium text-gray-700'>Progress Trend</h4>
        <LineChart
          data={progressData}
          height='180px'
          lineColor='#3b82f6'
          fillColor='rgba(59, 130, 246, 0.1)'
          yAxisLabel='Progress %'
          minValue={0}
          maxValue={100}
        />
      </div>

      <div className='mt-6'>
        <h4 className='mb-3 text-sm font-medium text-gray-700'>Active Processes</h4>
        <div className='space-y-4'>
          {activeProcesses.slice(0, 3).map((process) => (
            <div key={process.id} className='space-y-1'>
              <div className='flex items-center justify-between'>
                <h4 className='text-sm font-medium'>{process.name}</h4>
                <span className='text-xs text-gray-500'>
                  {process.completedSteps}/{process.totalSteps} steps
                </span>
              </div>

              <ProgressBar
                label=''
                value={process.progress}
                color={
                  process.progress >= 75 ? 'bg-green-500' : process.progress >= 50 ? 'bg-blue-500' : process.progress >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                }
                showLabel={false}
                height='h-2'
              />
            </div>
          ))}

          {activeProcesses.length === 0 && (
            <div className='py-4 text-center text-gray-500'>
              <p>No active processes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
