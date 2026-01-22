'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Search,
    Phone,
    Mail,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import LeadSheet from './LeadSheet';

interface Lead {
    id: string;
    leadNumber: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
    status: string;
    priority: string;
    source: string;
    assignedTo: { firstName: string; lastName: string } | null;
    createdAt: string;
    lastContactedAt: string | null;
}

const statusColors: Record<string, string> = {
    NEW: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    CONTACTED: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    QUALIFIED: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
    DOCUMENTS_PENDING: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
    DOCUMENTS_COLLECTED: 'bg-teal-500/20 text-teal-600 border-teal-500/30',
    INTERVIEW: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
    OFFER: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30',
    HIRED: 'bg-green-500/20 text-green-600 border-green-500/30',
    REJECTED: 'bg-red-500/20 text-red-600 border-red-500/30',
};

const priorityColors: Record<string, string> = {
    HOT: 'bg-red-500/20 text-red-600 border-red-500/30',
    WARM: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
    COLD: 'bg-slate-500/20 text-slate-600 border-slate-500/30',
};

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

export default function LeadListClient() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['leads', searchQuery, statusFilter, priorityFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (priorityFilter !== 'all') params.append('priority', priorityFilter);

            const res = await fetch(`/api/crm/leads?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch leads');
            return res.json();
        },
        staleTime: 30000,
    });

    const leads: Lead[] = data?.leads || [];

    const handleRowClick = (leadId: string) => {
        setSelectedLeadId(leadId);
        setIsSheetOpen(true);
    };

    const handleAddNew = () => {
        setSelectedLeadId(null);
        setIsSheetOpen(true);
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
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

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                </Button>

                <Button onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Lead #</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    Loading leads...
                                </TableCell>
                            </TableRow>
                        ) : leads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No leads found. Click "Add Lead" to create your first recruitment lead.
                                </TableCell>
                            </TableRow>
                        ) : (
                            leads.map((lead) => (
                                <TableRow
                                    key={lead.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRowClick(lead.id)}
                                >
                                    <TableCell className="font-mono text-sm">
                                        {lead.leadNumber}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {lead.firstName} {lead.lastName}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <a
                                                href={`tel:${lead.phone}`}
                                                className="flex items-center gap-2 hover:text-primary transition-colors hover:underline"
                                                onClick={(e) => e.stopPropagation()}
                                                title="Click to Call"
                                            >
                                                <Phone className="h-3 w-3" />
                                                <span>{lead.phone}</span>
                                            </a>
                                            {lead.email && (
                                                <>
                                                    <Mail className="h-3 w-3 ml-2" />
                                                    <span className="truncate max-w-[150px]">{lead.email}</span>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn('text-xs', statusColors[lead.status])}
                                        >
                                            {formatStatus(lead.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn('text-xs', priorityColors[lead.priority])}
                                        >
                                            {lead.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {lead.source.replace(/_/g, ' ')}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {lead.assignedTo
                                            ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Lead Sheet */}
            <LeadSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                leadId={selectedLeadId}
                onSuccess={() => {
                    refetch();
                    setIsSheetOpen(false);
                }}
            />
        </div>
    );
}
