'use client';

import { useState, useRef, useEffect } from 'react';
import { useMcFilter } from '@/lib/contexts/McFilterContext';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function McSelectCombobox() {
  const {
    selectedMcId,
    selectedMc,
    mcOptions,
    isLoading,
    setSelectedMc,
  } = useMcFilter();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const comboboxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Filter options based on search
  const filteredOptions = mcOptions.filter((option) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      option.name.toLowerCase().includes(query) ||
      option.mcNumber.toLowerCase().includes(query)
    );
  });

  // Handle option selection - INSTANT, no refetch
  const handleSelect = (mcId: string | null) => {
    // Update immediately - filtering happens client-side, instant!
    setSelectedMc(mcId);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Get display text
  const displayText = selectedMc
    ? selectedMc.name
    : 'All Companies';

  // Extract MC number from name for display
  const getMcNumberFromName = (name: string) => {
    const match = name.match(/\(MC\s+([^)]+)\)/);
    return match ? match[1] : '';
  };

  const getCompanyName = (name: string) => {
    return name.replace(/\s*\(MC\s+[^)]+\)\s*$/, '').trim();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2 px-3 border border-slate-700 dark:border-border rounded-md bg-slate-900 dark:bg-background">
        <div className="text-sm text-slate-400 dark:text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div ref={comboboxRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2',
          'border border-slate-700 dark:border-border rounded-md',
          'bg-slate-900 dark:bg-background',
          'text-slate-200 dark:text-foreground',
          'hover:bg-slate-800 dark:hover:bg-accent',
          'transition-colors',
          'text-sm font-medium'
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Building2 className="h-4 w-4 flex-shrink-0 text-slate-400 dark:text-muted-foreground" />
          <span className="truncate text-left">{displayText}</span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 flex-shrink-0 text-slate-400 dark:text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1',
            'border border-slate-700 dark:border-border rounded-md',
            'bg-slate-900 dark:bg-popover',
            'shadow-lg',
            'max-h-[23rem] overflow-hidden flex flex-col'
          )}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-slate-700 dark:border-border">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search MC numbers..."
              className={cn(
                'w-full px-3 py-2 text-sm',
                'border border-slate-700 dark:border-border rounded-md',
                'bg-slate-800 dark:bg-background',
                'text-slate-200 dark:text-foreground',
                'placeholder:text-slate-500 dark:placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
            />
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            className="overflow-y-auto max-h-[20rem]"
            role="listbox"
          >
            {/* "All Companies" Option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2.5',
                'text-left transition-colors',
                'hover:bg-slate-800 dark:hover:bg-accent',
                selectedMcId === null && 'bg-blue-600/20 dark:bg-blue-500/20'
              )}
              role="option"
            >
              <Building2 className="h-4 w-4 flex-shrink-0 text-slate-400 dark:text-muted-foreground" />
              <span
                className={cn(
                  'text-sm flex-1',
                  selectedMcId === null
                    ? 'text-white dark:text-foreground font-semibold'
                    : 'text-slate-200 dark:text-popover-foreground'
                )}
              >
                All Companies
              </span>
              {selectedMcId === null && (
                <Check className="h-4 w-4 flex-shrink-0 text-blue-400" />
              )}
            </button>

            {/* MC Number Options */}
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate-400 dark:text-muted-foreground">
                No MC numbers found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedMcId === option.id;
                const mcNumberDisplay = getMcNumberFromName(option.name) || option.mcNumber;
                const companyName = getCompanyName(option.name) || option.name;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2.5',
                      'text-left transition-colors',
                      'hover:bg-slate-800 dark:hover:bg-accent',
                      isSelected && 'bg-blue-600/20 dark:bg-blue-500/20'
                    )}
                    role="option"
                  >
                    <Building2
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isSelected
                          ? 'text-blue-400'
                          : 'text-slate-400 dark:text-muted-foreground'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          'text-sm font-medium truncate',
                          isSelected
                            ? 'text-white dark:text-foreground'
                            : 'text-slate-200 dark:text-popover-foreground'
                        )}
                      >
                        {companyName}
                      </div>
                      {mcNumberDisplay && (
                        <div className="text-xs text-slate-400 dark:text-muted-foreground mt-0.5">
                          MC {mcNumberDisplay}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 flex-shrink-0 text-blue-400" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

