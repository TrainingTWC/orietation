
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
      <div className="flex flex-col items-center">
        <div className="mb-4 p-3 bg-gradient-to-br from-brand-primary/10 to-teal-500/10 rounded-xl group-hover:from-brand-primary/20 group-hover:to-teal-500/20 transition-all duration-300">
          <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">{title}</p>
        <p className="text-4xl xl:text-5xl font-bold bg-gradient-to-r from-brand-primary to-teal-500 bg-clip-text text-transparent">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
