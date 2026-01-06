import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { EmployeeTrainingRecord, MergedData } from '../types';
import { storeMappingData } from '../data/storeMapping';
import StatCard from './StatCard';
import CompletionRateCard from './CompletionRateCard';
import RegionCompletionChart from './RegionCompletionChart';
import TrainerCompletionChart from './TrainerCompletionChart';
import AreaManagerCompletionChart from './AreaManagerCompletionChart';
import CourseCompletionChart from './CourseCompletionChart';
import StoreCompletionChart from './StoreCompletionChart';
import DesignationCompletionChart from './DesignationCompletionChart';
import TenureDistributionChart from './TenureDistributionChart';
import TenureCompletionChart from './TenureCompletionChart';
import MultiSelectFilter from './MultiSelectFilter';

interface DashboardProps {
  data: (EmployeeTrainingRecord | MergedData)[];
  fileName: string;
  isMerged: boolean;
  trainerNames?: Record<string, string>;
  areaManagerNames?: Record<string, string>;
  lastModified?: Date | null;
}

const Dashboard: React.FC<DashboardProps> = ({ data, fileName, isMerged, trainerNames = {}, areaManagerNames = {}, lastModified = null }) => {
  // Create reverse mapping from name to ID for filtering
  const trainerIdsByName = useMemo(() => {
    const reverseMap: Record<string, string> = {};
    Object.entries(trainerNames).forEach(([id, name]) => {
      reverseMap[name] = id;
    });
    return reverseMap;
  }, [trainerNames]);

  // Multi-select filter states
  const [selectedTenure, setSelectedTenure] = useState<string[]>([]);
  const [selectedStore, setSelectedStore] = useState<string[]>([]);
  const [selectedAreaManager, setSelectedAreaManager] = useState<string[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string[]>([]);
  const [selectedDesignation, setSelectedDesignation] = useState<string[]>([]);

  // Filter collapse state for mobile
  const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(false);

  // Search states for filters
  const [storeSearch, setStoreSearch] = useState<string>('');
  const [areaManagerSearch, setAreaManagerSearch] = useState<string>('');
  const [trainerSearch, setTrainerSearch] = useState<string>('');
  const [courseSearch, setCourseSearch] = useState<string>('');
  const [designationSearch, setDesignationSearch] = useState<string>('');

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

  // Get unique values for filter options
  const uniqueStores = useMemo(() => {
    const stores = [...new Set(storeMappingData.map(store => store.location))].sort();
    return stores.filter(store => store.toLowerCase().includes(storeSearch.toLowerCase()));
  }, [storeSearch]);

  const uniqueAreaManagers = useMemo(() => {
    const managers = [...new Set(storeMappingData.map(store => store.AM).filter(am => am !== 'TBD'))].sort();
    return managers.filter(manager => manager.toLowerCase().includes(areaManagerSearch.toLowerCase()));
  }, [areaManagerSearch]);

  const uniqueTrainers = useMemo(() => {
    const trainers = [...new Set(storeMappingData.map(store => store.Trainer).filter(trainer => trainer !== 'TBD'))].sort();
    // Map trainer IDs to names for display
    const trainerNamesArray = trainers.map(trainerId => trainerNames[trainerId] || trainerId);
    return trainerNamesArray.filter(trainer => trainer.toLowerCase().includes(trainerSearch.toLowerCase()));
  }, [trainerSearch, trainerNames]);

  const uniqueCourses = useMemo(() => {
    const courses = [...new Set(data.map(item => item.course_name || 'Unknown').filter(Boolean))].sort();
    return courses.filter(course => (course as string).toLowerCase().includes(courseSearch.toLowerCase()));
  }, [data, courseSearch]);

  const uniqueDesignations = useMemo(() => {
    const designations = [...new Set(data.map(item => item.designation || 'Unknown').filter(Boolean))].sort();
    return designations.filter(designation => (designation as string).toLowerCase().includes(designationSearch.toLowerCase()));
  }, [data, designationSearch]);

  // Filter data based on all selected filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Tenure filter
      if (selectedTenure.length > 0) {
        const tenure = calculateTenure(item.date_of_joining);
        if (!selectedTenure.includes(tenure)) return false;
      }
      
      // Store filter
      if (selectedStore.length > 0) {
        const storeName = isMerged ? (item as MergedData).location : 'Unknown';
        if (!selectedStore.includes(storeName)) return false;
      }
      
      // Area Manager filter
      if (selectedAreaManager.length > 0) {
        const areaManager = isMerged ? (item as MergedData).AM : 'Unknown';
        if (!selectedAreaManager.includes(areaManager)) return false;
      }
      
      // Trainer filter
      if (selectedTrainer.length > 0) {
        const trainer = isMerged ? (item as MergedData).Trainer : 'Unknown';
        // Convert selected trainer names to IDs for comparison
        const selectedTrainerIds = selectedTrainer.map(name => trainerIdsByName[name] || name);
        if (!selectedTrainerIds.includes(trainer)) return false;
      }
      
      // Course filter
      if (selectedCourse.length > 0 && !selectedCourse.includes(item.course_name || 'Unknown')) {
        return false;
      }
      
      // Designation filter
      if (selectedDesignation.length > 0 && !selectedDesignation.includes(item.designation || 'Unknown')) {
        return false;
      }
      
      return true;
    });
  }, [data, selectedTenure, selectedStore, selectedAreaManager, selectedTrainer, selectedCourse, selectedDesignation, isMerged]);

  // Calculate aggregate stats for filtered data
  const totalEmployees = new Set(filteredData.map(item => item.employee_code)).size;
  const totalEnrollments = filteredData.length;

  // Calculate completion rates for performance categorization
  const employeeCompletionRates = useMemo(() => {
    const employeeMap = new Map();
    
    filteredData.forEach(item => {
      const empCode = item.employee_code;
      if (!employeeMap.has(empCode)) {
        employeeMap.set(empCode, {
          employee_code: empCode,
          employee_name: item.employee_name,
          designation: item.designation,
          location: (item as MergedData).location || 'N/A',
          total_courses: 0,
          completed_courses: 0,
          completion_rate: 0,
          courses: []
        });
      }
      
      const emp = employeeMap.get(empCode);
      emp.total_courses++;
      emp.courses.push({
        course_name: item.course_name,
        completion_status: item.course_completion_status,
        completion_date: item.course_completion_date,
        course_end_date: item.course_end_date
      });
      
      if (item.course_completion_status === 'Completed') {
        emp.completed_courses++;
      }
      emp.completion_rate = Math.round((emp.completed_courses / emp.total_courses) * 100);
    });
    
    return Array.from(employeeMap.values());
  }, [filteredData]);

  const highPerformers = employeeCompletionRates.filter(emp => emp.completion_rate >= 80);
  const averagePerformers = employeeCompletionRates.filter(emp => emp.completion_rate >= 60 && emp.completion_rate < 80);
  const needsAttention = employeeCompletionRates.filter(emp => emp.completion_rate < 60);

  // CSV Download function
  const downloadEmployeeCSV = useCallback(() => {
    // Create CSV with detailed course information
    const rows: string[][] = [];
    
    // Add header
    rows.push(['Employee Code', 'Employee Name', 'Designation', 'Store', 'Course Name', 'Completion Status', 'Completion Date', 'Course End Date', 'Overall Completion Rate (%)']);
    
    // Create rows with each course as a separate line
    employeeCompletionRates.forEach(emp => {
      if (emp.courses && emp.courses.length > 0) {
        emp.courses.forEach(course => {
          rows.push([
            emp.employee_code,
            emp.employee_name,
            emp.designation,
            emp.location || 'N/A',
            course.course_name,
            course.completion_status,
            course.completion_date || 'N/A',
            course.course_end_date || 'N/A',
            emp.completion_rate.toString()
          ]);
        });
      } else {
        // If no courses, still add employee row
        rows.push([
          emp.employee_code,
          emp.employee_name,
          emp.designation,
          emp.location || 'N/A',
          'No courses assigned',
          'N/A',
          'N/A',
          'N/A',
          emp.completion_rate.toString()
        ]);
      }
    });

    // Escape and format CSV content
    const csvContent = rows.map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        // Escape cells that contain commas, quotes, or newlines
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `employee_dashboard_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [employeeCompletionRates]);

  // Helper function to safely calculate and format percentages
  const formatPercentage = (numerator: number, denominator: number): string => {
    if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) return '0';
    const percentage = Math.round((numerator / denominator) * 100);
    return isNaN(percentage) ? '0' : percentage.toString();
  };

  // Helper function to safely calculate average completion rate
  const getAverageCompletion = (employees: any[]): string => {
    if (employees.length === 0) return '0';
    const sum = employees.reduce((acc, emp) => acc + (emp.completion_rate || 0), 0);
    const average = Math.round(sum / employees.length);
    return isNaN(average) ? '0' : average.toString();
  };

  // Color variant helper for average completion
  const getRateVariant = (rate: number) => {
    if (rate >= 80) return { textClass: 'text-green-600 dark:text-green-400' };
    if (rate >= 60) return { textClass: 'text-yellow-600 dark:text-yellow-400' };
    return { textClass: 'text-red-600 dark:text-red-400' };
  };

  // Get active filter summary for display
  const getActiveFiltersText = () => {
    const activeFilters = [];
    if (selectedTenure.length > 0) {
      activeFilters.push(`Tenure: ${selectedTenure.length === 1 ? selectedTenure[0] : `${selectedTenure.length} selected`}`);
    }
    if (selectedStore.length > 0) {
      activeFilters.push(`Store: ${selectedStore.length === 1 ? selectedStore[0] : `${selectedStore.length} selected`}`);
    }
    if (selectedAreaManager.length > 0) {
      activeFilters.push(`Area Manager: ${selectedAreaManager.length === 1 ? selectedAreaManager[0] : `${selectedAreaManager.length} selected`}`);
    }
    if (selectedTrainer.length > 0) {
      activeFilters.push(`Trainer: ${selectedTrainer.length === 1 ? selectedTrainer[0] : `${selectedTrainer.length} selected`}`);
    }
    if (selectedCourse.length > 0) {
      activeFilters.push(`Course: ${selectedCourse.length === 1 ? selectedCourse[0] : `${selectedCourse.length} selected`}`);
    }
    if (selectedDesignation.length > 0) {
      activeFilters.push(`Designation: ${selectedDesignation.length === 1 ? selectedDesignation[0] : `${selectedDesignation.length} selected`}`);
    }
    
    if (activeFilters.length === 0) return 'All Data';
    if (activeFilters.length === 1) return activeFilters[0];
    return `${activeFilters.length} Filters Applied`;
  };

  // Store-wise Section Component
  const StoreWiseSection: React.FC<{ data: MergedData[] }> = ({ data }) => {
    const [expandedStore, setExpandedStore] = useState<string | null>(null);

    const storeData = useMemo(() => {
      const stores = new Map<string, { 
        location: string;
        employees: Set<string>;
        totalCourses: number;
        completedCourses: number;
        trainers: Set<string>;
        areaManager: string;
      }>();

      data.forEach(item => {
        const store = item.location || 'Unknown';
        if (!stores.has(store)) {
          stores.set(store, {
            location: store,
            employees: new Set(),
            totalCourses: 0,
            completedCourses: 0,
            trainers: new Set(),
            areaManager: item.AM || 'Unknown'
          });
        }
        
        const storeInfo = stores.get(store)!;
        storeInfo.employees.add(item.employee_code);
        storeInfo.totalCourses++;
        if (item.Trainer && item.Trainer !== 'TBD') {
          storeInfo.trainers.add(item.Trainer);
        }
        if (item.course_completion_status === 'Completed') {
          storeInfo.completedCourses++;
        }
      });

      return Array.from(stores.values())
        .map(store => ({
          ...store,
          employeeCount: store.employees.size,
          completionRate: store.totalCourses > 0 
            ? Math.round((store.completedCourses / store.totalCourses) * 100)
            : 0,
          trainerCount: store.trainers.size
        }))
        .sort((a, b) => b.completionRate - a.completionRate);
    }, [data]);

    const toggleStore = (storeName: string) => {
      setExpandedStore(expandedStore === storeName ? null : storeName);
    };

    return (
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Store-wise Performance
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {storeData.length} stores • Click to expand details
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {storeData.map((store, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleStore(store.location)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                    store.completionRate >= 80 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                    store.completionRate >= 60 ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                    'bg-gradient-to-br from-red-500 to-pink-600'
                  }`}>
                    {store.location.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{store.location}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {store.employeeCount} employees • {store.trainerCount} trainer{store.trainerCount !== 1 ? 's' : ''} • AM: {store.areaManager}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-2 text-lg font-bold rounded-full ${
                      store.completionRate >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      store.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {store.completionRate}%
                    </span>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedStore === store.location ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>
              
              {expandedStore === store.location && (
                <div className="p-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{store.employeeCount}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Employees</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{store.totalCourses}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Total Courses</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{store.completedCourses}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{store.trainerCount}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Trainers</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Trainer-wise Section Component
  const TrainerWiseSection: React.FC<{ data: MergedData[] }> = ({ data }) => {
    const [expandedTrainer, setExpandedTrainer] = useState<string | null>(null);

    const trainerData = useMemo(() => {
      const trainers = new Map<string, { 
        trainer: string;
        employees: Set<string>;
        totalCourses: number;
        completedCourses: number;
        stores: Set<string>;
      }>();

      data.forEach(item => {
        const trainer = item.Trainer || 'Unknown';
        if (trainer === 'TBD') return;
        
        if (!trainers.has(trainer)) {
          trainers.set(trainer, {
            trainer,
            employees: new Set(),
            totalCourses: 0,
            completedCourses: 0,
            stores: new Set()
          });
        }
        
        const trainerInfo = trainers.get(trainer)!;
        trainerInfo.employees.add(item.employee_code);
        trainerInfo.totalCourses++;
        if (item.location) {
          trainerInfo.stores.add(item.location);
        }
        if (item.course_completion_status === 'Completed') {
          trainerInfo.completedCourses++;
        }
      });

      return Array.from(trainers.values())
        .map(trainer => ({
          ...trainer,
          employeeCount: trainer.employees.size,
          completionRate: trainer.totalCourses > 0 
            ? Math.round((trainer.completedCourses / trainer.totalCourses) * 100)
            : 0,
          storeCount: trainer.stores.size
        }))
        .sort((a, b) => b.completionRate - a.completionRate);
    }, [data]);

    const toggleTrainer = (trainerName: string) => {
      setExpandedTrainer(expandedTrainer === trainerName ? null : trainerName);
    };

    return (
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Trainer-wise Performance
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {trainerData.length} trainers • Click to expand details
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {trainerData.map((trainer, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleTrainer(trainer.trainer)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                    trainer.completionRate >= 80 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                    trainer.completionRate >= 60 ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                    'bg-gradient-to-br from-red-500 to-pink-600'
                  }`}>
                    {(trainerNames[trainer.trainer] || trainer.trainer).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{trainerNames[trainer.trainer] || trainer.trainer}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {trainer.employeeCount} employees • {trainer.storeCount} store{trainer.storeCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-2 text-lg font-bold rounded-full ${
                      trainer.completionRate >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      trainer.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {trainer.completionRate}%
                    </span>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedTrainer === trainer.trainer ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>
              
              {expandedTrainer === trainer.trainer && (
                <div className="p-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{trainer.employeeCount}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Employees</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{trainer.totalCourses}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Total Courses</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{trainer.completedCourses}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{trainer.storeCount}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Stores</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 px-1 sm:px-2 lg:px-0">
      {/* Header with Updated Timestamp */}
      <div className="flex items-center justify-between bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Training completion analytics and insights
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Updated on:
          </p>
          <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
            {lastModified ? (
              lastModified.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            ) : (
              new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            )}
          </p>
        </div>
      </div>

      {/* Multi-Select Filter Bar - Enhanced Mobile with Collapse */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-slate-200/50 dark:border-slate-700/50 overflow-visible relative shadow-sm" style={{ zIndex: 50 }}>
        {/* Filter Header - Mobile Friendly with Toggle */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <button 
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className="flex items-center gap-2 lg:cursor-default touch-manipulation active:scale-95 lg:active:scale-100"
          >
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              <span className="hidden sm:inline">Filters</span>
              <span className="sm:hidden">Filters</span>
            </h3>
            <svg 
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 lg:hidden ${isFiltersExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full max-w-[120px] sm:max-w-[180px] lg:max-w-none truncate">
            {getActiveFiltersText()}
          </span>
        </div>

        {/* Filters Grid - Collapsible on Mobile */}
        <div 
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 transition-all duration-300 ${isFiltersExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-[2000px] lg:opacity-100'}`} 
          style={{ overflow: typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'visible' : (isFiltersExpanded ? 'visible' : 'hidden') }}
        >
          {/* Tenure Filter */}
          <div className="w-full">
            <MultiSelectFilter
              title="Employee Tenure"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              options={['1-4 days', '5-15 days', '16-30 days', 'over a month']}
              selectedValues={selectedTenure}
              onSelectionChange={setSelectedTenure}
              searchValue=""
              onSearchChange={() => {}}
              placeholder="Search tenure..."
              showCount={true}
              data={data}
              filterKey="tenure"
            />
          </div>

          {/* Store Filter */}
          {isMerged && (
            <div className="w-full">
              <MultiSelectFilter
                title="Store"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
                options={uniqueStores}
                selectedValues={selectedStore}
                onSelectionChange={setSelectedStore}
                searchValue={storeSearch}
                onSearchChange={setStoreSearch}
                placeholder="Search stores..."
                showCount={true}
                data={data}
                filterKey="location"
                isMerged={isMerged}
              />
            </div>
          )}

          {/* Area Manager Filter */}
          {isMerged && (
            <div className="w-full">
              <MultiSelectFilter
                title="Area Manager"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                options={uniqueAreaManagers}
                selectedValues={selectedAreaManager}
                onSelectionChange={setSelectedAreaManager}
                searchValue={areaManagerSearch}
                onSearchChange={setAreaManagerSearch}
                placeholder="Search area managers..."
                showCount={true}
                data={data}
                filterKey="AM"
                isMerged={isMerged}
              />
            </div>
          )}

          {/* Trainer Filter */}
          {isMerged && (
            <div className="w-full">
              <MultiSelectFilter
                title="Trainer"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
                options={uniqueTrainers}
                selectedValues={selectedTrainer}
                onSelectionChange={setSelectedTrainer}
                searchValue={trainerSearch}
                onSearchChange={setTrainerSearch}
                placeholder="Search trainers..."
                showCount={true}
                data={data}
                filterKey="Trainer"
                isMerged={isMerged}
              />
            </div>
          )}

          {/* Course Filter */}
          <div className="w-full">
            <MultiSelectFilter
              title="Course"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              options={uniqueCourses}
              selectedValues={selectedCourse}
              onSelectionChange={setSelectedCourse}
              searchValue={courseSearch}
              onSearchChange={setCourseSearch}
              placeholder="Search courses..."
              showCount={true}
              data={data}
              filterKey="course_name"
              isMerged={isMerged}
            />
          </div>

          {/* Designation Filter */}
          <div className="w-full">
            <MultiSelectFilter
              title="Designation"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              options={uniqueDesignations}
              selectedValues={selectedDesignation}
              onSelectionChange={setSelectedDesignation}
              searchValue={designationSearch}
              onSearchChange={setDesignationSearch}
              placeholder="Search designations..."
              showCount={true}
              data={data}
              filterKey="designation"
              isMerged={isMerged}
            />
          </div>
        </div>

        {/* Clear All Filters Button - Mobile Enhanced */}
        {(selectedTenure.length > 0 || selectedStore.length > 0 || selectedAreaManager.length > 0 || selectedTrainer.length > 0 || selectedCourse.length > 0 || selectedDesignation.length > 0) && (
          <div className="flex justify-center mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setSelectedTenure([]);
                setSelectedStore([]);
                setSelectedAreaManager([]);
                setSelectedTrainer([]);
                setSelectedCourse([]);
                setSelectedDesignation([]);
                setStoreSearch('');
                setAreaManagerSearch('');
                setTrainerSearch('');
                setCourseSearch('');
                setDesignationSearch('');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg sm:rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden sm:inline">Clear All Filters</span>
              <span className="sm:hidden">Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* File Info Banner */}
      {!isMerged && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-6 rounded-lg shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Enhanced Analytics Available</h3>
              <p className="text-sm leading-relaxed">Include a 'Store ID' column in your CSV to access detailed regional analysis, trainer performance metrics, and area manager insights.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid - Enhanced Mobile Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 px-1 sm:px-0">
        {/* Total Employees Card */}
        <div 
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-blue-200/50 dark:border-blue-800/50"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 sm:mb-3 lg:mb-4 p-1.5 sm:p-2 lg:p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-md sm:rounded-lg lg:rounded-xl">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">{totalEmployees}</p>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 leading-tight">Total<br className="sm:hidden" /><span className="hidden sm:inline"> </span>Employees</p>
          </div>
        </div>

        {/* High Performers Card */}
        <div 
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-green-200/50 dark:border-green-800/50"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 sm:mb-3 lg:mb-4 p-1.5 sm:p-2 lg:p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-md sm:rounded-lg lg:rounded-xl">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">{highPerformers.length}</p>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">High<br className="sm:hidden" /><span className="hidden sm:inline"> </span>Performers<br className="hidden sm:block" /><span className="hidden sm:inline">(≥80%)</span></p>
          </div>
        </div>

        {/* Average Performers Card */}
        <div 
          className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-yellow-200/50 dark:border-yellow-800/50"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 sm:mb-3 lg:mb-4 p-1.5 sm:p-2 lg:p-3 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-md sm:rounded-lg lg:rounded-xl">
              {(() => {
                const avg = Number(getAverageCompletion(averagePerformers));
                if (avg >= 80) {
                  return (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="9" cy="10" r="1" fill="currentColor" />
                      <circle cx="15" cy="10" r="1" fill="currentColor" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15c1.333 1 2.667 1 4 0" />
                    </svg>
                  );
                }
                if (avg >= 60) {
                  return (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="9" cy="10" r="1" fill="currentColor" />
                      <circle cx="15" cy="10" r="1" fill="currentColor" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15h8" />
                    </svg>
                  );
                }
                return (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="9" cy="10" r="1" fill="currentColor" />
                    <circle cx="15" cy="10" r="1" fill="currentColor" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15c-1.333-1-2.667-1-4 0" />
                  </svg>
                );
              })()}
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">{averagePerformers.length}</p>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">Average<br className="sm:hidden" /><span className="hidden sm:inline"> </span>Performers<br className="hidden sm:block" /><span className="hidden sm:inline">(60-79%)</span></p>
          </div>
        </div>

        {/* Needs Attention Card */}
        <div 
          className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-red-200/50 dark:border-red-800/50"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 sm:mb-3 lg:mb-4 p-1.5 sm:p-2 lg:p-3 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-md sm:rounded-lg lg:rounded-xl">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">{needsAttention.length}</p>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">Needs<br className="sm:hidden" /><span className="hidden sm:inline"> </span>Attention<br className="hidden sm:block" /><span className="hidden sm:inline">(&lt;60%)</span></p>
          </div>
        </div>
      </div>

      {/* Download CSV Button */}
      <div className="flex justify-center px-1 sm:px-0">
        <button
          onClick={downloadEmployeeCSV}
          className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 touch-manipulation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Download Employee Dashboard CSV</span>
        </button>
      </div>

      {/* Tenure Analysis Charts - Mobile Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <TenureDistributionChart data={filteredData} />
        </div>
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <TenureCompletionChart data={filteredData} />
        </div>
      </div>

      {/* Secondary Charts for Merged Data - Mobile Optimized */}
      {isMerged && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <RegionCompletionChart data={filteredData as MergedData[]} />
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <TrainerCompletionChart data={filteredData as MergedData[]} trainerNames={trainerNames} />
          </div>
          <div className="lg:col-span-2 xl:col-span-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <AreaManagerCompletionChart data={filteredData as MergedData[]} areaManagerNames={areaManagerNames} />
          </div>
        </div>
      )}

      {/* Course Analysis Charts - Mobile Enhanced */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
        <CourseCompletionChart data={filteredData} />
      </div>
      
      {/* Designation Analysis Charts - Mobile Enhanced */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
        <DesignationCompletionChart data={filteredData} />
      </div>
      
      {isMerged && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <StoreCompletionChart data={filteredData as MergedData[]} />
        </div>
      )}

      {/* Store-wise Segregation Section */}
      {isMerged && <StoreWiseSection data={filteredData as MergedData[]} />}

      {/* Trainer-wise Segregation Section */}
      {isMerged && <TrainerWiseSection data={filteredData as MergedData[]} />}
    </div>
  );
};

export default Dashboard;
