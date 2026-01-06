
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { MergedData } from '../types';

interface ChartProps {
  data: MergedData[];
}

const RegionCompletionChart: React.FC<ChartProps> = ({ data }) => {
  const regionData = data.reduce((acc, record) => {
    const region = record.Region || '';
    
    // Skip empty regions
    if (!region || region.trim() === '' || region.toLowerCase() === 'unknown') {
      return acc;
    }
    
    if (!acc[region]) {
      acc[region] = { total: 0, completed: 0 };
    }
    acc[region].total++;
    if (record.course_completion_status === 'Completed') {
      acc[region].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  const chartData = Object.keys(regionData).map(region => ({
    name: region,
    'Completion Rate': (regionData[region].completed / regionData[region].total) * 100,
  })).sort((a, b) => b['Completion Rate'] - a['Completion Rate']); // Sort from high to low

  return (
    <div>
      <div className="flex items-center mb-3 sm:mb-4 lg:mb-6">
        <div className="p-1.5 sm:p-2 bg-brand-primary/10 rounded-md sm:rounded-lg mr-2 sm:mr-3">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-sm sm:text-base lg:text-xl font-bold text-slate-800 dark:text-slate-200">
          Regional Performance
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
        >
          <XAxis 
            type="number" 
            stroke="#64748b" 
            domain={[0, 100]} 
            unit="%" 
            fontSize={10}
            fontWeight={500} 
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="#64748b" 
            width={60}
            fontSize={10}
            fontWeight={500} 
          />
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [`${Math.round(value)}% (${props.payload.completed}/${props.payload.total})`, 'Completion Rate']}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              backdropFilter: 'blur(10px)',
              borderColor: '#e2e8f0',
              borderRadius: '8px',
              color: '#1e293b',
              fontSize: '12px'
            }}
            cursor={{fill: 'rgba(20, 184, 166, 0.1)'}}
          />
          <Bar 
            dataKey="Completion Rate" 
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => {
              const rate = entry['Completion Rate'];
              let fillColor = '#ef4444'; // Red for low (default)
              if (rate >= 80) fillColor = '#10b981'; // Green for high
              else if (rate >= 60) fillColor = '#f59e0b'; // Amber for medium
              return <Cell key={`cell-${index}`} fill={fillColor} />;
            })}
            <LabelList 
              dataKey="Completion Rate" 
              position="right" 
              formatter={(value: number) => `${Math.round(value)}%`} 
              fontSize={10}
              fontWeight={600} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RegionCompletionChart;
