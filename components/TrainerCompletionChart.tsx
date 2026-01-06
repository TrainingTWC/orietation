
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { MergedData } from '../types';

interface ChartProps {
  data: MergedData[];
  trainerNames?: Record<string, string>;
}

const TrainerCompletionChart: React.FC<ChartProps> = ({ data, trainerNames = {} }) => {
  const trainerData = data.reduce((acc, record) => {
    const trainer = record.Trainer || 'Unknown';
    if (!acc[trainer]) {
      acc[trainer] = { total: 0, completed: 0 };
    }
    acc[trainer].total++;
    if (record.course_completion_status === 'Completed') {
      acc[trainer].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  const chartData = Object.keys(trainerData).map(trainerId => ({
    name: trainerNames[trainerId] || trainerId,
    trainerId: trainerId,
    'Completion Rate': (trainerData[trainerId].completed / trainerData[trainerId].total) * 100,
    total: trainerData[trainerId].total,
    completed: trainerData[trainerId].completed
  })).sort((a, b) => b['Completion Rate'] - a['Completion Rate']); // Sort from high to low

  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="p-2 bg-brand-primary/10 rounded-lg mr-3">
          <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Trainer Effectiveness</h3>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >

          <XAxis type="number" stroke="#64748b" domain={[0, 100]} unit="%" fontSize={12} fontWeight={500} />
          <YAxis type="category" dataKey="name" stroke="#64748b" width={80} fontSize={12} fontWeight={500} />
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [`${Math.round(value)}% (${props.payload.completed}/${props.payload.total})`, 'Completion Rate']}
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
            <LabelList dataKey="Completion Rate" position="right" formatter={(value: number) => `${Math.round(value)}%`} fontSize={12} fontWeight={600} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrainerCompletionChart;
