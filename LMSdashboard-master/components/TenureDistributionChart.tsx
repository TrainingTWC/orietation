import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import type { EmployeeTrainingRecord, MergedData } from '../types';

interface ChartProps {
  data: (EmployeeTrainingRecord | MergedData)[];
}

const TenureDistributionChart: React.FC<ChartProps> = ({ data }) => {
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
    const uniqueKey = `${record.employee_code}_${tenure}`;
    
    if (!acc[tenure]) {
      acc[tenure] = { total: 0, completed: 0, employees: new Set() };
    }
    
    // Only count unique employees per tenure
    acc[tenure].employees.add(record.employee_code);
    acc[tenure].total++;
    
    if (record.course_completion_status === 'Completed') {
      acc[tenure].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number; employees: Set<string> }>);

  const chartData = Object.keys(tenureData).map(tenure => {
    const uniqueEmployees = tenureData[tenure].employees.size;
    let color = '#10b981'; // Green for high (default)
    if (uniqueEmployees <= 50) color = '#ef4444'; // Red for low
    else if (uniqueEmployees <= 200) color = '#f59e0b'; // Amber for medium
    
    return {
      name: tenure,
      'Total Enrollments': tenureData[tenure].total,
      'Unique Employees': uniqueEmployees,
      'Completion Rate': tenureData[tenure].total > 0 ? (tenureData[tenure].completed / tenureData[tenure].total) * 100 : 0,
      fill: color
    };
  }).sort((a, b) => {
    const order = ['1-4 days', '5-15 days', '16-30 days', 'over a month'];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });

  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="p-2 bg-brand-primary/10 rounded-lg mr-3">
          <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Employee Distribution by Tenure</h3>
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
            stroke="#64748b" 
            fontSize={12}
            fontWeight={500}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              name === 'Completion Rate' ? `${Math.round(value)}%` : value.toLocaleString(),
              name
            ]}
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
            dataKey="Unique Employees" 
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => {
              const count = entry['Unique Employees'];
              let fillColor = '#10b981'; // Green for high (default)
              if (count <= 50) fillColor = '#ef4444'; // Red for low
              else if (count <= 200) fillColor = '#f59e0b'; // Amber for medium
              return <Cell key={`cell-${index}`} fill={fillColor} />;
            })}
            <LabelList dataKey="Unique Employees" position="top" fontSize={12} fontWeight={600} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TenureDistributionChart;