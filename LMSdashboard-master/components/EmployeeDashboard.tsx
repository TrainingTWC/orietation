import React, { useState, useMemo } from 'react';
import type { EmployeeTrainingRecord, MergedData } from '../types';
import { storeMappingData } from '../data/storeMapping';
import MultiSelectFilter from './MultiSelectFilter';
import StoreWiseView from './StoreWiseView';

interface EmployeeDashboardProps {
  data: (EmployeeTrainingRecord | MergedData)[];
  fileName: string;
  isMerged: boolean;
  trainerNames?: Record<string, string>;
  lastModified?: Date | null;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ data, fileName, isMerged, trainerNames = {}, lastModified = null }) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'employee' | 'store'>('employee');
  
  // Create reverse mapping from name to ID for filtering
  const trainerIdsByName = useMemo(() => {
    const reverseMap: Record<string, string> = {};
    Object.entries(trainerNames).forEach(([id, name]) => {
      reverseMap[name] = id;
    });
    return reverseMap;
  }, [trainerNames]);

  // Multi-select filter states
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedAreaManagers, setSelectedAreaManagers] = useState<string[]>([]);
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [selectedTenure, setSelectedTenure] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  
  // Filter collapse state for mobile
  const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(false);
  
  // Search states
  const [storeSearch, setStoreSearch] = useState<string>('');
  const [areaManagerSearch, setAreaManagerSearch] = useState<string>('');
  const [trainerSearch, setTrainerSearch] = useState<string>('');
  const [designationSearch, setDesignationSearch] = useState<string>('');
  const [courseSearch, setCourseSearch] = useState<string>('');
  
  const [searchEmployee, setSearchEmployee] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'completion' | 'designation'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal state for employee details
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Modal states for clickable stat cards
  const [isStatModalOpen, setIsStatModalOpen] = useState<boolean>(false);
  const [selectedStatType, setSelectedStatType] = useState<'total' | 'high' | 'average' | 'needs-attention' | null>(null);

  // Calculate tenure function
  const calculateTenure = (dateOfJoining: string): string => {
    const joinDate = new Date(dateOfJoining);
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 4) return '1-4 days';
    if (daysDiff <= 15) return '5-15 days';
    if (daysDiff <= 30) return '16-30 days';
    return 'over a month';
  };

  // Get unique values for filters
  const uniqueStores = useMemo(() => {
    if (!isMerged) return [];
    const stores = [...new Set(storeMappingData.map(store => store.location))].sort();
    return stores.filter(store => store.toLowerCase().includes(storeSearch.toLowerCase()));
  }, [isMerged, storeSearch]);

  const uniqueAreaManagers = useMemo(() => {
    if (!isMerged) return [];
    const managers = [...new Set(storeMappingData.map(store => store.AM).filter(am => am !== 'TBD'))].sort();
    return managers.filter(manager => manager.toLowerCase().includes(areaManagerSearch.toLowerCase()));
  }, [isMerged, areaManagerSearch]);

  const uniqueTrainers = useMemo(() => {
    if (!isMerged) return [];
    const trainers = [...new Set(storeMappingData.map(store => store.Trainer).filter(trainer => trainer !== 'TBD'))].sort();
    // Map trainer IDs to names for display
    const trainerNamesArray = trainers.map(trainerId => trainerNames[trainerId] || trainerId);
    return trainerNamesArray.filter(trainer => trainer.toLowerCase().includes(trainerSearch.toLowerCase()));
  }, [isMerged, trainerSearch, trainerNames]);

  const uniqueDesignations = useMemo(() => {
    const designations = [...new Set(data.map(item => item.designation || 'Unknown').filter(Boolean))].sort();
    return designations.filter(designation => (designation as string).toLowerCase().includes(designationSearch.toLowerCase()));
  }, [data, designationSearch]);

  const uniqueCourses = useMemo(() => {
    const courses = [...new Set(data.map(item => item.course_name || 'Unknown').filter(Boolean))].sort();
    return courses.filter(course => (course as string).toLowerCase().includes(courseSearch.toLowerCase()));
  }, [data, courseSearch]);

  // Process employee data with completion rates
  const employeeData = useMemo(() => {
    // Group data by employee
    const employeeMap = new Map();
    
    data.forEach(record => {
      const empCode = record.employee_code;
      
      if (!employeeMap.has(empCode)) {
        employeeMap.set(empCode, {
          employee_code: empCode,
          employee_name: record.employee_name || 'Unknown',
          designation: record.designation || 'Unknown',
          date_of_joining: record.date_of_joining,
          location: isMerged ? (record as MergedData).location : 'Unknown',
          trainer: isMerged ? (record as MergedData).Trainer : 'Unknown',
          areaManager: isMerged ? (record as MergedData).AM : 'Unknown',
          tenure: calculateTenure(record.date_of_joining),
          courses: [],
          totalCourses: 0,
          completedCourses: 0,
          completionRate: 0
        });
      }
      
      const emp = employeeMap.get(empCode);
      emp.courses.push({
        course_name: record.course_name || 'Unknown',
        completion_status: record.course_completion_status,
        enrollment_date: record.course_enrolment_date,
        completion_date: record.course_completion_date
      });
      emp.totalCourses++;
      if (record.course_completion_status === 'Completed') {
        emp.completedCourses++;
      }
      emp.completionRate = Math.round((emp.completedCourses / emp.totalCourses) * 100);
    });

    return Array.from(employeeMap.values());
  }, [data, isMerged]);

  // Filter and sort employees
  const filteredEmployees = useMemo(() => {
    let filtered = employeeData;

    // Filter by stores
    if (selectedStores.length > 0 && isMerged) {
      filtered = filtered.filter(emp => selectedStores.includes(emp.location));
    }

    // Filter by area managers
    if (selectedAreaManagers.length > 0 && isMerged) {
      filtered = filtered.filter(emp => selectedAreaManagers.includes(emp.areaManager));
    }

    // Filter by trainers
    if (selectedTrainers.length > 0 && isMerged) {
      // Convert selected trainer names to IDs for comparison
      const selectedTrainerIds = selectedTrainers.map(name => trainerIdsByName[name] || name);
      filtered = filtered.filter(emp => selectedTrainerIds.includes(emp.trainer));
    }

    // Filter by designations
    if (selectedDesignations.length > 0) {
      filtered = filtered.filter(emp => selectedDesignations.includes(emp.designation));
    }

    // Filter by tenure
    if (selectedTenure.length > 0) {
      filtered = filtered.filter(emp => selectedTenure.includes(emp.tenure));
    }

    // Filter by courses (employees who have taken any of the selected courses)
    if (selectedCourses.length > 0) {
      filtered = filtered.filter(emp => 
        emp.courses.some(course => selectedCourses.includes(course.course_name))
      );
    }

    // Filter by employee name search
    if (searchEmployee) {
      filtered = filtered.filter(emp => 
        emp.employee_name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
        emp.employee_code.toLowerCase().includes(searchEmployee.toLowerCase())
      );
    }

    // Sort employees
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = a.employee_name.toLowerCase();
          bVal = b.employee_name.toLowerCase();
          break;
        case 'completion':
          aVal = a.completionRate;
          bVal = b.completionRate;
          break;
        case 'designation':
          aVal = a.designation.toLowerCase();
          bVal = b.designation.toLowerCase();
          break;
        default:
          aVal = a.employee_name.toLowerCase();
          bVal = b.employee_name.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [employeeData, selectedStores, selectedAreaManagers, selectedTrainers, selectedDesignations, selectedTenure, selectedCourses, searchEmployee, sortBy, sortOrder, isMerged]);

  // Get completion status color
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
  };

  // Check if course is overdue
  const isCourseOverdue = (course: any) => {
    if (course.completion_status === 'Completed') return false;
    
    const courseEndDate = new Date(course.course_end_date);
    const currentDate = new Date();
    return courseEndDate < currentDate;
  };

  // Get course status with overdue info
  const getCourseStatus = (course: any) => {
    if (course.course_completion_status === 'Completed') {
      return { status: 'Completed', color: 'green', isOverdue: false };
    }
    
    // Check progress to determine if "Not Started" or "In Progress"
    let progress = 0;
    if (course.course_progress != null) {
      const progressValue = typeof course.course_progress === 'number' 
        ? course.course_progress 
        : parseFloat(String(course.course_progress));
      progress = !isNaN(progressValue) ? progressValue : 0;
    }
    
    // If progress is 0%, show "Not Started"
    if (progress === 0) {
      return { status: 'Not Started', color: 'red', isOverdue: false };
    }
    
    const isOverdue = isCourseOverdue(course);
    if (isOverdue) {
      return { status: 'Overdue', color: 'red', isOverdue: true };
    }
    
    return { status: 'In Progress', color: 'yellow', isOverdue: false };
  };

  // Handle employee click
  const handleEmployeeClick = (employee: any) => {
    // Get full course details for this employee
    const employeeCourses = data.filter(record => record.employee_code === employee.employee_code);
    
    const courseDetails = employeeCourses.map(record => {
      // Calculate correct progress based on completion status
      let calculatedProgress = 0;
      if (record.course_completion_status === 'Completed') {
        calculatedProgress = 100;
      } else if (record.course_progress != null) {
        const progressValue = typeof record.course_progress === 'number' 
          ? record.course_progress 
          : parseFloat(String(record.course_progress));
        calculatedProgress = !isNaN(progressValue) ? progressValue : 0;
      }
      // If no progress data and not completed, leave at 0

      return {
        course_name: record.course_name,
        course_category: record.course_category,
        course_type: record.course_type,
        enrollment_date: record.course_enrolment_date,
        completion_date: record.course_completion_date,
        course_end_date: record.course_end_date,
        completion_status: record.course_completion_status,
        progress: calculatedProgress,
        completion_hours: record.course_completion_hours,
        ...getCourseStatus(record)
      };
    });

    setSelectedEmployeeDetail({
      ...employee,
      courseDetails
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployeeDetail(null);
  };

  // Handle stat card clicks
  const handleStatCardClick = (statType: 'total' | 'high' | 'average' | 'needs-attention') => {
    setSelectedStatType(statType);
    setIsStatModalOpen(true);
  };

  const closeStatModal = () => {
    setIsStatModalOpen(false);
    setSelectedStatType(null);
  };

  // Helper function to safely calculate average completion rate
  const getAverageCompletion = (employees: any[]): string => {
    if (employees.length === 0) return '0';
    const sum = employees.reduce((acc, emp) => acc + (emp.completionRate || 0), 0);
    const average = Math.round(sum / employees.length);
    return isNaN(average) ? '0' : average.toString();
  };

  // Color variant helper for average completion
  const getRateVariant = (rate: number) => {
    if (rate >= 80) return { textClass: 'text-green-600 dark:text-green-400' };
    if (rate >= 60) return { textClass: 'text-yellow-600 dark:text-yellow-400' };
    return { textClass: 'text-red-600 dark:text-red-400' };
  };

  // Calculate performance groups
  const highPerformers = filteredEmployees.filter(emp => emp.completionRate >= 80);
  const averagePerformers = filteredEmployees.filter(emp => emp.completionRate >= 60 && emp.completionRate < 80);
  const needsAttention = filteredEmployees.filter(emp => emp.completionRate < 60);

  // Get active filters text
  const getActiveFiltersText = () => {
    const activeFilters: string[] = [];
    if (selectedStores.length > 0) {
      activeFilters.push(`Store: ${selectedStores.length === 1 ? selectedStores[0] : `${selectedStores.length} selected`}`);
    }
    if (selectedAreaManagers.length > 0) {
      activeFilters.push(`Area Manager: ${selectedAreaManagers.length === 1 ? selectedAreaManagers[0] : `${selectedAreaManagers.length} selected`}`);
    }
    if (selectedTrainers.length > 0) {
      activeFilters.push(`Trainer: ${selectedTrainers.length === 1 ? selectedTrainers[0] : `${selectedTrainers.length} selected`}`);
    }
    if (selectedDesignations.length > 0) {
      activeFilters.push(`Designation: ${selectedDesignations.length === 1 ? selectedDesignations[0] : `${selectedDesignations.length} selected`}`);
    }
    if (selectedTenure.length > 0) {
      activeFilters.push(`Tenure: ${selectedTenure.length === 1 ? selectedTenure[0] : `${selectedTenure.length} selected`}`);
    }
    if (selectedCourses.length > 0) {
      activeFilters.push(`Course: ${selectedCourses.length === 1 ? selectedCourses[0] : `${selectedCourses.length} selected`}`);
    }
    
    if (activeFilters.length === 0) return 'All Data';
    if (activeFilters.length === 1) return activeFilters[0];
    return `${activeFilters.length} Filters Applied`;
  };

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 px-1 sm:px-2 lg:px-0">
      {/* Header with Updated Timestamp */}
      <div className="flex items-center justify-between bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
            Employee Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Individual employee training progress and details
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

      {/* Tab Navigation */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('employee')}
            className={`flex-1 px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${
              activeTab === 'employee'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Employee View
            </span>
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`flex-1 px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${
              activeTab === 'store'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Store-wise View
            </span>
          </button>
        </div>
      </div>

      {/* Conditional Content Based on Active Tab */}
      {activeTab === 'employee' ? (
        <>
      {/* Multi-Select Filters - Collapsible */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-slate-200/50 dark:border-slate-700/50 overflow-visible relative shadow-sm" style={{ zIndex: 10 }}>
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
        <div className={`flex flex-wrap gap-4 items-start overflow-hidden transition-all duration-300 ${isFiltersExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-[2000px] lg:opacity-100'}`}>
        {/* Store Filter */}
        {isMerged && (
          <MultiSelectFilter
            title="Store"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            options={uniqueStores}
            selectedValues={selectedStores}
            onSelectionChange={setSelectedStores}
            searchValue={storeSearch}
            onSearchChange={setStoreSearch}
            placeholder="Search stores..."
            showCount={true}
            data={data}
            filterKey="location"
            isMerged={isMerged}
          />
        )}

        {/* Area Manager Filter */}
        {isMerged && (
          <MultiSelectFilter
            title="Area Manager"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            options={uniqueAreaManagers}
            selectedValues={selectedAreaManagers}
            onSelectionChange={setSelectedAreaManagers}
            searchValue={areaManagerSearch}
            onSearchChange={setAreaManagerSearch}
            placeholder="Search area managers..."
            showCount={true}
            data={data}
            filterKey="AM"
            isMerged={isMerged}
          />
        )}

        {/* Trainer Filter */}
        {isMerged && (
          <MultiSelectFilter
            title="Trainer"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            options={uniqueTrainers}
            selectedValues={selectedTrainers}
            onSelectionChange={setSelectedTrainers}
            searchValue={trainerSearch}
            onSearchChange={setTrainerSearch}
            placeholder="Search trainers..."
            showCount={true}
            data={data}
            filterKey="Trainer"
            isMerged={isMerged}
          />
        )}

        {/* Designation Filter */}
        <MultiSelectFilter
          title="Designation"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          options={uniqueDesignations}
          selectedValues={selectedDesignations}
          onSelectionChange={setSelectedDesignations}
          searchValue={designationSearch}
          onSearchChange={setDesignationSearch}
          placeholder="Search designations..."
          showCount={true}
          data={data}
          filterKey="designation"
          isMerged={isMerged}
        />

        {/* Tenure Filter */}
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
          isMerged={isMerged}
        />

        {/* Clear All Filters Button */}
        {(selectedStores.length > 0 || selectedAreaManagers.length > 0 || selectedTrainers.length > 0 || selectedDesignations.length > 0 || selectedTenure.length > 0 || selectedCourses.length > 0) && (
          <button
            onClick={() => {
              setSelectedStores([]);
              setSelectedAreaManagers([]);
              setSelectedTrainers([]);
              setSelectedDesignations([]);
              setSelectedTenure([]);
              setSelectedCourses([]);
              setStoreSearch('');
              setAreaManagerSearch('');
              setTrainerSearch('');
              setDesignationSearch('');
              setCourseSearch('');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear All Filters
          </button>
        )}
        </div>
      </div>

      {/* Search and Sort Section - Mobile Optimized */}
      <div className="flex flex-wrap gap-3 sm:gap-4 items-center bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200/30 dark:border-slate-700/30">
        {/* Search Employee */}
        <div className="flex-1 min-w-full sm:min-w-[250px]">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
            Search Employee
          </label>
          <input
            type="text"
            value={searchEmployee}
            onChange={(e) => setSearchEmployee(e.target.value)}
            placeholder="Search by name or employee code..."
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'completion' | 'designation')}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="name">Name</option>
              <option value="completion">Completion Rate</option>
              <option value="designation">Designation</option>
            </select>
          </div>
          <div className="flex-1 sm:flex-initial">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats - Clickable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees Card */}
        <div 
          onClick={() => handleStatCardClick('total')}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl shadow-xl border border-blue-200/50 dark:border-blue-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl group-hover:from-blue-500/20 group-hover:to-indigo-500/20 transition-all duration-300">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{filteredEmployees.length}</p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Employees</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Click for details →</p>
          </div>
        </div>

        {/* High Performers Card */}
        <div 
          onClick={() => handleStatCardClick('high')}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl shadow-xl border border-green-200/50 dark:border-green-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl group-hover:from-green-500/20 group-hover:to-emerald-500/20 transition-all duration-300">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{highPerformers.length}</p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Performers (≥80%)</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Click for details →</p>
          </div>
        </div>

        {/* Average Performers Card */}
        <div 
          onClick={() => handleStatCardClick('average')}
          className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-2xl shadow-xl border border-yellow-200/50 dark:border-yellow-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
        >
          <div className="flex flex-col items-center text-center">
                <div className="mb-4 p-3 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl group-hover:from-yellow-500/20 group-hover:to-orange-500/20 transition-all duration-300">
                  {(() => {
                    const avg = Number(getAverageCompletion(averagePerformers));
                    if (avg >= 80) {
                      return (
                        <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="9" cy="10" r="1" fill="currentColor" />
                          <circle cx="15" cy="10" r="1" fill="currentColor" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15c1.333 1 2.667 1 4 0" />
                        </svg>
                      );
                    }
                    if (avg >= 60) {
                      return (
                        <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="9" cy="10" r="1" fill="currentColor" />
                          <circle cx="15" cy="10" r="1" fill="currentColor" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15h8" />
                        </svg>
                      );
                    }
                    return (
                      <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="9" cy="10" r="1" fill="currentColor" />
                        <circle cx="15" cy="10" r="1" fill="currentColor" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15c-1.333-1-2.667-1-4 0" />
                      </svg>
                    );
                  })()}
                </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{averagePerformers.length}</p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Performers (60-79%)</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Click for details →</p>
          </div>
        </div>

        {/* Needs Attention Card */}
        <div 
          onClick={() => handleStatCardClick('needs-attention')}
          className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-6 rounded-2xl shadow-xl border border-red-200/50 dark:border-red-800/50 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-3 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-xl group-hover:from-red-500/20 group-hover:to-pink-500/20 transition-all duration-300">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{needsAttention.length}</p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Needs Attention (&lt;60%)</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Click for details →</p>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Employee Details</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">Employee</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">Designation</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">Tenure</th>
                {isMerged && <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">Store</th>}
                {isMerged && <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">Trainer</th>}
                <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">Courses</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">Completion</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee, index) => (
                <tr 
                  key={employee.employee_code} 
                  onClick={() => handleEmployeeClick(employee)}
                  className={`border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors duration-200 ${index % 2 === 0 ? 'bg-gray-50/50 dark:bg-slate-700/30' : ''}`}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{employee.employee_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{employee.employee_code}</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-900 dark:text-white">{employee.designation}</td>
                  <td className="py-3 px-2">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      {employee.tenure}
                    </span>
                  </td>
                  {isMerged && <td className="py-3 px-2 text-gray-900 dark:text-white">{employee.location}</td>}
                  {isMerged && <td className="py-3 px-2 text-gray-900 dark:text-white">{trainerNames[employee.trainer] || employee.trainer}</td>}
                  <td className="py-3 px-2 text-center">
                    <div className="text-gray-900 dark:text-white">{employee.completedCourses}/{employee.totalCourses}</div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getCompletionColor(employee.completionRate)}`}>
                      {employee.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No employees found matching the current filters.
          </div>
        )}
      </div>

      {/* Stat Card Detail Modal */}
      {isStatModalOpen && selectedStatType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedStatType === 'total' && 'All Employees'}
                    {selectedStatType === 'high' && 'High Performers (≥80% Completion)'}
                    {selectedStatType === 'average' && 'Average Performers (60-79% Completion)'}
                    {selectedStatType === 'needs-attention' && 'Needs Attention (&lt;60% Completion)'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedStatType === 'total' && `${filteredEmployees.length} total employees`}
                    {selectedStatType === 'high' && `${highPerformers.length} high performing employees`}
                    {selectedStatType === 'average' && `${averagePerformers.length} average performing employees`}
                    {selectedStatType === 'needs-attention' && `${needsAttention.length} employees requiring attention`}
                  </p>
                </div>
                <button
                  onClick={closeStatModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-xl ${
                  selectedStatType === 'high' ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' :
                  selectedStatType === 'average' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20' :
                  selectedStatType === 'needs-attention' ? 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20' :
                  'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
                }`}>
                  <div className={`text-2xl font-bold ${
                    selectedStatType === 'high' ? 'text-green-600 dark:text-green-400' :
                    selectedStatType === 'average' ? 'text-yellow-600 dark:text-yellow-400' :
                    selectedStatType === 'needs-attention' ? 'text-red-600 dark:text-red-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {selectedStatType === 'total' && filteredEmployees.length}
                    {selectedStatType === 'high' && highPerformers.length}
                    {selectedStatType === 'average' && averagePerformers.length}
                    {selectedStatType === 'needs-attention' && needsAttention.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Count</div>
                </div>
                
                <div className={`p-4 rounded-xl`}>
                  <div className={`text-2xl font-bold ${getRateVariant(Number(
                    selectedStatType === 'total' ? getAverageCompletion(filteredEmployees) :
                    selectedStatType === 'high' ? getAverageCompletion(highPerformers) :
                    selectedStatType === 'average' ? getAverageCompletion(averagePerformers) :
                    getAverageCompletion(needsAttention)
                  )).textClass}`}>
                    {selectedStatType === 'total' && `${getAverageCompletion(filteredEmployees)}%`}
                    {selectedStatType === 'high' && `${getAverageCompletion(highPerformers)}%`}
                    {selectedStatType === 'average' && `${getAverageCompletion(averagePerformers)}%`}
                    {selectedStatType === 'needs-attention' && `${getAverageCompletion(needsAttention)}%`}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Average Completion</div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedStatType === 'total' && filteredEmployees.reduce((sum, emp) => sum + emp.totalCourses, 0)}
                    {selectedStatType === 'high' && highPerformers.reduce((sum, emp) => sum + emp.totalCourses, 0)}
                    {selectedStatType === 'average' && averagePerformers.reduce((sum, emp) => sum + emp.totalCourses, 0)}
                    {selectedStatType === 'needs-attention' && needsAttention.reduce((sum, emp) => sum + emp.totalCourses, 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Courses</div>
                </div>
              </div>

              {/* Employee List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(selectedStatType === 'total' ? filteredEmployees :
                  selectedStatType === 'high' ? highPerformers :
                  selectedStatType === 'average' ? averagePerformers :
                  needsAttention
                ).map((employee, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{employee.employee_name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {employee.employee_code} • {employee.designation}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                          employee.completionRate >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          employee.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {employee.completionRate}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Total Courses:</span>
                        <div className="text-gray-600 dark:text-gray-400">{employee.totalCourses}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Completed:</span>
                        <div className="text-gray-600 dark:text-gray-400">{employee.completedCourses}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Progress:</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                employee.completionRate >= 80 ? 'bg-green-500' :
                                employee.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${employee.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location and Training Info */}
                    {isMerged && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Store:</span>
                            <div className="text-gray-600 dark:text-gray-400">{employee.location}</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Area Manager:</span>
                            <div className="text-gray-600 dark:text-gray-400">{employee.areaManager}</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Trainer:</span>
                            <div className="text-gray-600 dark:text-gray-400">{trainerNames[employee.trainer] || employee.trainer}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Course List Preview */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                          View Courses ({employee.courses.length})
                        </summary>
                        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                          {employee.courses.map((course, courseIndex) => (
                            <div key={courseIndex} className="text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{course.course_name}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  course.completion_status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                }`}>
                                  {course.completion_status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {isModalOpen && selectedEmployeeDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedEmployeeDetail.employee_name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedEmployeeDetail.employee_code} • {selectedEmployeeDetail.designation}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Employee Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {selectedEmployeeDetail.completionRate}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Overall Completion</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {selectedEmployeeDetail.completedCourses}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Courses Completed</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {selectedEmployeeDetail.tenure}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tenure</div>
                </div>
              </div>

              {/* Employee Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Employee Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Employee Code:</span> {selectedEmployeeDetail.employee_code}</div>
                    <div><span className="font-medium">Designation:</span> {selectedEmployeeDetail.designation}</div>
                    <div><span className="font-medium">Tenure:</span> {selectedEmployeeDetail.tenure}</div>
                    <div><span className="font-medium">Date of Joining:</span> {new Date(selectedEmployeeDetail.date_of_joining).toLocaleDateString()}</div>
                  </div>
                </div>
                
                {isMerged && (
                  <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-xl">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Location & Training</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Store Location:</span> {selectedEmployeeDetail.location}</div>
                      <div><span className="font-medium">Area Manager:</span> {selectedEmployeeDetail.areaManager}</div>
                      <div><span className="font-medium">Trainer:</span> {trainerNames[selectedEmployeeDetail.trainer] || selectedEmployeeDetail.trainer}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Course Details */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Course Details</h3>
                <div className="space-y-3">
                  {selectedEmployeeDetail.courseDetails.map((course: any, index: number) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{course.course_name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {course.course_category} • {course.course_type}
                          </p>
                        </div>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                          course.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          course.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {course.status}
                          {course.isOverdue && ' ⚠️'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Enrollment Date:</span>
                          <div className="text-gray-600 dark:text-gray-400">
                            {course.enrollment_date ? new Date(course.enrollment_date).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {course.completion_status === 'Completed' ? 'Completion Date:' : 'Due Date:'}
                          </span>
                          <div className="text-gray-600 dark:text-gray-400">
                            {course.completion_status === 'Completed' 
                              ? (course.completion_date ? new Date(course.completion_date).toLocaleDateString() : 'Invalid Date')
                              : (course.course_end_date && course.course_end_date !== 'Invalid Date' ? new Date(course.course_end_date).toLocaleDateString() : 'Invalid Date')
                            }
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Progress:</span>
                          <div className="flex items-center gap-2">
                            <div className="text-gray-600 dark:text-gray-400 min-w-[45px]">
                              {Math.round(course.progress || 0)}%
                            </div>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  course.completion_status === 'Completed' || (course.progress || 0) === 100 ? 'bg-green-500' :
                                  (course.progress || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, course.progress || 0))}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {course.isOverdue && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="text-red-700 dark:text-red-400 text-sm font-medium">
                              This course is overdue and requires immediate attention
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        /* Store-wise View */
        <StoreWiseView data={data as MergedData[]} trainerNames={trainerNames} />
      )}
    </div>
  );
};

export default EmployeeDashboard;