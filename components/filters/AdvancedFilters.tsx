'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface FilterOption {
  field: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: Array<{ value: string; label: string }>;
}

interface AdvancedFiltersProps {
  filters: FilterOption[];
  onApply: (filters: Record<string, any>) => void;
  onClear: () => void;
  initialValues?: Record<string, any>;
}

export default function AdvancedFilters({
  filters,
  onApply,
  onClear,
  initialValues = {},
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [activeCount, setActiveCount] = useState(
    Object.keys(initialValues).filter((key) => initialValues[key] !== '' && initialValues[key] !== null).length
  );

  const handleChange = (field: string, value: any) => {
    const newValues = { ...values };
    // If value is empty string or 'all', remove it from values
    if (value === '' || value === 'all' || value === null || value === undefined) {
      delete newValues[field];
    } else {
      newValues[field] = value;
    }
    setValues(newValues);
    const active = Object.keys(newValues).filter(
      (key) => newValues[key] !== '' && newValues[key] !== null && newValues[key] !== undefined
    ).length;
    setActiveCount(active);
  };

  const handleApply = () => {
    onApply(values);
    setIsOpen(false);
  };

  const handleClear = () => {
    const cleared: Record<string, any> = {};
    filters.forEach((f) => {
      cleared[f.field] = '';
    });
    setValues(cleared);
    setActiveCount(0);
    onClear();
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Advanced Filters</h4>
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filters.map((filter) => (
              <div key={filter.field} className="space-y-2">
                <Label htmlFor={filter.field} className="text-xs">
                  {filter.label}
                </Label>
                {filter.type === 'text' && (
                  <Input
                    id={filter.field}
                    value={values[filter.field] || ''}
                    onChange={(e) => handleChange(filter.field, e.target.value)}
                    placeholder={`Filter by ${filter.label.toLowerCase()}`}
                    className="h-8"
                  />
                )}
                {filter.type === 'select' && filter.options && (
                  <Select
                    value={values[filter.field] || filter.options[0]?.value || 'all'}
                    onValueChange={(value) => {
                      // If first option is "all" type option, treat it as empty
                      const firstOption = filter.options?.[0];
                      if (firstOption && (firstOption.value === 'all' || firstOption.label.toLowerCase().includes('all'))) {
                        handleChange(filter.field, value === firstOption.value ? '' : value);
                      } else {
                        handleChange(filter.field, value);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {filter.type === 'date' && (
                  <Input
                    id={filter.field}
                    type="date"
                    value={values[filter.field] || ''}
                    onChange={(e) => handleChange(filter.field, e.target.value)}
                    className="h-8"
                  />
                )}
                {filter.type === 'number' && (
                  <Input
                    id={filter.field}
                    type="number"
                    value={values[filter.field] || ''}
                    onChange={(e) => handleChange(filter.field, e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder={`Filter by ${filter.label.toLowerCase()}`}
                    className="h-8"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Button onClick={handleApply} size="sm" className="flex-1">
              Apply Filters
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

