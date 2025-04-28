import { LineChart } from '@/app/components/ui/charts';
import { MetricCard, ProgressBar } from '@/app/components/ui/stats';
import { useInsight } from '../hooks/useInsight';

/**
 * Period selector component
 */
function PeriodSelector() {
  const { selectedPeriod, setSelectedPeriod } = useInsight();

  const periods = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
  ] as const;

  return (
    <div className='flex space-x-2'>
      {periods.map((period) => (
        <button
          key={period.value}
          className={`rounded-md px-3 py-1 text-sm font-medium ${
            selectedPeriod === period.value ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setSelectedPeriod(period.value)}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Weekly progress component
 */
function WeeklyProgress() {
  const { weeklyProgress, dailyActivities } = useInsight();

  // Ensure dailyActivities exists and is an array before mapping
  // Create data for the weekly progress chart with null checks
  const progressData = Array.isArray(dailyActivities)
    ? dailyActivities.map((day) => ({
        label: day && day.day ? day.day.substring(0, 3) : 'Day', // Mon, Tue, etc.
        value: day && day.timeSpent > 0 ? day.efficiency : null, // Show null for days with no activity
      }))
    : [];

  // Create data for daily task completion with null checks
  const taskCompletionData = Array.isArray(dailyActivities)
    ? dailyActivities.map((day) => ({
        label: day && day.day ? day.day.substring(0, 3) : 'Day',
        value: day ? day.eventsCompleted || 0 : 0,
      }))
    : [];

  return (
    <div className='rounded-lg border border-gray-200 bg-white/80 p-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium text-gray-800'>{weeklyProgress && weeklyProgress.week ? weeklyProgress.week : 'Current Week'}</h3>
        <span className='text-sm text-gray-500'>
          {weeklyProgress && weeklyProgress.startDate ? weeklyProgress.startDate : ''} -{' '}
          {weeklyProgress && weeklyProgress.endDate ? weeklyProgress.endDate : ''}
        </span>
      </div>

      <div className='mt-4'>
        <ProgressBar
          label='Weekly Progress'
          value={weeklyProgress && typeof weeklyProgress.progress === 'number' ? weeklyProgress.progress : 0}
          color='bg-blue-500'
          height='h-3'
        />
      </div>

      <div className='mt-4 grid grid-cols-2 gap-4'>
        <div>
          <p className='text-sm text-gray-500'>Events</p>
          <p className='text-xl font-semibold'>{weeklyProgress && weeklyProgress.eventsCompleted ? weeklyProgress.eventsCompleted : 0}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500'>Steps</p>
          <p className='text-xl font-semibold'>{weeklyProgress && weeklyProgress.stepsCompleted ? weeklyProgress.stepsCompleted : 0}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500'>Time Spent</p>
          <p className='text-xl font-semibold'>
            {weeklyProgress && weeklyProgress.totalTimeSpent ? (weeklyProgress.totalTimeSpent / 60).toFixed(1) : '0.0'} hrs
          </p>
        </div>
        <div>
          <p className='text-sm text-gray-500'>Efficiency</p>
          <p className='text-xl font-semibold'>{weeklyProgress && weeklyProgress.efficiency ? weeklyProgress.efficiency : 0}%</p>
        </div>
      </div>

      <div className='mt-6 space-y-5'>
        <div>
          <h4 className='mb-2 text-sm font-medium text-gray-700'>Weekly Efficiency Trend</h4>
          <LineChart
            data={progressData}
            height='180px'
            lineColor='#3b82f6'
            fillColor='rgba(59, 130, 246, 0.1)'
            yAxisLabel='Efficiency %'
            minValue={0}
            maxValue={100}
          />
        </div>

        <div>
          <h4 className='mb-2 text-sm font-medium text-gray-700'>Daily Task Completion</h4>
          <LineChart data={taskCompletionData} height='180px' lineColor='#10b981' fillColor='rgba(16, 185, 129, 0.1)' yAxisLabel='Tasks' minValue={0} />
        </div>
      </div>
    </div>
  );
}

/**
 * Daily activity component
 */
function DailyActivity() {
  const { dailyActivities } = useInsight();

  // Filter out days with no activity
  const activeDays = dailyActivities.filter((day) => day.timeSpent > 0);

  return (
    <div className='rounded-lg border border-gray-200 bg-white/80 p-6'>
      <h3 className='mb-4 text-lg font-medium text-gray-800'>Daily Activity</h3>

      <div className='space-y-4'>
        {activeDays.map((day) => (
          <div key={day.date} className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='font-medium'>{day.day}</span>
              <span className='text-sm text-gray-500'>{day.date}</span>
            </div>

            <div className='flex items-center space-x-2 text-sm'>
              <span className='rounded-full bg-blue-100 px-2 py-0.5 text-blue-700'>{day.eventsCompleted} events</span>
              <span className='rounded-full bg-purple-100 px-2 py-0.5 text-purple-700'>{day.stepsCompleted} steps</span>
              <span className='rounded-full bg-green-100 px-2 py-0.5 text-green-700'>{(day.timeSpent / 60).toFixed(1)} hrs</span>
            </div>

            <ProgressBar
              label='Efficiency'
              value={day.efficiency}
              color={day.efficiency >= 80 ? 'bg-green-500' : day.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'}
              showLabel={false}
            />
          </div>
        ))}

        {activeDays.length === 0 && (
          <div className='py-6 text-center text-gray-500'>
            <p>No activity data for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Process progress component
 */
function ProcessProgress() {
  const { activeProcesses } = useInsight();

  return (
    <div className='rounded-lg border border-gray-200 bg-white/80 p-6'>
      <h3 className='mb-4 text-lg font-medium text-gray-800'>Process Progress</h3>

      <div className='space-y-5'>
        {activeProcesses.map((process) => (
          <div key={process.id} className='space-y-2'>
            <div className='flex items-center justify-between'>
              <h4 className='font-medium'>{process.name}</h4>
              <span className='text-sm text-gray-500'>
                {process.completedSteps}/{process.totalSteps} steps
              </span>
            </div>

            <ProgressBar label='' value={process.progress} color='bg-blue-500' showLabel={false} />

            <div className='flex text-sm text-gray-500'>
              <div className='mr-4 flex items-center'>
                <svg className='mr-1 h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                <span>{(process.timeSpent / 60).toFixed(1)} hrs</span>
              </div>

              <div className='flex items-center'>
                <svg className='mr-1 h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                </svg>
                <span>Complexity: {process.complexity}/5</span>
              </div>
            </div>
          </div>
        ))}

        {activeProcesses.length === 0 && (
          <div className='py-6 text-center text-gray-500'>
            <p>No active processes</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Component for displaying performance metrics
 */
export function PerformanceMetrics() {
  const { coreMetrics } = useInsight();

  return (
    <div className='flex flex-col space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-bold text-gray-800'>Performance Metrics</h2>
        <PeriodSelector />
      </div>

      {/* Core metrics */}
      <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        {coreMetrics.map((metric) => (
          <MetricCard key={metric.id} title={metric.name} value={metric.value} unit={metric.unit} change={metric.change} isPositive={metric.isPositive} />
        ))}
      </div>

      {/* Weekly progress */}
      <WeeklyProgress />

      {/* Two-column layout for Daily Activity and Process Progress */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <DailyActivity />
        <ProcessProgress />
      </div>
    </div>
  );
}
