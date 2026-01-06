
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { MergedData } from '../types';

interface ChartProps {
  data: MergedData[];
  areaManagerNames?: Record<string, string>;
}

const AreaManagerCompletionChart: React.FC<ChartProps> = ({ data, areaManagerNames = {} }) => {
  const amData = data.reduce((acc, record) => {
    const am = record.AM || 'Unknown';
    if (!acc[am]) {
      acc[am] = { total: 0, completed: 0 };
    }
    acc[am].total++;
    if (record.course_completion_status === 'Completed') {
      acc[am].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  const chartData = Object.keys(amData).map(amId => ({
    name: areaManagerNames[amId] || amId,
    amId: amId,
    'Completion Rate': (amData[amId].completed / amData[amId].total) * 100,
    total: amData[amId].total,
    completed: amData[amId].completed
  })).sort((a, b) => b['Completion Rate'] - a['Completion Rate']); // Sort from high to low

  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="p-2 bg-brand-primary/10 rounded-lg mr-3">
          <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Area Manager Performance</h3>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >

          <XAxis type="number" stroke="#64748b" domain={[0, 100]} unit="%" fontSize={12} fontWeight={500} />
          <YAxis type="category" dataKey="name" stroke="#64748b" width={80} tick={{ fontSize: 12, fontWeight: 500 }} />
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [`${value.toFixed(1)}% (${props.payload.completed}/${props.payload.total})`, 'Completion Rate']}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              backdropFilter: 'blur(10px)',
              borderColor: '#e2e8f0',
              borderRadius: '12px',
              color: '#1e293b'
            }}
            cursor={{fill: 'rgba(20, 184, 166, 0.1)'}}
          />
          <Bar dataKey="Completion Rate" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => {
              const rate = entry['Completion Rate'];
              let fillColor = '#ef4444'; // Red for low (default)
              if (rate >= 80) fillColor = '#10b981'; // Green for high
              else if (rate >= 60) fillColor = '#f59e0b'; // Amber for medium
              return <Cell key={`cell-${index}`} fill={fillColor} />;
            })}
            <LabelList dataKey="Completion Rate" position="right" formatter={(value: number) => `${value.toFixed(1)}%`} fontSize={12} fontWeight={600} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AreaManagerCompletionChart;
