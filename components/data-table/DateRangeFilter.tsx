'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    className?: string;
}

const presets = [
    { label: 'Today', getValue: () => formatDate(new Date()) },
    { label: 'Yesterday', getValue: () => formatDate(daysAgo(1)) },
    { label: 'Last 7 Days', getValue: () => `${formatDate(daysAgo(7))}:${formatDate(new Date())}` },
    { label: 'Last 30 Days', getValue: () => `${formatDate(daysAgo(30))}:${formatDate(new Date())}` },
    {
        label: 'This Month', getValue: () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return `${formatDate(start)}:${formatDate(now)}`;
        }
    },
    {
        label: 'Last Month', getValue: () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            return `${formatDate(start)}:${formatDate(end)}`;
        }
    },
];

function daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getPresetLabel(value: string | undefined): string | null {
    if (!value) return null;

    for (const preset of presets) {
        if (preset.getValue() === value) {
            return preset.label;
        }
    }

    // Check if it's a single date
    if (value.length === 10 && !value.includes(':')) {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Check if it's a range
    if (value.includes(':')) {
        const [start, end] = value.split(':');
        const startDate = new Date(start);
        const endDate = new Date(end);
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    return null;
}

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
    const [open, setOpen] = React.useState(false);
    const [customStart, setCustomStart] = React.useState('');
    const [customEnd, setCustomEnd] = React.useState('');

    const displayLabel = getPresetLabel(value) || 'Select date...';

    const handlePresetClick = (preset: typeof presets[0]) => {
        onChange(preset.getValue());
        setOpen(false);
    };

    const handleCustomApply = () => {
        if (customStart && customEnd) {
            onChange(`${customStart}:${customEnd}`);
        } else if (customStart) {
            onChange(customStart);
        }
        setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(undefined);
        setCustomStart('');
        setCustomEnd('');
    };

    return (
        <div className={cn('relative', className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            'h-7 text-xs px-2 w-full justify-between font-normal',
                            !value && 'text-muted-foreground'
                        )}
                    >
                        <span className="flex items-center gap-1 truncate">
                            <Calendar className="h-3 w-3" />
                            {displayLabel}
                        </span>
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-2 space-y-1">
                        <div className="text-xs font-medium text-muted-foreground px-2 py-1">Quick Presets</div>
                        {presets.map((preset) => (
                            <Button
                                key={preset.label}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-xs h-7"
                                onClick={() => handlePresetClick(preset)}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                    <div className="border-t p-2 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground px-2">Custom Range</div>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="flex-1 h-7 text-xs px-2 border rounded"
                            />
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="flex-1 h-7 text-xs px-2 border rounded"
                            />
                        </div>
                        <Button
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={handleCustomApply}
                            disabled={!customStart}
                        >
                            Apply Custom Range
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
            {value && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-7 w-7 p-0 text-muted-foreground hover:text-foreground z-10"
                    onClick={handleClear}
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}
