'use client';

import * as React from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InvoiceDateRangeFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
}

export function InvoiceDateRangeFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: InvoiceDateRangeFilterProps) {

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFromDateChange(value);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onToDateChange(value);
  };

  return (
    <div className="flex items-center gap-4 py-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="from-date" className="text-sm font-medium whitespace-nowrap">
          FROM DATE
        </Label>
        <div className="relative">
          <Input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={handleFromDateChange}
            className="w-[140px] h-9 pr-8"
          />
          <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="to-date" className="text-sm font-medium whitespace-nowrap">
          TO DATE
        </Label>
        <div className="relative">
          <Input
            id="to-date"
            type="date"
            value={toDate}
            onChange={handleToDateChange}
            className="w-[140px] h-9 pr-8"
          />
          <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

