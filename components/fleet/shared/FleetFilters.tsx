'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FleetFilterState {
    status: string;
    priority: string;
    type: string;
    assignedTo?: string;
}

interface FleetFiltersProps {
    filters: FleetFilterState;
    onFiltersChange: (filters: FleetFilterState) => void;
    showTypeFilter?: boolean;
    showAssignedFilter?: boolean;
    className?: string;
}

const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'REPORTED', label: 'Reported' },
    { value: 'DISPATCHED', label: 'Dispatched' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'WAITING_PARTS', label: 'Waiting Parts' },
    { value: 'COMPLETED', label: 'Completed' },
];

const priorityOptions = [
    { value: 'ALL', label: 'All Priorities' },
    { value: 'CRITICAL', label: '🔴 Critical' },
    { value: 'HIGH', label: '🟡 High' },
    { value: 'MEDIUM', label: '🟢 Medium' },
    { value: 'LOW', label: '⚪ Low' },
];

const typeOptions = [
    { value: 'ALL', label: 'All Types' },
    { value: 'ENGINE_FAILURE', label: 'Engine' },
    { value: 'TRANSMISSION_FAILURE', label: 'Transmission' },
    { value: 'BRAKE_FAILURE', label: 'Brakes' },
    { value: 'TIRE_FLAT', label: 'Flat Tire' },
    { value: 'TIRE_BLOWOUT', label: 'Blowout' },
    { value: 'ELECTRICAL_ISSUE', label: 'Electrical' },
    { value: 'COOLING_SYSTEM', label: 'Cooling' },
    { value: 'FUEL_SYSTEM', label: 'Fuel' },
    { value: 'SUSPENSION', label: 'Suspension' },
    { value: 'ACCIDENT_DAMAGE', label: 'Accident' },
    { value: 'WEATHER_RELATED', label: 'Weather' },
    { value: 'OTHER', label: 'Other' },
];

export default function FleetFilters({
    filters,
    onFiltersChange,
    showTypeFilter = true,
    showAssignedFilter = false,
    className,
}: FleetFiltersProps) {
    const [showFilters, setShowFilters] = useState(false);

    const activeFiltersCount = Object.values(filters).filter(
        (value) => value && value !== 'ALL'
    ).length;

    const handleClearFilters = () => {
        onFiltersChange({
            status: 'ALL',
            priority: 'ALL',
            type: 'ALL',
            assignedTo: undefined,
        });
    };

    const handleFilterChange = (key: keyof FleetFilterState, value: string) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        });
    };

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-8"
                >
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    Filters
                    {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-1.5 h-4 px-1">
                            {activeFiltersCount}
                        </Badge>
                    )}
                </Button>
                {activeFiltersCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="h-8 text-xs"
                    >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded-lg bg-muted/30">
                    <div className="space-y-1">
                        <Label className="text-xs">Status</Label>
                        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Priority</Label>
                        <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {priorityOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {showTypeFilter && (
                        <div className="space-y-1">
                            <Label className="text-xs">Issue Type</Label>
                            <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {typeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
