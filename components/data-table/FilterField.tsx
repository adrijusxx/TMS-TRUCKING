'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FilterDefinition } from './types';
import { FilterSearchableSelect } from './FilterSearchableSelect';

interface FilterFieldProps {
  filter: FilterDefinition;
  value: any;
  onChange: (key: string, value: any, type?: string) => void;
}

/**
 * Renders a single filter field based on its definition type.
 * Extracted from TableToolbar to keep it under the line limit.
 */
export function FilterField({ filter, value, onChange }: FilterFieldProps) {
  const currentValue = value;

  return (
    <div className="space-y-2">
      <Label htmlFor={filter.key} className="text-xs font-medium">
        {filter.label}
      </Label>

      {filter.type === 'text' && (
        <Input
          id={filter.key}
          value={currentValue || ''}
          onChange={(e) => onChange(filter.key, e.target.value, filter.type)}
          placeholder={`Filter by ${filter.label.toLowerCase()}`}
          className="h-8"
        />
      )}

      {filter.type === 'searchable-select' && filter.entityType && filter.filterKey && (
        <FilterSearchableSelect
          value={currentValue || ''}
          onValueChange={(v) => onChange(filter.key, v || '', filter.type)}
          entityType={filter.entityType}
          filterKey={filter.filterKey}
          placeholder={`Select ${filter.label.toLowerCase()}`}
          className="h-8"
        />
      )}

      {filter.type === 'select' && filter.options && (
        <Select
          value={currentValue || 'all'}
          onValueChange={(v) => onChange(filter.key, v === 'all' ? '' : v, filter.type)}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {filter.label}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {filter.type === 'multiselect' && filter.options && (
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
          {filter.options.map((option) => {
            const selected = Array.isArray(currentValue) ? currentValue.includes(option.value) : false;
            return (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filter.key}-${option.value}`}
                  checked={selected}
                  onCheckedChange={(checked) => {
                    const current = Array.isArray(currentValue) ? currentValue : [];
                    const updated = checked
                      ? [...current, option.value]
                      : current.filter((v: string) => v !== option.value);
                    onChange(filter.key, updated, filter.type);
                  }}
                />
                <Label
                  htmlFor={`${filter.key}-${option.value}`}
                  className="text-xs font-normal cursor-pointer flex-1"
                >
                  {option.label}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      {filter.type === 'number' && (
        <Input
          id={filter.key}
          type="number"
          value={currentValue || ''}
          onChange={(e) => onChange(filter.key, e.target.value ? parseFloat(e.target.value) : '', filter.type)}
          placeholder={`Filter by ${filter.label.toLowerCase()}`}
          className="h-8"
        />
      )}

      {filter.type === 'numberrange' && (
        <div className="flex gap-2">
          <Input
            id={`${filter.key}_min`}
            type="number"
            value={currentValue?.min || ''}
            onChange={(e) => onChange(filter.key, { ...currentValue, min: e.target.value ? parseFloat(e.target.value) : '' }, filter.type)}
            placeholder="Min"
            className="h-8 flex-1"
          />
          <Input
            id={`${filter.key}_max`}
            type="number"
            value={currentValue?.max || ''}
            onChange={(e) => onChange(filter.key, { ...currentValue, max: e.target.value ? parseFloat(e.target.value) : '' }, filter.type)}
            placeholder="Max"
            className="h-8 flex-1"
          />
        </div>
      )}

      {filter.type === 'date' && (
        <Input
          id={filter.key}
          type="date"
          value={currentValue || ''}
          onChange={(e) => onChange(filter.key, e.target.value, filter.type)}
          className="h-8"
        />
      )}

      {filter.type === 'daterange' && (
        <div className="flex gap-2">
          <Input
            id={`${filter.key}_start`}
            type="date"
            value={currentValue?.start || ''}
            onChange={(e) => onChange(filter.key, { ...currentValue, start: e.target.value }, filter.type)}
            placeholder="Start Date"
            className="h-8 flex-1"
          />
          <Input
            id={`${filter.key}_end`}
            type="date"
            value={currentValue?.end || ''}
            onChange={(e) => onChange(filter.key, { ...currentValue, end: e.target.value }, filter.type)}
            placeholder="End Date"
            className="h-8 flex-1"
          />
        </div>
      )}

      {filter.type === 'boolean' && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={filter.key}
            checked={currentValue === 'true' || currentValue === true || currentValue === 'True'}
            onCheckedChange={(checked) => {
              onChange(filter.key, checked ? 'true' : '', filter.type);
            }}
          />
          <Label
            htmlFor={filter.key}
            className="text-xs font-normal cursor-pointer"
          >
            {filter.helpText || 'Enable filter'}
          </Label>
        </div>
      )}
    </div>
  );
}
