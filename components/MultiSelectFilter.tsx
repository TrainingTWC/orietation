import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectFilterProps {
  title: string;
  icon: React.ReactNode;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  showCount?: boolean;
  data?: any[];
  filterKey?: string;
  isMerged?: boolean;
}

export default function MultiSelectFilter({
  title,
  icon,
  options,
  selectedValues,
  onSelectionChange,
  searchValue,
  onSearchChange,
  placeholder,
  showCount = false,
  data = [],
  filterKey = '',
  isMerged = false
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOptionToggle = (option: string) => {
    if (selectedValues.includes(option)) {
      onSelectionChange(selectedValues.filter(v => v !== option));
    } else {
      onSelectionChange([...selectedValues, option]);
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...options]);
    }
  };

  const getItemCount = (option: string) => {
    if (!showCount || !data || !filterKey) return 0;
    return data.filter(item => {
      const value = filterKey === 'location' && isMerged ? item.location :
                   filterKey === 'AM' && isMerged ? item.AM :
                   filterKey === 'Trainer' && isMerged ? item.Trainer :
                   item[filterKey];
      return (value || 'Unknown') === option;
    }).length;
  };

  const displayText = selectedValues.length === 0 ? 'All' : 
                     selectedValues.length === 1 ? selectedValues[0] :
                     `${selectedValues.length} selected`;

  const dropdown = isOpen && (
    <div
      ref={dropdownRef}
      className="absolute bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl shadow-2xl max-h-60 sm:max-h-80 overflow-hidden flex flex-col"
      style={{
        top: '100%',
        left: 0,
        right: 0,
        marginTop: '2px',
        zIndex: 9999,
        minWidth: '200px'
      }}
    >
      {/* Search input - Mobile Optimized */}
      <div className="p-2 sm:p-3 border-b border-slate-200 dark:border-slate-700">
        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md sm:rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          autoFocus
        />
      </div>

      {/* Select All option */}
      {options.length > 0 && (
        <div className="p-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={handleSelectAll}
            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 flex items-center justify-between"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedValues.length === options.length}
                onChange={() => {}}
                className="mr-3 h-4 w-4 text-brand-primary border-slate-300 rounded focus:ring-brand-primary"
              />
              <span className="font-medium text-slate-900 dark:text-white">
                {selectedValues.length === options.length ? 'Deselect All' : 'Select All'}
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({options.length})
            </span>
          </button>
        </div>
      )}

      {/* Options list */}
      <div className="flex-1 overflow-y-auto">
        {options.length === 0 ? (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
            No options found
          </div>
        ) : (
          options.map((option) => (
            <button
              key={option}
              onClick={() => handleOptionToggle(option)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 flex items-center justify-between"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => {}}
                  className="mr-3 h-4 w-4 text-brand-primary border-slate-300 rounded focus:ring-brand-primary"
                />
                <span className="text-slate-900 dark:text-white">{option}</span>
              </div>
              {showCount && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({getItemCount(option)})
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full inline-flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 text-sm font-medium rounded-lg sm:rounded-xl transition-all duration-200 border ${
          selectedValues.length > 0
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg hover:bg-indigo-700'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-md hover:shadow-lg'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-4 h-4 text-current flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <span className="text-xs sm:text-sm font-medium truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            selectedValues.length > 0
              ? 'bg-white/20 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
          }`}>
            {displayText}
          </span>
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {dropdown}
    </div>
  );
}