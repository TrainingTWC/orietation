import React, { useState } from 'react';

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  options: string[];
  selectedValue: string;
  onSelectionChange: (value: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  showCount?: boolean;
  data?: any[];
  filterKey?: string;
  isMerged?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  icon,
  options,
  selectedValue,
  onSelectionChange,
  searchValue,
  onSearchChange,
  placeholder = "Search...",
  showCount = false,
  data = [],
  filterKey = "",
  isMerged = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getItemCount = (option: string) => {
    if (!showCount || !data || !filterKey) return 0;
    if (option === 'all') return data.length;
    
    // Special handling for tenure filter
    if (filterKey === 'tenure') {
      const calculateTenure = (dateOfJoining: string): string => {
        const joinDate = new Date(dateOfJoining);
        const currentDate = new Date();
        const daysDiff = Math.floor((currentDate.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 4) return '1-4 days';
        if (daysDiff <= 15) return '5-15 days';
        if (daysDiff <= 30) return '16-30 days';
        return 'over a month';
      };
      
      const uniqueEmployees = new Set();
      data.forEach(item => {
        const tenure = calculateTenure(item.date_of_joining);
        if (tenure === option) {
          uniqueEmployees.add(item.employee_code);
        }
      });
      return uniqueEmployees.size;
    }
    
    // Special handling for store mapping fields
    if (filterKey === 'store') {
      return data.filter(item => {
        const storeName = isMerged ? item.location : (item.Store_Name || 'Unknown');
        return storeName === option;
      }).length;
    }
    
    if (filterKey === 'areaManager') {
      return data.filter(item => {
        const areaManager = isMerged ? item.AM : (item.Area_Manager || 'Unknown');
        return areaManager === option;
      }).length;
    }
    
    if (filterKey === 'trainer') {
      return data.filter(item => {
        const trainer = isMerged ? item.Trainer : (item.trainer_name || 'Unknown');
        return trainer === option;
      }).length;
    }
    
    return data.filter(item => (item[filterKey] || 'Unknown') === option).length;
  };

  const displayOptions = options.slice(0, 20); // Limit display to 20 items

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-brand-primary/10 rounded-lg mr-3">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {selectedValue === 'all' ? 'All items selected' : `Selected: ${selectedValue}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <svg 
            className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          {/* All Option */}
          <button
            onClick={() => onSelectionChange('all')}
            className={`w-full text-left px-4 py-2 rounded-lg flex items-center justify-between transition-colors ${
              selectedValue === 'all'
                ? 'bg-brand-primary text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
            }`}
          >
            <span className="font-medium">All {title}</span>
            {showCount && (
              <span className={`px-2 py-1 rounded-full text-xs ${
                selectedValue === 'all' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
              }`}>
                {getItemCount('all')}
              </span>
            )}
          </button>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {displayOptions.map((option) => (
              <button
                key={option}
                onClick={() => onSelectionChange(option)}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center justify-between transition-colors ${
                  selectedValue === option
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
                }`}
              >
                <span className="truncate pr-2">{option}</span>
                {showCount && (
                  <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                    selectedValue === option 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                  }`}>
                    {getItemCount(option)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {options.length > 20 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              Showing first 20 results. Use search to find more.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterSection;