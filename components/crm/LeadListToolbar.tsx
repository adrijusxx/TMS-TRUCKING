'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Search, RefreshCw, Upload, User, Calendar, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import ExportLeadsButton from './ExportLeadsButton';

const sourceOptions = [
    { value: 'all', label: 'All Sources' },
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'REFERRAL', label: 'Referral' },
    { value: 'DIRECT', label: 'Direct' },
    { value: 'WEBSITE', label: 'Website' },
    { value: 'OTHER', label: 'Other' },
];

const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'QUALIFIED', label: 'Qualified' },
    { value: 'DOCUMENTS_PENDING', label: 'Docs Pending' },
    { value: 'DOCUMENTS_COLLECTED', label: 'Docs Collected' },
    { value: 'INTERVIEW', label: 'Interview' },
    { value: 'OFFER', label: 'Offer' },
    { value: 'HIRED', label: 'Hired' },
    { value: 'REJECTED', label: 'Rejected' },
];

const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'HOT', label: 'Hot' },
    { value: 'WARM', label: 'Warm' },
    { value: 'COLD', label: 'Cold' },
];

interface StaffUser {
    id: string;
    firstName: string;
    lastName: string;
}

interface LeadListToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (value: string) => void;
    priorityFilter: string;
    onPriorityChange: (value: string) => void;
    assignedToFilter: string;
    onAssignedToChange: (value: string) => void;
    sourceFilter: string;
    onSourceChange: (value: string) => void;
    dateFrom: string;
    onDateFromChange: (value: string) => void;
    dateTo: string;
    onDateToChange: (value: string) => void;
    onRefresh: () => void;
    isFetching: boolean;
    onAddNew: () => void;
    currentUserId?: string;
}

export default function LeadListToolbar({
    searchQuery, onSearchChange,
    statusFilter, onStatusChange,
    priorityFilter, onPriorityChange,
    assignedToFilter, onAssignedToChange,
    sourceFilter, onSourceChange,
    dateFrom, onDateFromChange,
    dateTo, onDateToChange,
    onRefresh, isFetching, onAddNew,
    currentUserId,
}: LeadListToolbarProps) {
    const [staff, setStaff] = useState<StaffUser[]>([]);
    const [showDateFilter, setShowDateFilter] = useState(!!dateFrom || !!dateTo);

    useEffect(() => {
        fetch('/api/users/staff?recruiter=true')
            .then(r => r.json())
            .then(data => setStaff(Array.isArray(data.data) ? data.data : []))
            .catch(() => {});
    }, []);

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
                {currentUserId && (
                    <Button
                        variant={assignedToFilter === currentUserId ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onAssignedToChange(
                            assignedToFilter === currentUserId ? 'all' : currentUserId
                        )}
                    >
                        <User className="h-4 w-4 mr-1" />
                        My Leads
                    </Button>
                )}
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                <Select value={statusFilter} onValueChange={onStatusChange}>
                    <SelectTrigger className="w-[145px] h-9">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={onPriorityChange}>
                    <SelectTrigger className="w-[130px] h-9">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={sourceFilter} onValueChange={onSourceChange}>
                    <SelectTrigger className="w-[130px] h-9">
                        <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                        {sourceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={assignedToFilter} onValueChange={onAssignedToChange}>
                    <SelectTrigger className="w-[150px] h-9">
                        <SelectValue placeholder="Recruiter" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Recruiters</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {staff.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant={showDateFilter ? 'default' : 'outline'}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {
                        if (showDateFilter) {
                            onDateFromChange('');
                            onDateToChange('');
                        }
                        setShowDateFilter(!showDateFilter);
                    }}
                    title="Date range filter"
                >
                    <Calendar className="h-4 w-4" />
                </Button>

                <div className="flex-1" />

                <Button variant="outline" size="icon" className="h-9 w-9" onClick={onRefresh} disabled={isFetching}>
                    <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                </Button>

                <ExportLeadsButton
                    status={statusFilter !== 'all' ? statusFilter : undefined}
                    priority={priorityFilter !== 'all' ? priorityFilter : undefined}
                />

                <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/crm/import">
                        <Upload className="h-4 w-4 mr-1" />
                        Import
                    </Link>
                </Button>

                <Button size="sm" onClick={onAddNew}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Lead
                </Button>
            </div>

            {showDateFilter && (
                <div className="flex items-center gap-2 pl-1">
                    <span className="text-xs text-muted-foreground">Created:</span>
                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => onDateFromChange(e.target.value)}
                        className="w-36 h-8 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => onDateToChange(e.target.value)}
                        className="w-36 h-8 text-sm"
                    />
                    {(dateFrom || dateTo) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => { onDateFromChange(''); onDateToChange(''); }}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
