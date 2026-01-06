import React, { useState, useMemo } from 'react';
import type { EmployeeTrainingRecord, MergedData } from '../types';
import StoreWiseView from './StoreWiseView';

interface ManagerViewProps {
  data: (EmployeeTrainingRecord | MergedData)[];
  managerCode: string;
  isMerged: boolean;
}

const ITEMS_PER_PAGE = 20; // Show 20 employees at a time

const ManagerView: React.FC<ManagerViewProps> = ({ data, managerCode, isMerged }) => {
  // Helper to normalize progress values coming from CSV/JSON which may be strings like '59.09%' or numbers
  const parsePercent = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'number') return Math.round(val);
    try {
      const s = String(val).trim();
      // remove extra % characters and whitespace
      const cleaned = s.replace(/%/g, '').trim();
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : Math.round(n);
    } catch (e) {
      return 0;
    }
  };
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isStatModalOpen, setIsStatModalOpen] = useState<boolean>(false);
  const [selectedStatType, setSelectedStatType] = useState<'members' | 'highPerformers' | 'needsAttention' | 'direct' | 'indirect' | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'direct' | 'indirect'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'team' | 'storewise'>('team');

  // Build reporting hierarchy - find all employees reporting to this manager (direct and indirect)
  const teamData = useMemo(() => {
    const allReports = new Set<string>();
    const employeeMap = new Map<string, EmployeeTrainingRecord | MergedData>();
    
    // Normalize manager code for case-insensitive comparison
    const normalizedManagerCode = managerCode.toLowerCase();
    
    // Create a map of all employees
    data.forEach(record => {
      employeeMap.set(record.employee_code.toLowerCase(), record);
    });

    // Recursive function to find all subordinates
    const findAllSubordinates = (managerId: string) => {
      const normalizedManagerId = managerId.toLowerCase();
      data.forEach(record => {
        if (record.reporting_manager_code.toLowerCase() === normalizedManagerId && !allReports.has(record.employee_code.toLowerCase())) {
          allReports.add(record.employee_code.toLowerCase());
          // Recursively find this employee's subordinates
          findAllSubordinates(record.employee_code);
        }
      });
    };

    // Start with direct reports
    findAllSubordinates(normalizedManagerCode);

    // Also add the manager themselves if their data exists
    allReports.add(normalizedManagerCode);

    // Filter data for all team members including manager
    return data.filter(record => allReports.has(record.employee_code.toLowerCase()));
  }, [data, managerCode]);

  // Get manager info
  const managerInfo = useMemo(() => {
    return data.find(record => record.employee_code.toLowerCase() === managerCode.toLowerCase());
  }, [data, managerCode]);

  // Group by employee and calculate stats
  const teamMembers = useMemo(() => {
    const employeeMap = new Map();
    
    teamData.forEach(record => {
      const empCode = record.employee_code;
      if (!employeeMap.has(empCode)) {
        employeeMap.set(empCode, {
          employee_code: empCode,
          employee_name: record.employee_name,
          email: record.email,
          designation: record.designation,
          department: record.department,
          reporting_manager_code: record.reporting_manager_code,
          reporting_manager_name: record.reporting_manager_name,
          location: isMerged ? (record as MergedData).location : undefined,
          total_courses: 0,
          completed_courses: 0,
          in_progress: 0,
          completion_rate: 0,
          total_hours: 0,
          courses: []
        });
      }
      
      const emp = employeeMap.get(empCode);
      emp.total_courses++;
      const hours = parseFloat(String(record.course_completion_hours || 0));
      emp.total_hours += isNaN(hours) ? 0 : hours;
      emp.courses.push({
        course_name: record.course_name,
        course_category: record.course_category,
        course_type: record.course_type,
        completion_status: record.course_completion_status,
        // Normalize progress to integer percent to avoid double-percent or decimal formatting issues
        progress: parsePercent(record.course_progress),
        hours: record.course_completion_hours,
        enrollment_date: record.course_enrolment_date,
        completion_date: record.course_completion_date,
        end_date: record.course_end_date
      });
      
      if (record.course_completion_status === 'Completed') {
        emp.completed_courses++;
      } else {
        emp.in_progress++;
      }
      
      emp.completion_rate = emp.total_courses > 0 
        ? Math.round((emp.completed_courses / emp.total_courses) * 100) 
        : 0;
    });
    
    return Array.from(employeeMap.values()).sort((a, b) => 
      b.completion_rate - a.completion_rate
    );
  }, [teamData, isMerged]);

  // Calculate team stats (excluding the manager themselves)
  const teamStats = useMemo(() => {
    // Filter out the manager from team members for stats
    const subordinates = teamMembers.filter(emp => emp.employee_code.toLowerCase() !== managerCode.toLowerCase());
    
    const totalMembers = subordinates.length;
    const totalCourses = subordinates.reduce((sum, emp) => sum + emp.total_courses, 0);
    const completedCourses = subordinates.reduce((sum, emp) => sum + emp.completed_courses, 0);
    const totalHours = subordinates.reduce((sum, emp) => sum + (emp.total_hours || 0), 0);
    const avgCompletionRate = totalMembers > 0
      ? Math.round(subordinates.reduce((sum, emp) => sum + emp.completion_rate, 0) / totalMembers)
      : 0;
    
    const highPerformers = subordinates.filter(emp => emp.completion_rate >= 80).length;
    const needsAttention = subordinates.filter(emp => emp.completion_rate < 60).length;

    return {
      totalMembers,
      totalCourses,
      completedCourses,
      totalHours: isNaN(totalHours) ? '0.0' : totalHours.toFixed(1),
      avgCompletionRate,
      highPerformers,
      needsAttention
    };
  }, [teamMembers, managerCode]);

  // Determine color variant for average completion rate
  const getRateVariant = (rate: number) => {
    if (rate >= 80) {
      return {
        textClass: 'text-green-600 dark:text-green-400',
        bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
        svgBg: '#86efac',
        svgStroke: '#059669',
        glow: 'bg-green-400'
      };
    }
    if (rate >= 60) {
      return {
        textClass: 'text-yellow-600 dark:text-yellow-400',
        bgGradient: 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
        svgBg: '#fde68a',
        svgStroke: '#d97706',
        glow: 'bg-amber-400'
      };
    }
    return {
      textClass: 'text-red-600 dark:text-red-400',
      bgGradient: 'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
      svgBg: '#feb2b2',
      svgStroke: '#dc2626',
      glow: 'bg-red-400'
    };
  };

  // Group team members by reporting level with filtering
  const teamLevels = useMemo(() => {
    let filteredMembers = teamMembers;
    
    // Apply search filter
    if (searchTerm) {
      filteredMembers = filteredMembers.filter(emp => 
        emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Separate manager's own record from team members
    const managerRecord = filteredMembers.find(emp => emp.employee_code.toLowerCase() === managerCode.toLowerCase());
    const otherMembers = filteredMembers.filter(emp => emp.employee_code.toLowerCase() !== managerCode.toLowerCase());
    
    const directReports = otherMembers.filter(emp => emp.reporting_manager_code.toLowerCase() === managerCode.toLowerCase());
    const indirectReports = otherMembers.filter(emp => emp.reporting_manager_code.toLowerCase() !== managerCode.toLowerCase());
    
    // Apply level filter
    if (filterLevel === 'direct') {
      return { managerRecord, directReports, indirectReports: [] };
    } else if (filterLevel === 'indirect') {
      return { managerRecord, directReports: [], indirectReports };
    }
    
    return { managerRecord, directReports, indirectReports };
  }, [teamMembers, managerCode, searchTerm, filterLevel]);

  // Pagination for direct and indirect reports
  const totalDirectPages = Math.ceil(teamLevels.directReports.length / ITEMS_PER_PAGE);
  const totalIndirectPages = Math.ceil(teamLevels.indirectReports.length / ITEMS_PER_PAGE);
  
  const paginatedDirect = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return teamLevels.directReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [teamLevels.directReports, currentPage]);
  
  const paginatedIndirect = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return teamLevels.indirectReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [teamLevels.indirectReports, currentPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterLevel]);

  // Handle stat card clicks
  const handleStatCardClick = (statType: 'members' | 'highPerformers' | 'needsAttention' | 'direct' | 'indirect') => {
    setSelectedStatType(statType);
    setIsStatModalOpen(true);
  };

  const closeStatModal = () => {
    setIsStatModalOpen(false);
    setSelectedStatType(null);
  };

  if (teamData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6 text-center">
            <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">No Team Members Found</h2>
            <p className="text-yellow-700 dark:text-yellow-300">
              No employees reporting to manager code: <strong>{managerCode}</strong>
            </p>
            {managerInfo && (
              <p className="text-yellow-600 dark:text-yellow-400 mt-2">
                Manager: {managerInfo.employee_name}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-200 p-2 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Manager Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                Team Dashboard
              </h1>
              {managerInfo && (
                <div className="space-y-1 text-sm sm:text-base">
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">Manager:</span> {managerInfo.employee_name}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">Manager Code:</span> {managerInfo.employee_code}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">Department:</span> {managerInfo.department}
                  </p>
                </div>
              )}
            </div>
            <div className="ml-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                {managerInfo ? managerInfo.employee_name.charAt(0).toUpperCase() : 'M'}
              </div>
            </div>
          </div>
        </div>

        {/* Team Stats Cards - Enhanced with Clickable Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
          {/* Team Members Card */}
          <div 
            onClick={() => handleStatCardClick('members')}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg border border-blue-200/50 dark:border-blue-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group active:scale-95 touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-all duration-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Team Members</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{teamStats.totalMembers}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">View all</p>
            </div>
          </div>
          
          {/* Total Courses Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg border border-purple-200/50 dark:border-purple-800/50 relative overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 p-2 bg-purple-500/10 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Total Courses</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{teamStats.totalCourses}</p>
            </div>
          </div>
          
          {/* Completed Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg border border-green-200/50 dark:border-green-800/50">
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 p-2 bg-green-500/10 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Completed</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{teamStats.completedCourses}</p>
            </div>
          </div>
          
          {/* Average Rate Card */}
          <div className={`bg-gradient-to-br p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg border relative overflow-hidden ${getRateVariant(Math.round(teamStats.avgCompletionRate)).bgGradient} border-teal-200/50 dark:border-teal-800/50`}>
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="mb-2 p-2 bg-teal-500/10 rounded-lg">
                {(() => {
                  const r = Math.round(teamStats.avgCompletionRate);
                  // Happy (>=80), Neutral (60-79), Sad (<60)
                  if (r >= 80) {
                    return (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="9" cy="10" r="1" fill="currentColor" />
                        <circle cx="15" cy="10" r="1" fill="currentColor" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15c1.333 1 2.667 1 4 0" />
                      </svg>
                    );
                  }
                  if (r >= 60) {
                    return (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="9" cy="10" r="1" fill="currentColor" />
                        <circle cx="15" cy="10" r="1" fill="currentColor" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15h8" />
                      </svg>
                    );
                  }
                  return (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="9" cy="10" r="1" fill="currentColor" />
                      <circle cx="15" cy="10" r="1" fill="currentColor" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15c-1.333-1-2.667-1-4 0" />
                    </svg>
                  );
                })()}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Avg. Rate</p>
              <p className={`text-2xl sm:text-3xl font-bold ${getRateVariant(Math.round(teamStats.avgCompletionRate)).textClass}`}>{Math.round(teamStats.avgCompletionRate)}%</p>
            </div>
            {/* Background progress indicator */}
            {(() => {
              const variant = getRateVariant(Math.round(teamStats.avgCompletionRate));
              return (
                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke={variant.svgBg} strokeWidth="8" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="none" 
                    stroke={variant.svgStroke} 
                    strokeWidth="8" 
                    strokeDasharray={`${2 * Math.PI * 40 * teamStats.avgCompletionRate / 100} ${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * 0.25}`}
                    strokeLinecap="round"
                  />
                </svg>
              );
            })()}
          </div>
          
          {/* Total Hours Card */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg border border-orange-200/50 dark:border-orange-800/50">
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 p-2 bg-orange-500/10 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Total Hours</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">{teamStats.totalHours}</p>
            </div>
          </div>
          
          {/* High Performers Card */}
          <div 
            onClick={() => handleStatCardClick('highPerformers')}
            className="bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-900/20 dark:to-lime-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg border border-green-200/50 dark:border-green-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group active:scale-95 touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-all duration-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1 text-center">High<br className="sm:hidden" /><span className="hidden sm:inline"> </span>Performers</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{teamStats.highPerformers}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">≥80%</p>
            </div>
          </div>
          
          {/* Needs Attention Card */}
          <div 
            onClick={() => handleStatCardClick('needsAttention')}
            className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg border border-red-200/50 dark:border-red-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group active:scale-95 touch-manipulation"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-all duration-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1 text-center">Needs<br className="sm:hidden" /><span className="hidden sm:inline"> </span>Attention</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">{teamStats.needsAttention}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">&lt;60%</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('team')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'team'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              Team Dashboard
            </button>
            <button
              onClick={() => setActiveTab('storewise')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'storewise'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              Store-wise View
            </button>
          </div>
        </div>

        {activeTab === 'storewise' && isMerged && (
          <StoreWiseView 
            data={teamData as MergedData[]} 
            trainerNames={{}}
          />
        )}

        {activeTab === 'team' && (
          <>
        {/* Search and Filter Bar */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterLevel('all')}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                  filterLevel === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                All ({teamMembers.length})
              </button>
              <button
                onClick={() => setFilterLevel('direct')}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                  filterLevel === 'direct'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Direct ({teamMembers.filter(emp => emp.reporting_manager_code.toLowerCase() === managerCode.toLowerCase() && emp.employee_code.toLowerCase() !== managerCode.toLowerCase()).length})
              </button>
              <button
                onClick={() => setFilterLevel('indirect')}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                  filterLevel === 'indirect'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Indirect ({teamMembers.filter(emp => emp.reporting_manager_code.toLowerCase() !== managerCode.toLowerCase() && emp.employee_code.toLowerCase() !== managerCode.toLowerCase()).length})
              </button>
            </div>
          </div>
        </div>

        {/* Manager's Own Completion Section */}
        {teamLevels.managerRecord && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border-2 border-blue-300 dark:border-blue-700">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                My Completion
              </span>
            </h2>
            
            <div className="space-y-3">
              <EmployeeCard
                key={teamLevels.managerRecord.employee_code}
                employee={teamLevels.managerRecord}
                isExpanded={expandedEmployee === teamLevels.managerRecord.employee_code}
                onToggle={() => setExpandedEmployee(expandedEmployee === teamLevels.managerRecord.employee_code ? null : teamLevels.managerRecord.employee_code)}
                selectedCourse={selectedCourse}
                onCourseClick={setSelectedCourse}
                isDirect={true}
              />
            </div>
          </div>
        )}

        {/* Direct Reports Section */}
        {teamLevels.directReports.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Direct Reports ({teamLevels.directReports.length})
              {totalDirectPages > 1 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  (Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, teamLevels.directReports.length)})
                </span>
              )}
            </h2>
            
            <div className="space-y-3">
              {paginatedDirect.map((employee) => (
                <EmployeeCard
                  key={employee.employee_code}
                  employee={employee}
                  isExpanded={expandedEmployee === employee.employee_code}
                  onToggle={() => setExpandedEmployee(expandedEmployee === employee.employee_code ? null : employee.employee_code)}
                  selectedCourse={selectedCourse}
                  onCourseClick={setSelectedCourse}
                  isDirect={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Indirect Reports Section */}
        {teamLevels.indirectReports.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Indirect Reports ({teamLevels.indirectReports.length})
              {totalIndirectPages > 1 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  (Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, teamLevels.indirectReports.length)})
                </span>
              )}
            </h2>
            
            <div className="space-y-3">
              {paginatedIndirect.map((employee) => (
                <EmployeeCard
                  key={employee.employee_code}
                  employee={employee}
                  isExpanded={expandedEmployee === employee.employee_code}
                  onToggle={() => setExpandedEmployee(expandedEmployee === employee.employee_code ? null : employee.employee_code)}
                  selectedCourse={selectedCourse}
                  onCourseClick={setSelectedCourse}
                  isDirect={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {(totalDirectPages > 1 || totalIndirectPages > 1) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {Math.max(totalDirectPages, totalIndirectPages)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.max(totalDirectPages, totalIndirectPages), prev + 1))}
                disabled={currentPage === Math.max(totalDirectPages, totalIndirectPages)}
                className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(totalDirectPages, totalIndirectPages))}
                disabled={currentPage === Math.max(totalDirectPages, totalIndirectPages)}
                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Last
              </button>
            </div>
          </div>
        )}
          </>
        )}

        {/* Stat Card Detail Modal */}
        {isStatModalOpen && selectedStatType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedStatType === 'members' && 'All Team Members'}
                      {selectedStatType === 'highPerformers' && 'High Performers (≥80%)'}
                      {selectedStatType === 'needsAttention' && 'Needs Attention (<60%)'}
                      {selectedStatType === 'direct' && 'Direct Reports'}
                      {selectedStatType === 'indirect' && 'Indirect Reports'}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                      {selectedStatType === 'members' && `${teamStats.totalMembers} team members`}
                      {selectedStatType === 'highPerformers' && `${teamStats.highPerformers} high performing team members`}
                      {selectedStatType === 'needsAttention' && `${teamStats.needsAttention} team members requiring attention`}
                      {selectedStatType === 'direct' && `${teamLevels.directReports.length} direct reports`}
                      {selectedStatType === 'indirect' && `${teamLevels.indirectReports.length} indirect reports`}
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className={`p-4 rounded-xl ${
                    selectedStatType === 'members' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20' :
                    selectedStatType === 'highPerformers' ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' :
                    selectedStatType === 'needsAttention' ? 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20' :
                    selectedStatType === 'direct' ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20' :
                    'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
                  }`}>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {selectedStatType === 'members' && teamStats.totalMembers}
                      {selectedStatType === 'highPerformers' && teamStats.highPerformers}
                      {selectedStatType === 'needsAttention' && teamStats.needsAttention}
                      {selectedStatType === 'direct' && teamLevels.directReports.length}
                      {selectedStatType === 'indirect' && teamLevels.indirectReports.length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Total Count</div>
                  </div>
                  
                  <div className={`p-4 rounded-xl`}>
                    <div className={`text-2xl sm:text-3xl font-bold ${getRateVariant(teamStats.avgCompletionRate).textClass}`}>{teamStats.avgCompletionRate}%</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Avg. Completion</div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{teamStats.completedCourses}</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Completed</div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">{teamStats.totalHours}</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Total Hours</div>
                  </div>
                </div>

                {/* Team Member List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Team Members</h3>
                  {(selectedStatType === 'members' ? teamMembers :
                    selectedStatType === 'highPerformers' ? teamMembers.filter(emp => emp.completion_rate >= 80) :
                    selectedStatType === 'needsAttention' ? teamMembers.filter(emp => emp.completion_rate < 60) :
                    selectedStatType === 'direct' ? teamLevels.directReports :
                    teamLevels.indirectReports
                  ).map((employee, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${
                            employee.reporting_manager_code.toLowerCase() === managerCode.toLowerCase() ? 'from-indigo-500 to-purple-500' : 'from-purple-500 to-pink-500'
                          }`}>
                            {employee.employee_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{employee.employee_name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{employee.designation}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          employee.completion_rate >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          employee.completion_rate >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {Math.round(employee.completion_rate)}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Total Courses:</span>
                          <div className="font-medium text-gray-900 dark:text-white">{employee.total_courses}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                          <div className="font-medium text-gray-900 dark:text-white">{employee.completed_courses}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">In Progress:</span>
                          <div className="font-medium text-gray-900 dark:text-white">{employee.in_progress}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Hours:</span>
                          <div className="font-medium text-gray-900 dark:text-white">{employee.total_hours.toFixed(1)}</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <span>Progress</span>
                          <span className="font-medium">{Math.round(employee.completion_rate)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              employee.completion_rate >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              employee.completion_rate >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                              'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ width: `${employee.completion_rate}%` }}
                          />
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

// Employee Card Component
interface EmployeeCardProps {
  employee: any;
  isExpanded: boolean;
  onToggle: () => void;
  selectedCourse: string | null;
  onCourseClick: (course: string | null) => void;
  isDirect: boolean;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ 
  employee, 
  isExpanded, 
  onToggle, 
  selectedCourse, 
  onCourseClick,
  isDirect 
}) => {
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'from-green-500 to-emerald-500 text-white';
    if (rate >= 60) return 'from-yellow-500 to-orange-500 text-white';
    return 'from-red-500 to-pink-500 text-white';
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 80) return { text: 'High Performer', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' };
    if (rate >= 60) return { text: 'Average', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' };
    return { text: 'Needs Attention', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' };
  };

  const badge = getPerformanceBadge(employee.completion_rate);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-md bg-white/90 dark:bg-slate-800/90">
      <button
        onClick={onToggle}
        className="w-full p-3 sm:p-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all duration-200 text-left touch-manipulation active:scale-[0.99]"
      >
  <div className="flex items-stretch justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold shadow-md bg-gradient-to-br ${isDirect ? 'from-indigo-500 to-purple-500' : 'from-purple-500 to-pink-500'}`}>
                {employee.employee_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl md:text-2xl truncate">{employee.employee_name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap ${badge.color}`}>
                    {badge.text}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">{employee.designation}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-xs">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 truncate">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium truncate">{employee.reporting_manager_name}</span>
              </span>
              {employee.location && (
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 truncate">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium truncate">{employee.location}</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center gap-2 sm:gap-4 flex-shrink-0 h-full">
            <div className="text-center">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20">
                {/* Glow effect background */}
                <div className={`absolute inset-0 rounded-full blur-lg sm:blur-xl opacity-20 sm:opacity-30 ${
                  employee.completion_rate >= 80 ? 'bg-green-400' : 
                  employee.completion_rate >= 60 ? 'bg-amber-400' : 
                  'bg-red-400'
                }`}></div>
                
                {/* SVG Progress Circle */}
                <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 80 80">
                  {/* Background circle with subtle shadow */}
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="32" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="6" 
                    className="text-slate-200 dark:text-slate-700/50"
                  />
                  {/* Progress circle with gradient and animation */}
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="32" 
                    fill="none" 
                    stroke={`url(#gradient-${employee.employee_code})`}
                    strokeWidth="6" 
                    strokeDasharray={`${2 * Math.PI * 32 * employee.completion_rate / 100} ${2 * Math.PI * 32}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out drop-shadow-lg"
                    style={{
                      filter: `drop-shadow(0 0 3px ${
                        employee.completion_rate >= 80 ? 'rgba(16, 185, 129, 0.6)' : 
                        employee.completion_rate >= 60 ? 'rgba(245, 158, 11, 0.6)' : 
                        'rgba(239, 68, 68, 0.6)'
                      })`
                    }}
                  />
                  <defs>
                    <linearGradient id={`gradient-${employee.employee_code}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      {employee.completion_rate >= 80 ? (
                        <>
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </>
                      ) : employee.completion_rate >= 60 ? (
                        <>
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </>
                      ) : (
                        <>
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </>
                      )}
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Center text with icon */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  {employee.completion_rate === 100 ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className={`text-sm sm:text-base md:text-lg font-bold ${
                      employee.completion_rate >= 80 ? 'text-green-600 dark:text-green-400' :
                      employee.completion_rate >= 60 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {Math.round(employee.completion_rate)}%
                    </span>
                  )}
                </div>
              </div>
              <p className={`text-xs font-medium mt-1 sm:mt-2 ${
                employee.completion_rate >= 80 ? 'text-green-600 dark:text-green-400' :
                employee.completion_rate >= 60 ? 'text-amber-600 dark:text-amber-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {employee.completed_courses}/{employee.total_courses}
              </p>
            </div>
            
            <svg 
              className={`w-5 h-5 sm:w-6 sm:h-6 text-slate-400 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      
      {/* Expanded Course Details - Animated with Glassmorphism */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-slate-200 dark:border-slate-700 p-3 sm:p-4 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/50 dark:to-slate-700/30 backdrop-blur-sm">
          {/* Employee Stats Summary */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-2 sm:p-3 rounded-lg text-center shadow-sm">
              <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">{employee.total_courses}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Total</div>
            </div>
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-2 sm:p-3 rounded-lg text-center shadow-sm">
              <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">{employee.completed_courses}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Completed</div>
            </div>
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-2 sm:p-3 rounded-lg text-center shadow-sm">
              <div className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">{employee.in_progress}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">In Progress</div>
            </div>
          </div>

          {/* Courses List */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Courses</h4>
            {employee.courses.map((course: any, idx: number) => (
              <div 
                key={idx}
                className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">{course.course_name}</h4>
                      {course.completion_status === 'Completed' ? (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full font-medium flex items-center gap-1 flex-shrink-0">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Complete
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs rounded-full font-medium flex-shrink-0">
                          {course.progress}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {course.course_category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {course.hours}h
                      </span>
                    </div>
                    {/* Progress bar for incomplete courses */}
                    {course.completion_status !== 'Completed' && (
                      <div className="mt-2">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerView;
