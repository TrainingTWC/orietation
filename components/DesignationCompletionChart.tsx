import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { EmployeeTrainingRecord, MergedData } from '../types';

interface DesignationCompletionChartProps {
  data: (EmployeeTrainingRecord | MergedData)[];
  className?: string;
}

const DesignationCompletionChart: React.FC<DesignationCompletionChartProps> = ({ data, className = '' }) => {
  const chartData = useMemo(() => {
    const designationStats: Record<string, { total: number; completed: number }> = {};

    data.forEach(item => {
      const designation = item.designation || '';
      
      // Skip empty designations
      if (!designation || designation.trim() === '' || designation.toLowerCase() === 'unknown') {
        return;
      }
      
      if (!designationStats[designation]) {
        designationStats[designation] = { total: 0, completed: 0 };
      }
      
      designationStats[designation].total++;
      if (item.course_completion_status === 'Completed') {
        designationStats[designation].completed++;
      }
    });

    return Object.entries(designationStats)
      .map(([designation, stats]) => ({
        designation,
        completed: stats.completed,
        total: stats.total,
        percentage: ((stats.completed / stats.total) * 100),
        completionRate: `${stats.completed}/${stats.total}`,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [data]);

  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 60) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
          <p className="text-slate-600 dark:text-slate-300">
            <span className="font-medium">Completed:</span> {data.completed} ({Math.round(data.percentage)}%)
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            <span className="font-medium">Total:</span> {data.total}
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            <span className="font-medium">Rate:</span> {data.completionRate}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 ${className}`}>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Completion by Designation</h3>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 ${className}`}>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        Completion by Designation
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="designation"
              tick={{ fontSize: 12 }}
              className="fill-slate-600 dark:fill-slate-300"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              className="fill-slate-600 dark:fill-slate-300"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="percentage" 
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="text-sm text-slate-600 dark:text-slate-300">80%+ Complete</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-amber-500 rounded mr-2"></div>
          <span className="text-sm text-slate-600 dark:text-slate-300">60-79% Complete</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span className="text-sm text-slate-600 dark:text-slate-300">Below 60%</span>
        </div>
      </div>
    </div>
  );
};

export default DesignationCompletionChart;