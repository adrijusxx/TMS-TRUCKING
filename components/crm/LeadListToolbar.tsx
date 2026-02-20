'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Search, RefreshCw, Upload } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import ExportLeadsButton from './ExportLeadsButton';

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

interface LeadListToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (value: string) => void;
    priorityFilter: string;
    onPriorityChange: (value: string) => void;
    onRefresh: () => void;
    isFetching: boolean;
    onAddNew: () => void;
}

export default function LeadListToolbar({
    searchQuery, onSearchChange,
    statusFilter, onStatusChange,
    priorityFilter, onPriorityChange,
    onRefresh, isFetching, onAddNew,
}: LeadListToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>

            <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger className="w-[160px]">
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
                <SelectTrigger className="w-[140px]">
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

            <div className="flex-1" />

            <Button variant="outline" size="icon" onClick={onRefresh} disabled={isFetching}>
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>

            <ExportLeadsButton
                status={statusFilter !== 'all' ? statusFilter : undefined}
                priority={priorityFilter !== 'all' ? priorityFilter : undefined}
            />

            <Button variant="outline" asChild>
                <Link href="/dashboard/crm/import">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                </Link>
            </Button>

            <Button onClick={onAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
            </Button>
        </div>
    );
}
