import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { EmployeeTrainingRecord, MergedData } from '../types';
import Dashboard from './Dashboard';
import StoreWiseView from './StoreWiseView';
import { storeMappingData } from '../data/storeMapping';

interface TrainerViewProps {
  data: (EmployeeTrainingRecord | MergedData)[];
  trainerCode: string;
  trainerNames?: Record<string, string>;
  lastModified?: Date | null;
}

const ITEMS_PER_PAGE = 20; // Show 20 employees at a time

const TrainerView: React.FC<TrainerViewProps> = ({ data, trainerCode, trainerNames = {}, lastModified = null }) => {
  const parsePercent = (v: any) => {
    if (v === null || v === undefined) return 0;
    const raw = typeof v === 'string' ? v.replace(/%/g, '') : String(v);
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : Math.round(n);
  };
  
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
  
  // Normalize trainerCode and lookup display name case-insensitively
  const normalizedTrainerCodeUpper = trainerCode ? trainerCode.toUpperCase() : trainerCode;
  const normalizedTrainerCodeLower = trainerCode ? trainerCode.toLowerCase() : trainerCode;
  const trainerDisplayName = trainerNames[normalizedTrainerCodeUpper] || trainerNames[normalizedTrainerCodeLower] || null;
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [isStatModalOpen, setIsStatModalOpen] = useState<boolean>(false);
  const [selectedStatType, setSelectedStatType] = useState<'total' | 'highPerformers' | 'needsAttention' | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'overall' | 'storewise'>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStore, setFilterStore] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [storeSearchTerm, setStoreSearchTerm] = useState<string>('');
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState<boolean>(false);

  // Ref for store dropdown to handle click outside
  const storeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target as Node)) {
        setIsStoreDropdownOpen(false);
        setStoreSearchTerm('');
      }
    };

    if (isStoreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStoreDropdownOpen]);

  // Get trainer info and their stores
  const trainerInfo = useMemo(() => {
    const normalizedTrainerCode = trainerCode.toLowerCase();
    
    // Check if this trainer has pan India access
    // H541 (Amritanshu), H1697 (Sheldon) - Pan India access
    const panIndiaManagers = ['h541', 'h1697'];
    
    if (panIndiaManagers.includes(normalizedTrainerCode)) {
      // Pan India access - all stores
      const stores = storeMappingData;
      const storeIds = stores.map(s => s['Store ID']);
      return { stores, storeIds, region: 'Pan India', isRegionalManager: true, isPanIndia: true };
    }
    
    // Check if this is a Regional Training Manager
    // H701 (Mallika), H2155 (Jagruti), H3786 (Oviya) - South (entire region)
    // H2595 (Kailash), H3595 (Bhawna) - North (entire region)
    // H3252 (Priyanka), H1278 (Viraj) - West (entire region)
    const regionalManagers: Record<string, string> = {
      'h701': 'South',
      'h2155': 'South',
      'h3786': 'South',
      'h2595': 'North',
      'h3595': 'North',
      'h3252': 'West',
      'h1278': 'West'
    };
    
    const region = regionalManagers[normalizedTrainerCode];
    
    if (region) {
      // Regional Training Manager - get all stores in their region
      const stores = storeMappingData.filter(store => store.Region === region);
      const storeIds = stores.map(s => s['Store ID']);
      return { stores, storeIds, region, isRegionalManager: true, isPanIndia: false };
    }
    
    // Regular trainer - only their assigned stores
    const stores = storeMappingData.filter(store => store.Trainer.toLowerCase() === normalizedTrainerCode);
    const storeIds = stores.map(s => s['Store ID']);
    return { stores, storeIds, region: null, isRegionalManager: false, isPanIndia: false };
  }, [trainerCode]);

  // Check if this is E-Learning Specialist, Training Head, or HR Head (access to all data)
  const hasFullAccess = useMemo(() => {
    const normalizedTrainerCode = trainerCode.toLowerCase();
    const eLearningSpecialist = storeMappingData.find(s => s['E-Learning Specialist'].toLowerCase() === normalizedTrainerCode);
    const trainingHead = storeMappingData.find(s => s['Training Head'].toLowerCase() === normalizedTrainerCode);
    const hrHead = storeMappingData.find(s => s['HR Head'].toLowerCase() === normalizedTrainerCode);
    return !!(eLearningSpecialist || trainingHead || hrHead);
  }, [trainerCode]);

  // Get role name
  const roleName = useMemo(() => {
    const normalizedTrainerCode = trainerCode.toLowerCase();
    
    // Check if Regional Training Manager
    if (trainerInfo.isRegionalManager) {
      return 'Regional Training Manager';
    }
    
    if (storeMappingData.find(s => s['Training Head'] === trainerCode)) return 'Training Head';
    if (storeMappingData.find(s => s['HR Head'] === trainerCode)) return 'HR Head';
    if (storeMappingData.find(s => s['E-Learning Specialist'] === trainerCode)) return 'E-Learning Specialist';
    return 'Trainer';
  }, [trainerCode, trainerInfo.isRegionalManager]);

  // Filter data by trainer's stores or show all if full access
  const filteredData = useMemo(() => {
    if (hasFullAccess) {
      return data; // Full access to all data
    }
    
    return data.filter(item => {
      const storeId = (item as MergedData)['Store ID'];
      return trainerInfo.storeIds.includes(storeId);
    });
  }, [data, hasFullAccess, trainerInfo.storeIds]);

  // Group data by employee with filters
  const employeeData = useMemo(() => {
    const employeeMap = new Map<string, {
      employee_code: string;
      employee_name: string;
      employee_email: string;
      reporting_manager_name: string;
      designation: string;
      department: string;
      location: string;
      store_id: string;
      date_of_joining: string;
      total_courses: number;
      completed_courses: number;
      in_progress: number;
      completion_rate: number;
      total_hours: number;
      courses: Array<{
        course_name: string;
        course_category: string;
        completion_status: string;
        completion_date: string;
        course_end_date: string;
        course_progress: string;
        time_spent_hours: number;
      }>;
    }>();

    filteredData.forEach(item => {
      const empCode = item.employee_code;
      if (!employeeMap.has(empCode)) {
        employeeMap.set(empCode, {
          employee_code: empCode,
          employee_name: item.employee_name,
          employee_email: (item as any).employee_email || '',
          reporting_manager_name: item.reporting_manager_name || 'N/A',
          designation: item.designation,
          department: item.department || 'N/A',
          location: (item as MergedData).location || 'N/A',
          store_id: (item as MergedData)['Store ID'] || 'N/A',
          date_of_joining: item.date_of_joining || '',
          total_courses: 0,
          completed_courses: 0,
          in_progress: 0,
          completion_rate: 0,
          total_hours: 0,
          courses: []
        });
      }

      const emp = employeeMap.get(empCode)!;
      emp.total_courses++;
      
      const status = item.course_completion_status || (item as any).completion_status;
      if (status === 'Completed') {
        emp.completed_courses++;
      } else {
        emp.in_progress++;
      }

      const hours = parseFloat((item as any).time_spent_hours || '0');
      emp.total_hours += isNaN(hours) ? 0 : hours;
      emp.courses.push({
        course_name: item.course_name,
        course_category: item.course_category || 'General',
        completion_status: status,
        completion_date: (item as any).completion_date || '',
        course_end_date: item.course_end_date || '',
        course_progress: String(item.course_progress || '0'),
        time_spent_hours: parseFloat((item as any).time_spent_hours || '0')
      });

      emp.completion_rate = Math.round((emp.completed_courses / emp.total_courses) * 100);
    });

    let employees = Array.from(employeeMap.values());
    
    // Apply search filter
    if (searchTerm) {
      employees = employees.filter(emp =>
        emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply store filter
    if (filterStore !== 'all') {
      employees = employees.filter(emp => emp.location === filterStore);
    }
    
    // Apply region filter
    if (filterRegion !== 'all') {
      employees = employees.filter(emp => {
        const storeData = storeMappingData.find(s => s.location === emp.location);
        return storeData?.Region === filterRegion;
      });
    }
    
    return employees.sort((a, b) => 
      a.employee_name.localeCompare(b.employee_name)
    );
  }, [filteredData, searchTerm, filterStore, filterRegion]);

  // Get unique stores for filter
  const uniqueStores = useMemo(() => {
    const stores = new Set(filteredData.map(item => (item as MergedData).location).filter(Boolean));
    return Array.from(stores).sort();
  }, [filteredData]);

  // Filter stores based on search term
  const filteredStores = useMemo(() => {
    if (!storeSearchTerm) return uniqueStores;
    return uniqueStores.filter(store => 
      store.toLowerCase().includes(storeSearchTerm.toLowerCase())
    );
  }, [uniqueStores, storeSearchTerm]);

  // Get unique regions for filter
  const uniqueRegions = useMemo(() => {
    const regions = new Set(
      filteredData
        .map(item => {
          const location = (item as MergedData).location;
          const storeData = storeMappingData.find(s => s.location === location);
          return storeData?.Region;
        })
        .filter(Boolean)
    );
    return Array.from(regions).sort();
  }, [filteredData]);

  // Handle stat card clicks
  const handleStatCardClick = (statType: 'total' | 'highPerformers' | 'needsAttention') => {
    setSelectedStatType(statType);
    setIsStatModalOpen(true);
  };

  const closeStatModal = () => {
    setIsStatModalOpen(false);
    setSelectedStatType(null);
  };

  // Calculate aggregate stats
  const stats = useMemo(() => {
    const totalMembers = employeeData.length;
    const totalCourses = employeeData.reduce((sum, emp) => sum + emp.total_courses, 0);
    const completedCourses = employeeData.reduce((sum, emp) => sum + emp.completed_courses, 0);
    const totalHours = employeeData.reduce((sum, emp) => sum + (emp.total_hours || 0), 0);
    const avgCompletionRate = totalMembers > 0 
      ? Math.round(employeeData.reduce((sum, emp) => sum + emp.completion_rate, 0) / totalMembers)
      : 0;
    const highPerformers = employeeData.filter(emp => emp.completion_rate >= 80).length;
    const needsAttention = employeeData.filter(emp => emp.completion_rate < 60).length;

    return {
      totalMembers,
      totalCourses,
      completedCourses,
      avgCompletionRate,
      totalHours: isNaN(totalHours) ? 0 : Math.round(totalHours * 10) / 10,
      highPerformers,
      needsAttention
    };
  }, [employeeData]);

  // Pagination
  const totalPages = Math.ceil(employeeData.length / ITEMS_PER_PAGE);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return employeeData.slice(startIndex, endIndex);
  }, [employeeData, currentPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStore, filterRegion]);

  if (employeeData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Data Available</h2>
            <p className="text-gray-600 dark:text-gray-400">
              No employee training data found for trainer code: <span className="font-mono font-semibold">{trainerCode}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-2 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-indigo-200/50 dark:border-indigo-800/50">
          <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  {roleName} Dashboard
                </h1>
                <div className="mt-1">
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {trainerDisplayName ? (
                      <>
                        <span className="font-bold text-lg text-gray-900 dark:text-white">{trainerDisplayName}</span>
                        <span className="ml-2 text-xs font-mono font-semibold text-gray-600 dark:text-gray-300">({normalizedTrainerCodeUpper})</span>
                      </>
                    ) : (
                      <>ID: <span className="font-mono font-semibold">{trainerCode}</span></>
                    )}
                  </p>
                  <div className="mt-1">
                    {trainerInfo.isRegionalManager && trainerInfo.region && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full font-semibold">
                        {trainerInfo.region} Region • {trainerInfo.stores.length} Store{trainerInfo.stores.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {!hasFullAccess && !trainerInfo.isRegionalManager && (
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                        {trainerInfo.stores.length} Store{trainerInfo.stores.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {hasFullAccess && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                        Full Access
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Updated on:
              </p>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {lastModified 
                  ? lastModified.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                }
              </p>
            </div>
          </div>

          {/* Stats Grid - Enhanced with Clickable Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
            {/* Total Employees Card */}
            <div 
              onClick={() => handleStatCardClick('total')}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group active:scale-95 touch-manipulation"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-all duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Employees</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMembers}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">View all</p>
              </div>
            </div>

            {/* Total Courses Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 p-2 bg-purple-500/10 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Courses</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCourses}</p>
              </div>
            </div>

            {/* Completed Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 p-2 bg-green-500/10 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.completedCourses}</p>
              </div>
            </div>

            {/* Average Completion Card */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-yellow-200 dark:border-yellow-800 relative overflow-hidden">
              <div className="flex flex-col items-center text-center relative z-10 select-none">
                <div className="mb-2 p-2 bg-yellow-500/10 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Completion</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{Math.round(stats.avgCompletionRate)}%</p>
              </div>
              {/* Background circle progress */}
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-yellow-300 dark:text-yellow-700" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  className="text-yellow-600 dark:text-yellow-400"
                  strokeDasharray={`${2 * Math.PI * 40 * stats.avgCompletionRate / 100} ${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * 0.25}`}
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* High Performers Card */}
            <div 
              onClick={() => handleStatCardClick('highPerformers')}
              className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group active:scale-95 touch-manipulation"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-all duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">High Performers</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.highPerformers}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">≥80%</p>
              </div>
            </div>

            {/* Needs Attention Card */}
            <div 
              onClick={() => handleStatCardClick('needsAttention')}
              className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-red-200 dark:border-red-800 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group active:scale-95 touch-manipulation"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-all duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Needs Attention</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.needsAttention}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">&lt;60%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: switch between trainer dashboard and overall scoped dashboard */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-indigo-200/50 dark:border-indigo-700/50">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              Emp. Dashboard
            </button>
            <button
              onClick={() => setActiveTab('overall')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overall'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              Overall Dashboard
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

          {activeTab === 'overall' && (
            <Dashboard
              data={filteredData as any}
              fileName={`Overall - ${trainerCode}`}
              isMerged={Boolean((filteredData as any)[0] && (filteredData as any)[0]['Store ID'])}
              lastModified={lastModified}
            />
          )}

          {activeTab === 'storewise' && (
            <StoreWiseView 
              data={filteredData as MergedData[]} 
              trainerNames={trainerNames}
            />
          )}

          {activeTab === 'dashboard' && (
            <>
              {/* Search and Filter Bar */}
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Input */}
                  <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
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
            
            {/* Store Filter - Searchable */}
            {uniqueStores.length > 1 && (
              <div ref={storeDropdownRef} className="relative min-w-[180px]">
                <button
                  onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all flex items-center justify-between"
                >
                  <span className="truncate">{filterStore === 'all' ? 'All Stores' : filterStore}</span>
                  <svg className={`w-4 h-4 ml-2 transition-transform ${isStoreDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isStoreDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-64 overflow-hidden">
                    <div className="p-2 border-b border-slate-200 dark:border-slate-600">
                      <input
                        type="text"
                        placeholder="Search stores..."
                        value={storeSearchTerm}
                        onChange={(e) => setStoreSearchTerm(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <button
                        onClick={() => {
                          setFilterStore('all');
                          setIsStoreDropdownOpen(false);
                          setStoreSearchTerm('');
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors ${
                          filterStore === 'all' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        All Stores
                      </button>
                      {filteredStores.map(store => (
                        <button
                          key={store}
                          onClick={() => {
                            setFilterStore(store);
                            setIsStoreDropdownOpen(false);
                            setStoreSearchTerm('');
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors ${
                            filterStore === store ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {store}
                        </button>
                      ))}
                      {filteredStores.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                          No stores found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Region Filter */}
            {uniqueRegions.length > 1 && (
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-w-[150px]"
              >
                <option value="all">All Regions</option>
                {uniqueRegions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Employee List */}
        <div className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white px-2">
            Employees ({employeeData.length})
            {totalPages > 1 && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                (Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, employeeData.length)})
              </span>
            )}
          </h2>
          
          {paginatedEmployees.map((employee) => (
            <div
              key={employee.employee_code}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-indigo-200/50 dark:border-indigo-700/50 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Employee Header */}
              <button
                onClick={() => setExpandedEmployee(
                  expandedEmployee === employee.employee_code ? null : employee.employee_code
                )}
                className="w-full p-4 sm:p-6 text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all duration-200 touch-manipulation active:scale-[0.99]"
              >
                <div className="flex items-stretch justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md bg-gradient-to-br ${
                        employee.completion_rate >= 80 ? 'from-green-500 to-emerald-500' :
                        employee.completion_rate >= 60 ? 'from-yellow-500 to-orange-500' :
                        'from-red-500 to-pink-500'
                      }`}>
                        {employee.employee_name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                            {employee.employee_name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              employee.completion_rate >= 80
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : employee.completion_rate >= 60
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}
                          >
                            {Math.round(employee.completion_rate)}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {employee.designation} • Tenure: {calculateTenure(employee.date_of_joining)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        <span className="truncate">{employee.employee_code}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="truncate">{employee.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate">Manager: {employee.reporting_manager_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{isNaN(employee.total_hours) ? '0.0' : employee.total_hours.toFixed(1)}h</span>
                      </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="flex flex-wrap gap-4 mt-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Courses:</span>
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                          {employee.completed_courses}/{employee.total_courses}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">In Progress:</span>
                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full font-medium">
                          {employee.in_progress}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-4 h-full">
                    {/* Circular Progress */}
                    <div className="relative w-12 h-12">
                      {/* Glow effect */}
                      <div className={`absolute inset-0 rounded-full blur-md opacity-20 ${
                        employee.total_courses > 0 && employee.completed_courses === employee.total_courses ? 'bg-green-400' : 'bg-blue-400'
                      }`}></div>

                      <svg className="w-12 h-12 transform -rotate-90 relative z-10">
                        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200 dark:text-slate-700/50" />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 20 * (employee.completion_rate / 100)} ${2 * Math.PI * 20}`}
                          strokeLinecap="round"
                          className={`transition-all duration-700 ${employee.total_courses > 0 && employee.completed_courses === employee.total_courses ? 'text-green-500' : 'text-blue-500'}`}
                          style={{
                            filter: `drop-shadow(0 0 3px ${employee.total_courses > 0 && employee.completed_courses === employee.total_courses ? 'rgba(34,197,94,0.5)' : 'rgba(59,130,246,0.5)'})`
                          }}
                        />
                      </svg>

                      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold z-20 ${
                        employee.total_courses > 0 && employee.completed_courses === employee.total_courses ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {Math.round(employee.completion_rate)}%
                      </span>
                    </div>

                    <svg
                      className={`w-6 h-6 text-gray-400 transition-transform duration-300 flex-shrink-0 ${
                        expandedEmployee === employee.employee_code ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded Course Details - Animated */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedEmployee === employee.employee_code ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900/50 dark:to-slate-800/50">
                  {/* Course Stats Summary */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{employee.total_courses}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Total</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">{employee.completed_courses}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Completed</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{employee.in_progress}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">In Progress</div>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">
                    Course Details ({employee.courses.length})
                  </h4>
                  <div className="space-y-2">
                    {employee.courses.map((course, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h5 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base flex-1">
                            {course.course_name}
                          </h5>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
                              course.completion_status === 'Completed'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            }`}
                          >
                            {course.completion_status === 'Completed' && (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            {course.completion_status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span>{course.course_category}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>{parsePercent(course.course_progress)}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{course.time_spent_hours.toFixed(1)}h</span>
                          </div>
                          {course.completion_date && (
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{new Date(course.completion_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        {/* Progress bar for incomplete courses */}
                        {course.completion_status !== 'Completed' && (
                          <div className="mt-2">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${parsePercent(course.course_progress)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
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
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </>
        )}
        </div>

        {/* Stat Card Detail Modal */}
        {isStatModalOpen && selectedStatType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedStatType === 'total' && 'All Employees'}
                      {selectedStatType === 'highPerformers' && 'High Performers (≥80%)'}
                      {selectedStatType === 'needsAttention' && 'Needs Attention (<60%)'}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                      {selectedStatType === 'total' && `${stats.totalMembers} total employees`}
                      {selectedStatType === 'highPerformers' && `${stats.highPerformers} high performing employees`}
                      {selectedStatType === 'needsAttention' && `${stats.needsAttention} employees requiring attention`}
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
                    selectedStatType === 'total' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20' :
                    selectedStatType === 'highPerformers' ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' :
                    'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20'
                  }`}>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {selectedStatType === 'total' && stats.totalMembers}
                      {selectedStatType === 'highPerformers' && stats.highPerformers}
                      {selectedStatType === 'needsAttention' && stats.needsAttention}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Total Count</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{Math.round(stats.avgCompletionRate)}%</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Avg. Completion</div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{stats.completedCourses}</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Completed</div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.totalHours}</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Total Hours</div>
                  </div>
                </div>

                {/* Employee List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Employees</h3>
                  {(selectedStatType === 'total' ? employeeData :
                    selectedStatType === 'highPerformers' ? employeeData.filter(emp => emp.completion_rate >= 80) :
                    employeeData.filter(emp => emp.completion_rate < 60)
                  ).map((employee, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${
                            employee.completion_rate >= 80 ? 'from-green-500 to-emerald-500' :
                            employee.completion_rate >= 60 ? 'from-yellow-500 to-orange-500' :
                            'from-red-500 to-pink-500'
                          }`}>
                            {employee.employee_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{employee.employee_name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {employee.designation} • {employee.location} • Tenure: {calculateTenure(employee.date_of_joining)}
                            </p>
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

export default TrainerView;
