'use client';

import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DataPoint {
  label: string;
  value: number;
  target?: number;
}

interface AreaChartProps {
  data: DataPoint[];
  height?: string;
  width?: string;
  areaColor?: string;
  areaGradientStart?: string;
  areaGradientEnd?: string;
  showPoints?: boolean;
  showGrid?: boolean;
  title?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  minValue?: number;
  maxValue?: number;
  showTarget?: boolean;
  targetColor?: string;
}

/**
 * Reusable area chart component for burnup charts using Recharts
 */
export function AreaChart({
  data,
  height = '250px',
  width = '100%',
  areaColor = '#3b82f6', // blue-500
  areaGradientStart = 'rgba(59, 130, 246, 0.6)',
  areaGradientEnd = 'rgba(59, 130, 246, 0.1)',
  showPoints = true,
  showGrid = true,
  title,
  yAxisLabel,
  xAxisLabel,
  minValue = 0,
  maxValue = 100,
  showTarget = false,
  targetColor = '#ef4444', // red-500
}: AreaChartProps) {
  // Transform data for Recharts
  const chartData = data.map((point) => ({
    name: point.label,
    value: point.value,
    target: point.target,
  }));

  return (
    <div className='w-full' style={{ height }}>
      {title && <h3 className='mb-2 text-sm font-medium text-gray-700'>{title}</h3>}

      <ResponsiveContainer width='100%' height='100%'>
        <RechartsAreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
          {showGrid && <CartesianGrid strokeDasharray='3 3' />}

          <defs>
            <linearGradient id='colorValue' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor={areaGradientStart} stopOpacity={0.8} />
              <stop offset='95%' stopColor={areaGradientEnd} stopOpacity={0.2} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey='name'
            tick={{ fontSize: 12 }}
            height={50}
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
            angle={data.length > 7 ? -45 : 0}
            textAnchor={data.length > 7 ? 'end' : 'middle'}
          />

          <YAxis
            domain={[minValue, maxValue]}
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={{ stroke: '#E5E7EB' }}
            width={45}
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
            formatter={(value: any) => [`${value}%`, 'Progress']}
          />

          <Area
            type='monotone'
            dataKey='value'
            stroke={areaColor}
            fill='url(#colorValue)'
            strokeWidth={2}
            dot={showPoints ? { fill: 'white', stroke: areaColor, strokeWidth: 2, r: 4 } : false}
            activeDot={{ r: 6 }}
            isAnimationActive={true}
            animationDuration={800}
          />

          {showTarget && (
            <ReferenceLine
              y={100}
              stroke={targetColor}
              strokeDasharray='3 3'
              label={{
                value: 'Target',
                position: 'insideTopRight',
                style: { fontSize: 12, fill: targetColor },
              }}
            />
          )}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
