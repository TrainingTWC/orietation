import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CompactFilterProps {
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

const CompactFilter: React.FC<CompactFilterProps> = ({
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

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
  const displayValue = selectedValue === 'all' ? 'All items selected' : selectedValue;

  return (
    <div className="relative z-50" style={{ zIndex: isOpen ? 9999 : 'auto' }}>
      {/* Compact Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-xl transition-all duration-300 shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl group min-w-[200px]"
      >
        <div className="flex items-center flex-1 min-w-0">
          <div className="p-1 bg-brand-primary/10 rounded-lg mr-3 flex-shrink-0">
            <div className="w-4 h-4 text-brand-primary flex items-center justify-center">
              {icon}
            </div>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
              {title}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {displayValue}
            </div>
          </div>
        </div>
        <svg 
          className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel - Rendered as Portal */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          style={{ 
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 99999,
            minWidth: '200px'
          }}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {/* All Option */}
            <button
              onClick={() => {
                onSelectionChange('all');
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${
                selectedValue === 'all'
                  ? 'bg-brand-primary text-white'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
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

            {/* Individual Options */}
            {displayOptions.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onSelectionChange(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${
                  selectedValue === option
                    ? 'bg-brand-primary text-white'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
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
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 text-center">
              Showing first 20 results. Use search to find more.
            </div>
          )}
        </div>
        , document.body
      )}
    </div>
  );
};

export default CompactFilter;