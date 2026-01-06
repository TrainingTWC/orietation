import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import type { MergedData } from '../types';
import MultiSelectFilter from './MultiSelectFilter';

interface StoreWiseViewProps {
  data: MergedData[];
  trainerNames?: Record<string, string>;
}

const StoreWiseView: React.FC<StoreWiseViewProps> = ({ data, trainerNames = {} }) => {
  // Filter states
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseSearch, setCourseSearch] = useState<string>('');

  // Get unique courses for filtering
  const uniqueCourses = useMemo(() => {
    const courses = [...new Set(data.map(item => item.course_name || 'Unknown').filter(Boolean))].sort();
    return courses.filter(course => (course as string).toLowerCase().includes(courseSearch.toLowerCase()));
  }, [data, courseSearch]);

  // Filter data based on selected courses
  const filteredData = useMemo(() => {
    if (selectedCourses.length === 0) {
      return data;
    }
    return data.filter(record => selectedCourses.includes(record.course_name || 'Unknown'));
  }, [data, selectedCourses]);

  // Calculate store-wise completion data
  const storeData = useMemo(() => {
    const storeMap = filteredData.reduce((acc, record) => {
      const store = record.location || 'Unknown';
      if (!acc[store]) {
        acc[store] = { 
          total: 0, 
          completed: 0,
          storeName: store,
          trainer: record.Trainer || 'Unknown',
          areaManager: record.AM || 'Unknown'
        };
      }
      acc[store].total++;
      if (record.course_completion_status === 'Completed') {
        acc[store].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number; storeName: string; trainer: string; areaManager: string }>);

    return Object.values(storeMap)
      .map(store => ({
        name: store.storeName,
        'Completion Rate': store.total > 0 ? (store.completed / store.total) * 100 : 0,
        completed: store.completed,
        total: store.total,
        trainer: store.trainer,
        trainerName: trainerNames[store.trainer] || store.trainer,
        areaManager: store.areaManager
      }))
      .sort((a, b) => b['Completion Rate'] - a['Completion Rate']);
  }, [filteredData, trainerNames]);

  // Determine if we're on mobile based on window width
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024;

  // Calculate summary statistics
  const totalStores = storeData.length;
  const avgCompletionRate = storeData.length > 0
    ? storeData.reduce((sum, store) => sum + store['Completion Rate'], 0) / storeData.length
    : 0;
  const highPerformingStores = storeData.filter(store => store['Completion Rate'] >= 80).length;
  const lowPerformingStores = storeData.filter(store => store['Completion Rate'] < 60).length;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Course Filter Section */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            Filter by Course
          </h3>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {selectedCourses.length === 0 ? 'All Courses' : `${selectedCourses.length} Selected`}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Course Filter */}
          <MultiSelectFilter
            title="Course"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            options={uniqueCourses}
            selectedValues={selectedCourses}
            onSelectionChange={setSelectedCourses}
            searchValue={courseSearch}
            onSearchChange={setCourseSearch}
            placeholder="Search courses..."
            showCount={true}
            data={data}
            filterKey="course_name"
            isMerged={true}
          />

          {/* Clear Filter Button */}
          {selectedCourses.length > 0 && (
            <button
              onClick={() => {
                setSelectedCourses([]);
                setCourseSearch('');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Total Stores */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-lg border border-blue-200/50 dark:border-blue-800/50">
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 lg:mb-3 p-2 lg:p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg lg:rounded-xl">
              <svg className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">{totalStores}</p>
            <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Total Stores</p>
          </div>
        </div>

        {/* Average Completion */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-lg border border-purple-200/50 dark:border-purple-800/50">
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 lg:mb-3 p-2 lg:p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg lg:rounded-xl">
              <svg className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {Math.round(avgCompletionRate)}%
            </p>
            <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Completion</p>
          </div>
        </div>

        {/* High Performers */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-lg border border-green-200/50 dark:border-green-800/50">
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 lg:mb-3 p-2 lg:p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg lg:rounded-xl">
              <svg className="w-6 h-6 lg:w-8 lg:h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">{highPerformingStores}</p>
            <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">High (≥80%)</p>
          </div>
        </div>

        {/* Low Performers */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-lg border border-red-200/50 dark:border-red-800/50">
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 lg:mb-3 p-2 lg:p-3 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg lg:rounded-xl">
              <svg className="w-6 h-6 lg:w-8 lg:h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">{lowPerformingStores}</p>
            <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Low (&lt;60%)</p>
          </div>
        </div>
      </div>

      {/* Store Performance Chart */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center mb-3 sm:mb-4 lg:mb-6">
          <div className="p-1.5 sm:p-2 bg-indigo-600/10 rounded-lg mr-2 sm:mr-3">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-800 dark:text-slate-200">
              Store-wise Completion Analysis
            </h3>
            {selectedCourses.length > 0 && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Filtered by: {selectedCourses.length === 1 ? selectedCourses[0] : `${selectedCourses.length} courses`}
              </p>
            )}
          </div>
        </div>

        {storeData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-medium">No data available for selected courses</p>
            <p className="text-sm mt-2">Try selecting different courses or clearing the filter</p>
          </div>
        ) : (
          <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4" style={{ height: isMobile ? '400px' : '500px', overflowY: 'auto', overflowX: 'hidden' }}>
            <ResponsiveContainer width="100%" height={Math.max(isMobile ? 350 : 450, storeData.length * (isMobile ? 40 : 50))}>
              <BarChart
                data={storeData}
                layout="vertical"
                margin={isMobile ? { top: 5, right: 30, left: 5, bottom: 5 } : isTablet ? { top: 5, right: 45, left: 80, bottom: 5 } : { top: 5, right: 60, left: 120, bottom: 5 }}
              >
                <XAxis type="number" stroke="#64748b" domain={[0, 100]} unit="%" fontSize={isMobile ? 9 : 12} fontWeight={500} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#64748b" 
                  width={isMobile ? 90 : isTablet ? 110 : 150} 
                  tick={{ fontSize: isMobile ? 9 : 11, fontWeight: 500 }} 
                  interval={0} 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{data.name}</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            Completion: <span className="font-semibold">{Math.round(data['Completion Rate'])}%</span>
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            Completed: <span className="font-semibold">{data.completed}/{data.total}</span>
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            Trainer: <span className="font-semibold">{data.trainerName}</span>
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            Area Manager: <span className="font-semibold">{data.areaManager}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{fill: 'rgba(99, 102, 241, 0.1)'}}
                />
                <Bar dataKey="Completion Rate" radius={[0, 4, 4, 0]}>
                  {storeData.map((entry, index) => {
                    const rate = entry['Completion Rate'];
                    let fillColor = '#ef4444'; // Red for low
                    if (rate >= 80) fillColor = '#10b981'; // Green for high
                    else if (rate >= 60) fillColor = '#f59e0b'; // Amber for medium
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                  <LabelList 
                    dataKey="Completion Rate" 
                    position="right" 
                    formatter={(value: number) => `${Math.round(value)}%`} 
                    fontSize={isMobile ? 9 : 11} 
                    fontWeight={600}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Store Table */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-4">
          Detailed Store Performance
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">Store</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">Trainer</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">Area Manager</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">Courses</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">Completed</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {storeData.map((store, index) => (
                <tr 
                  key={index}
                  className={`border-b border-gray-100 dark:border-gray-700 transition-colors duration-200 ${index % 2 === 0 ? 'bg-gray-50/50 dark:bg-slate-700/30' : ''}`}
                >
                  <td className="py-3 px-2">
                    <div className="font-medium text-gray-900 dark:text-white">{store.name}</div>
                  </td>
                  <td className="py-3 px-2 text-gray-900 dark:text-white">{store.trainerName}</td>
                  <td className="py-3 px-2 text-gray-900 dark:text-white">{store.areaManager}</td>
                  <td className="py-3 px-2 text-center text-gray-900 dark:text-white">{store.total}</td>
                  <td className="py-3 px-2 text-center text-gray-900 dark:text-white">{store.completed}</td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                      store['Completion Rate'] >= 80 ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20' :
                      store['Completion Rate'] >= 60 ? 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20' :
                      'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
                    }`}>
                      {Math.round(store['Completion Rate'])}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {storeData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No stores found matching the current filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreWiseView;
