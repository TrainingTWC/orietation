import React, { useState } from 'react';
import type { EmployeeTrainingRecord, MergedData } from '../types';
import Dashboard from './Dashboard';
import EmployeeDashboard from './EmployeeDashboard';

interface TabbedDashboardProps {
  data: (EmployeeTrainingRecord | MergedData)[];
  fileName: string;
  isMerged: boolean;
  trainerNames?: Record<string, string>;
  areaManagerNames?: Record<string, string>;
  lastModified?: Date | null;
}

type TabType = 'overview' | 'employee';

const TabbedDashboard: React.FC<TabbedDashboardProps> = ({ data, fileName, isMerged, trainerNames = {}, areaManagerNames = {}, lastModified = null }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    {
      id: 'overview' as TabType,
      name: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'Analytics & Charts'
    },
    {
      id: 'employee' as TabType,
      name: 'Emp. Dashboard',
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Employee Details'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 lg:py-8">
        {/* Mobile-Optimized Tab Navigation */}
        <div className="mb-3 sm:mb-6 lg:mb-8">
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm sm:inline-flex sm:gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm touch-manipulation
                  ${activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 active:scale-95'
                  }
                `}
              >
                <span className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                  {tab.icon}
                </span>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-semibold leading-tight truncate">{tab.name}</span>
                  <span className={`text-xs leading-tight hidden sm:block ${
                    activeTab === tab.id ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {tab.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'overview' && (
            <div className="animate-in fade-in duration-400">
              <Dashboard data={data} fileName={fileName} isMerged={isMerged} trainerNames={trainerNames} areaManagerNames={areaManagerNames} lastModified={lastModified} />
            </div>
          )}
          
          {activeTab === 'employee' && (
            <div className="animate-in fade-in duration-400">
              <EmployeeDashboard data={data} fileName={fileName} isMerged={isMerged} trainerNames={trainerNames} lastModified={lastModified} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabbedDashboard;