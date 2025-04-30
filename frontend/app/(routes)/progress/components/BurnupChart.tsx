import { useProgress } from '../hooks/useProgress';
import { AreaChart } from '@/app/components/ui/charts';

interface BurnupChartProps {
  height?: string;
}

export function BurnupChart({ height = '300px' }: BurnupChartProps) {
  const { dailyBurnup, quarterlyBurnup, selectedTimeFrame } = useProgress();

  // Convert burnup data to chart format
  const getBurnupData = () => {
    if (selectedTimeFrame === 'week') {
      if (!dailyBurnup || !Array.isArray(dailyBurnup) || dailyBurnup.length === 0) {
        return [];
      }

      return dailyBurnup.map((day) => ({
        label: day?.day ? day.day.substring(0, 3) : 'N/A',
        value: day?.progress || 0,
      }));
    } else {
      if (!quarterlyBurnup || !Array.isArray(quarterlyBurnup) || quarterlyBurnup.length === 0) {
        return [];
      }

      return quarterlyBurnup.map((week) => ({
        label: week?.week ? week.week.replace('Week ', 'W') : 'W?',
        value: week?.progress || 0,
      }));
    }
  };

  const chartData = getBurnupData();
  const currentProgress = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;

  return (
    <div style={{ height }} className='w-full'>
      <AreaChart
        data={chartData}
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
  );
}
