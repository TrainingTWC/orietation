
import React from 'react';
import type { EmployeeTrainingRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartProps {
  data: EmployeeTrainingRecord[];
}

const DepartmentCompletionChart: React.FC<ChartProps> = ({ data }) => {
  const departmentData = data.reduce((acc, record) => {
    const dept = record.department || 'N/A';
    if (!acc[dept]) {
      acc[dept] = { total: 0, completed: 0 };
    }
    acc[dept].total++;
    if (record.course_completion_status === 'Completed') {
      acc[dept].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  const chartData = Object.keys(departmentData).map(dept => ({
    name: dept,
    'Completion Rate': (departmentData[dept].completed / departmentData[dept].total) * 100,
    total: departmentData[dept].total,
    completed: departmentData[dept].completed
  })).sort((a, b) => b['Completion Rate'] - a['Completion Rate']); // Sort from high to low

  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="p-2 bg-brand-primary/10 rounded-lg mr-3">
          <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Department Performance</h3>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          <XAxis 
            dataKey="name" 
            stroke="#64748b" 
            fontSize={12}
            fontWeight={500}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis 
            unit="%" 
            stroke="#64748b" 
            domain={[0, 100]} 
            fontSize={12}
            fontWeight={500}
          />
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [
              `${Math.round(value)}% (${props.payload.completed}/${props.payload.total})`,
              'Completion Rate'
            ]}
            labelFormatter={(label) => `Department: ${label}`}
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
            fill="url(#departmentGradient)"
          />
          <defs>
            <linearGradient id="departmentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DepartmentCompletionChart;
