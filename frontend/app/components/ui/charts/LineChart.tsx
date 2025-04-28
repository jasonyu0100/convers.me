'use client';

import { Line, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Area } from 'recharts';

interface DataPoint {
  label: string;
  value: number | null;
}

interface LineChartProps {
  data: DataPoint[];
  height?: string;
  width?: string;
  lineColor?: string;
  fillColor?: string;
  showPoints?: boolean;
  showLabels?: boolean;
  showGrid?: boolean;
  title?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  minValue?: number;
  maxValue?: number;
}

/**
 * Reusable line chart component using Recharts
 */
export function LineChart({
  data,
  height = '200px',
  width = '100%',
  lineColor = '#3b82f6', // blue-500
  fillColor = 'rgba(59, 130, 246, 0.1)', // blue-500 with low opacity
  showPoints = true,
  showLabels = true,
  showGrid = true,
  title,
  yAxisLabel,
  xAxisLabel,
  minValue,
  maxValue,
}: LineChartProps) {
  // Transform data for Recharts
  const chartData = data.map((point) => ({
    name: point.label,
    value: point.value,
  }));

  return (
    <div className='w-full' style={{ height }}>
      {title && <h3 className='mb-2 text-sm font-medium text-gray-700'>{title}</h3>}

      <ResponsiveContainer width='100%' height='100%'>
        <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
          {showGrid && <CartesianGrid strokeDasharray='3 3' />}

          <XAxis
            dataKey='name'
            tick={{ fontSize: 12 }}
            height={40}
            tickMargin={10}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={{ stroke: '#E5E7EB' }}
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: 'insideBottom',
                    offset: -15,
                    style: {
                      textAnchor: 'middle',
                      fontSize: 12,
                      fill: '#6B7280',
                    },
                  }
                : undefined
            }
          />

          <YAxis
            domain={[minValue || 0, maxValue || 'auto']}
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={{ stroke: '#E5E7EB' }}
            width={40}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: 'insideLeft',
                    style: {
                      textAnchor: 'middle',
                      fontSize: 12,
                      fill: '#6B7280',
                    },
                  }
                : undefined
            }
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
          />

          <defs>
            <linearGradient id='colorValue' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor={lineColor} stopOpacity={0.2} />
              <stop offset='95%' stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <Area
            type='monotone'
            dataKey='value'
            stroke={lineColor}
            fillOpacity={1}
            fill='url(#colorValue)'
            strokeWidth={2}
            activeDot={{ r: 6 }}
            animationDuration={500}
            isAnimationActive={true}
          />

          <Line
            type='monotone'
            dataKey='value'
            stroke={lineColor}
            strokeWidth={2}
            dot={showPoints ? { fill: 'white', stroke: lineColor, strokeWidth: 2, r: 4 } : false}
            activeDot={{ r: 6 }}
            animationDuration={500}
            isAnimationActive={true}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
