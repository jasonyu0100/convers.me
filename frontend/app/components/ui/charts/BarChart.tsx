'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataPoint[];
  height?: string;
  width?: string;
  barColor?: string;
  showValues?: boolean;
  showLabels?: boolean;
  showGrid?: boolean;
  title?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  minValue?: number;
  maxValue?: number;
  horizontal?: boolean;
}

/**
 * Reusable bar chart component using Recharts
 */
export function BarChart({
  data,
  height = '200px',
  width = '100%',
  barColor = '#3b82f6', // blue-500
  showValues = true,
  showLabels = true,
  showGrid = true,
  title,
  yAxisLabel,
  xAxisLabel,
  minValue,
  maxValue,
  horizontal = false,
}: BarChartProps) {
  // Transform data for Recharts
  const chartData = data.map((point) => ({
    name: point.label,
    value: point.value,
    color: point.color || barColor,
  }));

  return (
    <div className='w-full' style={{ height }}>
      {title && <h3 className='mb-2 text-sm font-medium text-gray-700'>{title}</h3>}

      <ResponsiveContainer width='100%' height='100%'>
        <RechartsBarChart
          data={chartData}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 30, left: 20, bottom: horizontal ? 5 : 30 }}
        >
          {showGrid && <CartesianGrid strokeDasharray='3 3' />}

          {horizontal ? (
            <>
              <XAxis
                type='number'
                domain={[minValue || 0, maxValue || 'auto']}
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
                label={{
                  value: xAxisLabel || 'Value',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fontSize: 12, fill: '#6B7280' },
                }}
              />
              <YAxis
                dataKey='name'
                type='category'
                tick={{ fontSize: 12 }}
                width={120}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(value) => (value.length > 15 ? `${value.substring(0, 15)}...` : value)}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey='name'
                tick={{ fontSize: 12 }}
                height={60}
                tickMargin={10}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
                angle={data.length > 5 ? -45 : 0}
                textAnchor={data.length > 5 ? 'end' : 'middle'}
                label={{
                  value: xAxisLabel || 'Time Period',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fontSize: 12, fill: '#6B7280' },
                }}
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
            </>
          )}

          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
          />

          <Bar dataKey='value' radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={500}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}

            {showValues && (
              <LabelList dataKey='value' position={horizontal ? 'right' : 'top'} style={{ fontSize: 12, fill: '#4B5563', fontWeight: 500 }} offset={5} />
            )}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
