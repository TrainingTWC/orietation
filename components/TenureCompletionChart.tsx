import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import type { EmployeeTrainingRecord, MergedData } from '../types';

interface ChartProps {
  data: (EmployeeTrainingRecord | MergedData)[];
}

const TenureCompletionChart: React.FC<ChartProps> = ({ data }) => {
  // Tenure calculation function
  const calculateTenure = (dateOfJoining: string): string => {
    const joinDate = new Date(dateOfJoining);
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 4) return '1-4 days';
    if (daysDiff <= 15) return '5-15 days';
    if (daysDiff <= 30) return '16-30 days';
    return 'over a month';
  };

  const tenureData = data.reduce((acc, record) => {
    const tenure = calculateTenure(record.date_of_joining);
    
    if (!acc[tenure]) {
      acc[tenure] = { total: 0, completed: 0 };
    }
    
    acc[tenure].total++;
    
    if (record.course_completion_status === 'Completed') {
      acc[tenure].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  const chartData = Object.keys(tenureData).map(tenure => ({
    name: tenure,
    'Completion Rate': tenureData[tenure].total > 0 ? (tenureData[tenure].completed / tenureData[tenure].total) * 100 : 0,
    'Total Enrollments': tenureData[tenure].total,
    'Completed': tenureData[tenure].completed,
  })).sort((a, b) => {
    const order = ['1-4 days', '5-15 days', '16-30 days', 'over a month'];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });

  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="p-2 bg-brand-primary/10 rounded-lg mr-3">
          <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Completion Rate by Tenure</h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <XAxis 
            dataKey="name" 
            stroke="#64748b" 
            fontSize={12}
            fontWeight={500}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            unit="%" 
            stroke="#64748b" 
            domain={[0, 100]} 
            fontSize={12}
            fontWeight={500}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            formatter={(value: number, name: string, props: any) => {
              if (name === 'Completion Rate') {
                  return [`${Math.round(value)}% (${props.payload.Completed}/${props.payload['Total Enrollments']})`, name];
                }
              return [value.toLocaleString(), name];
            }}
            labelFormatter={(label) => `Tenure: ${label}`}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              backdropFilter: 'blur(10px)',
              borderColor: '#e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              color: '#1e293b',
              border: '1px solid #e2e8f0'
            }}
            cursor={{ fill: 'rgba(20, 184, 166, 0.1)' }}
          />
          <Bar 
            dataKey="Completion Rate" 
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => {
              const rate = entry['Completion Rate'];
              let fillColor = '#ef4444'; // Red for low (default)
              if (rate >= 80) fillColor = '#10b981'; // Green for high
              else if (rate >= 60) fillColor = '#f59e0b'; // Amber for medium
              return <Cell key={`cell-${index}`} fill={fillColor} />;
            })}
            <LabelList dataKey="Completion Rate" position="top" formatter={(value: number) => `${Math.round(value)}%`} fontSize={12} fontWeight={600} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TenureCompletionChart;