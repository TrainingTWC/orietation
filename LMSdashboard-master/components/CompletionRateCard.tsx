import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { EmployeeTrainingRecord } from '../types';

interface CompletionRateCardProps {
  data: EmployeeTrainingRecord[];
  activeFiltersText: string;
}

const CompletionRateCard: React.FC<CompletionRateCardProps> = ({ data, activeFiltersText }) => {
  const completedCount = data.filter(item => item.course_completion_status === 'Completed').length;
  const notCompletedCount = data.length - completedCount;
  
  // More robust percentage calculation
  let completionRate = 0;
  if (data.length > 0) {
    completionRate = (completedCount / data.length) * 100;
  }
  
  // Ensure we have a clean number
  const safeCompletionRate = isNaN(completionRate) || !isFinite(completionRate) ? 0 : completionRate;
  const displayRate = Math.round(safeCompletionRate * 10) / 10; // Round to 1 decimal place

  const chartData = [
    { name: 'Completed', value: completedCount },
    { name: 'Not Completed', value: notCompletedCount },
  ];

  const COLORS = ['#14b8a6', '#ef4444']; // Teal for completed, Red for not completed

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl hover:scale-105 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-brand-primary/10 rounded-lg mr-3">
            <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Completion Rate ({activeFiltersText})
            </h3>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            {displayRate}%
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 rounded-full bg-brand-primary mr-2"></div>
              <span className="text-slate-600 dark:text-slate-400">
                Completed: {completedCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-slate-600 dark:text-slate-400">
                Not Completed: {notCompletedCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 ml-4">
          <div className="w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={35}
                  innerRadius={15}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionRateCard;