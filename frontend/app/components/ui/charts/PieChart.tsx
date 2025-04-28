'use client';

import { Cell, Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface PieChartSegment {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartSegment[];
  width?: number;
  height?: number;
  donut?: boolean;
  donutThickness?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  title?: string;
  className?: string;
}

/**
 * Reusable pie chart component using Recharts
 */
export function PieChart({
  data,
  width = 500,
  height = 350,
  donut = false,
  donutThickness = 50,
  showLabels = false,
  showLegend = true,
  title,
  className = '',
}: PieChartProps) {
  // Transform data for Recharts
  const chartData = data.map((segment) => ({
    name: segment.label,
    value: segment.value,
    color: segment.color,
  }));

  // Calculate inner radius for donut chart
  const outerRadius = Math.min(width, height) / 3; // Use smaller radius to leave more space
  const innerRadius = donut ? outerRadius - donutThickness : 0;

  // Custom tooltip renderer
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className='rounded border border-gray-200 bg-white/80 p-2 text-xs shadow-sm'>
          <p className='font-medium'>{data.name}</p>
          <p className='text-gray-700'>Value: {data.value}</p>
          <p className='text-gray-500'>{((data.value / chartData.reduce((sum: number, item: any) => sum + item.value, 0)) * 100).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  // Custom legend renderer
  const renderCustomizedLegend = (props: any) => {
    const { payload } = props;

    return (
      <div className='mt-2 flex flex-col space-y-2'>
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className='flex items-center'>
            <div className='mr-2 h-3 w-3 rounded-sm' style={{ backgroundColor: entry.color }}></div>
            <span className='mr-2 text-sm text-gray-700'>{entry.value}</span>
            <span className='text-xs text-gray-500'>
              {((chartData[index].value / chartData.reduce((sum: number, item: any) => sum + item.value, 0)) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex flex-col ${className}`} style={{ width, height: height + (title ? 30 : 0) }}>
      {title && <h3 className='mb-2 text-center text-sm font-medium text-gray-700'>{title}</h3>}

      <ResponsiveContainer width='100%' height='100%' minWidth={500}>
        <RechartsPieChart margin={{ left: 50, right: 100, top: 20, bottom: 20 }}>
          <Pie
            data={chartData}
            cx='40%'
            cy='50%'
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey='value'
            labelLine={showLabels}
            label={showLabels ? ({ name, percent }: any) => (percent > 0.1 ? `${(percent * 100).toFixed(0)}%` : '') : false}
            isAnimationActive={true}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke='white' strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              content={renderCustomizedLegend}
              layout='vertical'
              verticalAlign='middle'
              align='right'
              wrapperStyle={{
                position: 'absolute',
                right: 20,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '150px',
              }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
