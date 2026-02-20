'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Phone, MessageSquare, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import LeadSheet from './LeadSheet';
import LeadListToolbar from './LeadListToolbar';
import LeadBulkActionBar from './LeadBulkActionBar';
import LogActivityDialog from './LogActivityDialog';
import BulkStatusDialog from './BulkStatusDialog';
import BulkAssignDialog from './BulkAssignDialog';
import BulkSmsDialog from './BulkSmsDialog';
import BulkEmailDialog from './BulkEmailDialog';
import LeadWarningCell from './LeadWarningCell';
import LeadAssignedToCell from './LeadAssignedToCell';
import { computeLeadWarnings, type SLAConfig } from '@/lib/utils/lead-warnings';
import { useSmsMessenger } from '@/lib/contexts/SmsMessengerContext';
import { useClickToCall } from '@/lib/hooks/useClickToCall';

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
    updatedAt: string;
    lastContactedAt: string | null;
    lastCallAt: string | null;
    lastSmsAt: string | null;
    nextFollowUpDate: string | null;
    nextFollowUpNote: string | null;
    aiSummary: string | null;
    latestNote: string | null;
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

const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

export default function LeadListClient() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [assignedToFilter, setAssignedToFilter] = useState('all');
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
    const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
    const [bulkSmsOpen, setBulkSmsOpen] = useState(false);
    const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
    const [emailDialogLeadId, setEmailDialogLeadId] = useState<string | null>(null);
    const { openSmsMessenger } = useSmsMessenger();
    const { initiateCall } = useClickToCall();

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['leads', searchQuery, statusFilter, priorityFilter, assignedToFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (priorityFilter !== 'all') params.append('priority', priorityFilter);
            if (assignedToFilter !== 'all') params.append('assignedTo', assignedToFilter);
            const res = await fetch(`/api/crm/leads?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch leads');
            return res.json();
        },
        staleTime: 30000,
    });

    const { data: slaData } = useQuery({
        queryKey: ['sla-config'],
        queryFn: async () => {
            const res = await fetch('/api/crm/sla-config');
            if (!res.ok) return { configs: [] };
            return res.json();
        },
        staleTime: 300000,
    });

    const slaConfigs: SLAConfig[] = slaData?.configs || [];

    const leads: Lead[] = data?.leads || [];

    const toggleSelect = (id: string) =>
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    const toggleSelectAll = () =>
        setSelectedIds(selectedIds.length === leads.length ? [] : leads.map((l) => l.id));

    const handleBulkSuccess = () => { setSelectedIds([]); refetch(); };

    return (
        <div className="space-y-4">
            <LeadListToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                priorityFilter={priorityFilter}
                onPriorityChange={setPriorityFilter}
                assignedToFilter={assignedToFilter}
                onAssignedToChange={setAssignedToFilter}
                onRefresh={() => refetch()}
                isFetching={isFetching}
                onAddNew={() => { setSelectedLeadId(null); setIsSheetOpen(true); }}
            />

            <LeadBulkActionBar
                selectedCount={selectedIds.length}
                onChangeStatus={() => setBulkStatusOpen(true)}
                onAssign={() => setBulkAssignOpen(true)}
                onSendSms={() => setBulkSmsOpen(true)}
                onSendEmail={() => setBulkEmailOpen(true)}
                onClear={() => setSelectedIds([])}
            />

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={leads.length > 0 && selectedIds.length === leads.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Assigned</TableHead>
                            <TableHead>Last Call</TableHead>
                            <TableHead>Last SMS</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Alerts</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                                    Loading leads...
                                </TableCell>
                            </TableRow>
                        ) : leads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                                    No leads found. Click &quot;Add Lead&quot; to create your first recruiting lead.
                                </TableCell>
                            </TableRow>
                        ) : (
                            leads.map((lead) => (
                                <TableRow
                                    key={lead.id}
                                    className={cn(
                                        'cursor-pointer hover:bg-muted/50',
                                        selectedIds.includes(lead.id) && 'bg-muted/30'
                                    )}
                                    onClick={() => { setSelectedLeadId(lead.id); setIsSheetOpen(true); }}
                                >
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedIds.includes(lead.id)}
                                            onCheckedChange={() => toggleSelect(lead.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div>
                                            {lead.firstName} {lead.lastName}
                                            {lead.aiSummary && (
                                                <p className="text-xs text-muted-foreground font-normal line-clamp-1 mt-0.5">
                                                    {lead.aiSummary}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <ContactCell
                                            lead={lead}
                                            onCall={initiateCall}
                                            onSms={openSmsMessenger}
                                            onEmail={setEmailDialogLeadId}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn('text-xs', statusColors[lead.status])}>
                                            {formatStatus(lead.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn('text-xs', priorityColors[lead.priority])}>
                                            {lead.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {lead.source.replace(/_/g, ' ')}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <LeadAssignedToCell
                                            leadId={lead.id}
                                            assignedTo={lead.assignedTo}
                                            onAssigned={() => refetch()}
                                        />
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {lead.lastCallAt ? (
                                            <div className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(lead.lastCallAt), { addSuffix: true })}
                                            </div>
                                        ) : <span className="text-muted-foreground/50">--</span>}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {lead.lastSmsAt ? (
                                            <div className="flex items-center gap-1">
                                                <MessageSquare className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(lead.lastSmsAt), { addSuffix: true })}
                                            </div>
                                        ) : <span className="text-muted-foreground/50">--</span>}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell>
                                        <LeadWarningCell
                                            warnings={computeLeadWarnings(lead, slaConfigs)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <LeadSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                leadId={selectedLeadId}
                onSuccess={() => { refetch(); setIsSheetOpen(false); }}
            />

            <BulkStatusDialog open={bulkStatusOpen} onOpenChange={setBulkStatusOpen} selectedIds={selectedIds} onSuccess={handleBulkSuccess} />
            <BulkAssignDialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen} selectedIds={selectedIds} onSuccess={handleBulkSuccess} />
            <BulkSmsDialog open={bulkSmsOpen} onOpenChange={setBulkSmsOpen} selectedIds={selectedIds} onSuccess={handleBulkSuccess} />
            <BulkEmailDialog open={bulkEmailOpen} onOpenChange={setBulkEmailOpen} selectedIds={selectedIds} onSuccess={handleBulkSuccess} />

            {emailDialogLeadId && (
                <LogActivityDialog
                    open={!!emailDialogLeadId}
                    onOpenChange={(open) => { if (!open) setEmailDialogLeadId(null); }}
                    leadId={emailDialogLeadId}
                    activityType="EMAIL"
                    onSuccess={() => { setEmailDialogLeadId(null); refetch(); }}
                />
            )}
        </div>
    );
}

interface ContactCellProps {
    lead: Lead;
    onCall: (phone: string, e?: React.MouseEvent) => void;
    onSms: (data: { leadId: string; leadName: string; leadPhone: string }) => void;
    onEmail: (leadId: string) => void;
}

function ContactCell({ lead, onCall, onSms, onEmail }: ContactCellProps) {
    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                    {lead.phone}
                </span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={(e) => onCall(lead.phone, e)}
                            className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-muted-foreground hover:text-blue-600 transition-colors"
                        >
                            <Phone className="h-3.5 w-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Call</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => onSms({
                                leadId: lead.id,
                                leadName: `${lead.firstName} ${lead.lastName}`,
                                leadPhone: lead.phone,
                            })}
                            className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-muted-foreground hover:text-green-600 transition-colors"
                        >
                            <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>SMS</TooltipContent>
                </Tooltip>
                {lead.email && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => onEmail(lead.id)}
                                className="p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 text-muted-foreground hover:text-purple-600 transition-colors"
                            >
                                <Mail className="h-3.5 w-3.5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Email</TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    );
}
