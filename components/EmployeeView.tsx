import React, { useState, useMemo } from 'react';
import type { EmployeeTrainingRecord, MergedData } from '../types';

interface EmployeeViewProps {
  data: (EmployeeTrainingRecord | MergedData)[];
  employeeCode: string;
  isMerged: boolean;
}

const EmployeeView: React.FC<EmployeeViewProps> = ({ data, employeeCode, isMerged }) => {
  // Helper to normalize progress values that may already include a '%' or be strings
  const parsePercent = (v: any) => {
    if (v === null || v === undefined) return 0;
    const raw = typeof v === 'string' ? v.replace(/%/g, '') : String(v);
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : Math.round(n);
  };
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isStatModalOpen, setIsStatModalOpen] = useState<boolean>(false);
  const [selectedStatType, setSelectedStatType] = useState<'total' | 'completed' | 'inProgress' | 'hours' | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [courseFilter, setCourseFilter] = useState<'all' | 'completed' | 'inProgress'>('all');

  // Filter data for this specific employee
  const employeeData = useMemo(() => {
    return data.filter(record => record.employee_code.toLowerCase() === employeeCode.toLowerCase());
  }, [data, employeeCode]);

  // Get employee info
  const employeeInfo = employeeData[0];

  // Calculate stats
  const stats = useMemo(() => {
    const totalCourses = employeeData.length;
    const completedCourses = employeeData.filter(d => d.course_completion_status === 'Completed').length;
    const completionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;
    const totalHours = employeeData.reduce((sum, d) => {
      const hours = parseFloat(String(d.course_completion_hours || 0));
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0);
    
    return {
      totalCourses,
      completedCourses,
      inProgress: totalCourses - completedCourses,
      completionRate: isNaN(completionRate) ? 0 : Math.round(completionRate),
      totalHours: isNaN(totalHours) ? '0.0' : totalHours.toFixed(1)
    };
  }, [employeeData]);

  // Group courses by category
  const coursesByCategory = useMemo(() => {
    const grouped = new Map<string, typeof employeeData>();
    const filteredCourses = courseFilter === 'all' ? employeeData :
                           courseFilter === 'completed' ? employeeData.filter(c => c.course_completion_status === 'Completed') :
                           employeeData.filter(c => c.course_completion_status !== 'Completed');
    
    filteredCourses.forEach(course => {
      const category = course.course_category || 'Uncategorized';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(course);
    });
    return grouped;
  }, [employeeData, courseFilter]);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Handle stat card clicks
  const handleStatCardClick = (statType: 'total' | 'completed' | 'inProgress' | 'hours') => {
    setSelectedStatType(statType);
    setIsStatModalOpen(true);
  };

  const closeStatModal = () => {
    setIsStatModalOpen(false);
    setSelectedStatType(null);
  };

  if (employeeData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6 text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">Employee Not Found</h2>
            <p className="text-red-700 dark:text-red-300">No training data found for employee code: <strong>{employeeCode}</strong></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-200 p-2 sm:p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Employee Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {employeeInfo.employee_name}
              </h1>
              <div className="space-y-1 text-sm sm:text-base">
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Employee Code:</span> {employeeInfo.employee_code}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Email:</span> {employeeInfo.email}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Department:</span> {employeeInfo.department}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Designation:</span> {employeeInfo.designation}
                </p>
                {isMerged && (employeeInfo as MergedData).location && (
                  <>
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">Location:</span> {(employeeInfo as MergedData).location}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">Region:</span> {(employeeInfo as MergedData).Region}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="ml-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-brand-primary to-teal-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                {employeeInfo.employee_name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Clickable with Icons */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          {/* Total Courses Card */}
          <div 
            onClick={() => handleStatCardClick('total')}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg border border-blue-200/50 dark:border-blue-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group active:scale-95 touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-all duration-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Total Courses</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCourses}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">Tap for details</p>
            </div>
          </div>
          
          {/* Completed Card */}
          <div 
            onClick={() => handleStatCardClick('completed')}
            className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg border border-green-200/50 dark:border-green-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group active:scale-95 touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-all duration-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Completed</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{stats.completedCourses}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">Tap for details</p>
            </div>
          </div>
          
          {/* In Progress Card */}
          <div 
            onClick={() => handleStatCardClick('inProgress')}
            className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg border border-orange-200/50 dark:border-orange-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group active:scale-95 touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-all duration-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">In Progress</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.inProgress}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">Tap for details</p>
            </div>
          </div>
          
          {/* Completion Rate Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg border border-purple-200/50 dark:border-purple-800/50 relative overflow-hidden">
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="mb-2 p-2 bg-purple-500/10 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Completion Rate</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.completionRate}%</p>
            </div>
            {/* Background circle progress indicator */}
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-purple-300 dark:text-purple-700" />
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="8" 
                className="text-purple-600 dark:text-purple-400"
                strokeDasharray={`${2 * Math.PI * 40 * stats.completionRate / 100} ${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * 0.25}`}
                strokeLinecap="round"
              />
            </svg>
          </div>
          
          {/* Total Hours Card */}
          <div 
            onClick={() => handleStatCardClick('hours')}
            className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg border border-teal-200/50 dark:border-teal-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group active:scale-95 touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 p-2 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-all duration-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Total Hours</p>
              <p className="text-2xl sm:text-3xl font-bold text-teal-600 dark:text-teal-400">{stats.totalHours}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">Tap for details</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Overall Progress</h3>
            <span className="text-2xl font-bold text-brand-primary">{stats.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-brand-primary to-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        {/* Courses by Category - Enhanced with Filter and Expandable Sections */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-xl sm:text-2xl font-bold">My Courses</h2>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setCourseFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                  courseFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                All ({employeeData.length})
              </button>
              <button
                onClick={() => setCourseFilter('completed')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                  courseFilter === 'completed'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Completed ({stats.completedCourses})
              </button>
              <button
                onClick={() => setCourseFilter('inProgress')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                  courseFilter === 'inProgress'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                In Progress ({stats.inProgress})
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {Array.from(coursesByCategory.entries()).map(([category, courses]) => {
              const isExpanded = expandedCategories.has(category);
              const completedInCategory = courses.filter(c => c.course_completion_status === 'Completed').length;
              
              return (
                <div key={category} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  {/* Category Header - Clickable to Expand/Collapse */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700/50 dark:to-slate-700/30 px-4 py-3 flex items-center justify-between hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200 touch-manipulation active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <svg 
                        className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div className="text-left">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">{category}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {completedInCategory} of {courses.length} completed • {Math.round((completedInCategory / courses.length) * 100)}%
                        </p>
                      </div>
                    </div>
                    
                    {/* Mini Progress Ring - Enhanced */}
                    <div className="relative w-12 h-12">
                      {/* Glow effect */}
                      <div className={`absolute inset-0 rounded-full blur-md opacity-20 ${
                        completedInCategory === courses.length ? 'bg-green-400' : 'bg-blue-400'
                      }`}></div>
                      
                      <svg className="w-12 h-12 transform -rotate-90 relative z-10">
                        <circle 
                          cx="24" 
                          cy="24" 
                          r="20" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="4" 
                          className="text-slate-200 dark:text-slate-700/50"
                        />
                        <circle 
                          cx="24" 
                          cy="24" 
                          r="20" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="4" 
                          className={`transition-all duration-700 ${
                            completedInCategory === courses.length ? 'text-green-500' : 'text-blue-500'
                          }`}
                          strokeDasharray={`${2 * Math.PI * 20 * completedInCategory / courses.length} ${2 * Math.PI * 20}`}
                          strokeLinecap="round"
                          style={{
                            filter: `drop-shadow(0 0 3px ${
                              completedInCategory === courses.length ? 'rgba(34, 197, 94, 0.5)' : 'rgba(59, 130, 246, 0.5)'
                            })`
                          }}
                        />
                      </svg>
                      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold z-20 ${
                        completedInCategory === courses.length ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {courses.length}
                      </span>
                    </div>
                  </button>
                  
                  {/* Courses List - Animated Expand/Collapse */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      {courses.map((course, idx) => (
                        <div 
                          key={idx}
                          className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                          onClick={() => setSelectedCourse(selectedCourse === course.course_name ? null : course.course_name)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-100">{course.course_name}</h4>
                                {course.course_completion_status === 'Completed' ? (
                                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full font-medium flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Completed
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs rounded-full font-medium flex items-center gap-1">
                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    In Progress ({parsePercent(course.course_progress)}%)
                                  </span>
                                )}
                              </div>
                              
                              {/* Progress Bar for In Progress Courses */}
                              {course.course_completion_status !== 'Completed' && (
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                                      <span>Progress</span>
                                      <span className="font-medium">{parsePercent(course.course_progress)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${parsePercent(course.course_progress)}%` }}
                                      />
                                    </div>
                                  </div>
                              )}
                              
                              {/* Expanded Course Details */}
                              {selectedCourse === course.course_name && (
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2 text-sm animate-fadeIn">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                      </svg>
                                      <span className="text-slate-600 dark:text-slate-400">
                                        <span className="font-semibold">Type:</span> {course.course_type}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-slate-600 dark:text-slate-400">
                                        <span className="font-semibold">Hours:</span> {course.course_completion_hours}
                                      </span>
                                    </div>
                                  </div>
                                  {course.course_enrolment_date && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span className="text-slate-600 dark:text-slate-400">
                                        <span className="font-semibold">Enrolled:</span> {new Date(course.course_enrolment_date).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                  {course.course_completion_date && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-slate-600 dark:text-slate-400">
                                        <span className="font-semibold">Completed:</span> {new Date(course.course_completion_date).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                  {course.course_end_date && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-slate-600 dark:text-slate-400">
                                        <span className="font-semibold">End Date:</span> {new Date(course.course_end_date).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Status Icon - Enhanced */}
                            <div className="ml-4">
                              {course.course_completion_status === 'Completed' ? (
                                <div className="relative w-10 h-10">
                                  {/* Glow effect for completed */}
                                  <div className="absolute inset-0 rounded-full blur-md bg-green-400 opacity-30"></div>
                                  <div className="relative w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative w-10 h-10">
                                  {/* Glow effect for in progress */}
                                  <div className="absolute inset-0 rounded-full blur-md bg-orange-400 opacity-20"></div>
                                  
                                    <svg className="w-10 h-10 transform -rotate-90 relative z-10">
                                      <circle 
                                        cx="20" 
                                        cy="20" 
                                        r="16" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="3" 
                                        className="text-orange-200 dark:text-orange-900/30"
                                      />
                                      <circle 
                                        cx="20" 
                                        cy="20" 
                                        r="16" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="3" 
                                        className="text-orange-500 transition-all duration-700"
                                        strokeDasharray={`${2 * Math.PI * 16 * parsePercent(course.course_progress) / 100} ${2 * Math.PI * 16}`}
                                        strokeLinecap="round"
                                        style={{
                                          filter: 'drop-shadow(0 0 3px rgba(249, 115, 22, 0.5))'
                                        }}
                                      />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400 z-20">
                                      {parsePercent(course.course_progress)}%
                                    </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stat Card Detail Modal */}
        {isStatModalOpen && selectedStatType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedStatType === 'total' && 'All My Courses'}
                      {selectedStatType === 'completed' && 'Completed Courses'}
                      {selectedStatType === 'inProgress' && 'In Progress Courses'}
                      {selectedStatType === 'hours' && 'Learning Hours Breakdown'}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                      {selectedStatType === 'total' && `${stats.totalCourses} courses enrolled`}
                      {selectedStatType === 'completed' && `${stats.completedCourses} courses completed`}
                      {selectedStatType === 'inProgress' && `${stats.inProgress} courses in progress`}
                      {selectedStatType === 'hours' && `${stats.totalHours} total learning hours`}
                    </p>
                  </div>
                  <button
                    onClick={closeStatModal}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0 touch-manipulation"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className={`p-4 rounded-xl ${
                    selectedStatType === 'total' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20' :
                    selectedStatType === 'completed' ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' :
                    selectedStatType === 'inProgress' ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20' :
                    'bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20'
                  }`}>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {selectedStatType === 'total' && stats.totalCourses}
                      {selectedStatType === 'completed' && stats.completedCourses}
                      {selectedStatType === 'inProgress' && stats.inProgress}
                      {selectedStatType === 'hours' && stats.totalHours}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedStatType === 'hours' ? 'Total Hours' : 'Total Count'}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.completionRate}%</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Completion Rate</div>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 rounded-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {Array.from(coursesByCategory.keys()).length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Categories</div>
                  </div>
                </div>

                {/* Course List */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Course Details</h3>
                  {(selectedStatType === 'total' ? employeeData :
                    selectedStatType === 'completed' ? employeeData.filter(c => c.course_completion_status === 'Completed') :
                    selectedStatType === 'inProgress' ? employeeData.filter(c => c.course_completion_status !== 'Completed') :
                    employeeData
                  ).map((course, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{course.course_name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{course.course_category}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 ml-2 ${
                          course.course_completion_status === 'Completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                        }`}>
                          {course.course_completion_status === 'Completed' ? '✓ Completed' : `${parsePercent(course.course_progress)}% Progress`}
                        </span>
                      </div>
                      
                      {course.course_completion_status !== 'Completed' && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>Progress</span>
                            <span className="font-medium">{parsePercent(course.course_progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full"
                              style={{ width: `${course.course_progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Type:</span>
                          <div className="font-medium text-gray-900 dark:text-white">{course.course_type}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Hours:</span>
                          <div className="font-medium text-gray-900 dark:text-white">{course.course_completion_hours}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EmployeeView;
