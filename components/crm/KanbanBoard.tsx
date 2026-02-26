'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';
import { User, Phone, Mail, Calendar, Clock, MessageSquare, StickyNote, Search, Filter, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import LeadSheet from './LeadSheet';
import HireLeadDialog from './HireLeadDialog';
import KanbanQuickNote from './KanbanQuickNote';
import { useClickToCall } from '@/lib/hooks/useClickToCall';

interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    status: string;
    priority: string | null;
    phone: string;
    email: string | null;
    source?: string;
    assignedTo?: { firstName: string; lastName: string } | null;
    updatedAt: string;
    nextFollowUpDate?: string | null;
    lastCallAt?: string | null;
    lastSmsAt?: string | null;
    aiSummary?: string | null;
    latestNote?: string | null;
}

interface KanbanBoardProps {
    leads: Lead[];
    onRefresh?: () => void;
}

const COLUMNS = [
    { id: 'NEW', label: 'New', color: 'bg-blue-500' },
    { id: 'CONTACTED', label: 'Contacted', color: 'bg-yellow-500' },
    { id: 'QUALIFIED', label: 'Qualified', color: 'bg-green-500' },
    { id: 'DOCUMENTS_PENDING', label: 'Docs Pending', color: 'bg-orange-500' },
    { id: 'DOCUMENTS_COLLECTED', label: 'Docs Collected', color: 'bg-teal-500' },
    { id: 'INTERVIEW', label: 'Interview', color: 'bg-purple-500' },
    { id: 'OFFER', label: 'Offer', color: 'bg-pink-500' },
    { id: 'HIRED', label: 'Hired', color: 'bg-emerald-600' },
    { id: 'REJECTED', label: 'Rejected', color: 'bg-red-500' },
];

export default function KanbanBoard({ leads: initialLeads, onRefresh }: KanbanBoardProps) {
    const router = useRouter();
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [draggedLead, setDraggedLead] = useState<string | null>(null);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [hireDialogOpen, setHireDialogOpen] = useState(false);
    const [hireLeadData, setHireLeadData] = useState<{ id: string; name: string } | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [recruiterFilter, setRecruiterFilter] = useState('all');
    const [overdueOnly, setOverdueOnly] = useState(false);

    const recruiterNames = useMemo(() => {
        const names = new Map<string, string>();
        leads.forEach((l) => {
            if (l.assignedTo) {
                const key = `${l.assignedTo.firstName} ${l.assignedTo.lastName}`;
                names.set(key, key);
            }
        });
        return Array.from(names.values()).sort();
    }, [leads]);

    const filteredLeads = useMemo(() => {
        return leads.filter((l) => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match = `${l.firstName} ${l.lastName} ${l.phone} ${l.email || ''}`.toLowerCase().includes(q);
                if (!match) return false;
            }
            if (priorityFilter !== 'all' && l.priority !== priorityFilter) return false;
            if (recruiterFilter !== 'all') {
                if (recruiterFilter === 'unassigned' && l.assignedTo) return false;
                if (recruiterFilter !== 'unassigned') {
                    const name = l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : '';
                    if (name !== recruiterFilter) return false;
                }
            }
            if (overdueOnly) {
                if (!l.nextFollowUpDate || !isPast(new Date(l.nextFollowUpDate))) return false;
            }
            return true;
        });
    }, [leads, searchQuery, priorityFilter, recruiterFilter, overdueOnly]);

    const hasFilters = searchQuery || priorityFilter !== 'all' || recruiterFilter !== 'all' || overdueOnly;

    const handleCardClick = (leadId: string) => {
        setSelectedLeadId(leadId);
        setIsSheetOpen(true);
    };

    const { initiateCall } = useClickToCall();

    const handleRefresh = () => {
        onRefresh?.();
        router.refresh();
    };

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        setDraggedLead(leadId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault();
        const leadId = draggedLead;
        if (!leadId) return;

        const lead = leads.find((l) => l.id === leadId);
        if (!lead || lead.status === targetStatus) return;

        if (targetStatus === 'HIRED') {
            setDraggedLead(null);
            setHireLeadData({ id: leadId, name: `${lead.firstName} ${lead.lastName}` });
            setHireDialogOpen(true);
            return;
        }

        const previousStatus = lead.status;
        setLeads((prev) =>
            prev.map((l) => (l.id === leadId ? { ...l, status: targetStatus } : l))
        );

        try {
            const res = await fetch(`/api/crm/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: targetStatus }),
            });

            if (!res.ok) throw new Error('Failed to update status');
            toast.success(`Moved to ${COLUMNS.find(c => c.id === targetStatus)?.label}`);
            handleRefresh();
        } catch {
            toast.error('Failed to move lead');
            setLeads((prev) =>
                prev.map((l) => (l.id === leadId ? { ...l, status: previousStatus } : l))
            );
        } finally {
            setDraggedLead(null);
        }
    };

    const getLeadsByStatus = (status: string) => filteredLeads.filter((lead) => lead.status === status);

    return (
        <>
            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 w-48 text-sm"
                    />
                </div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-28 h-8 text-sm">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="HOT">Hot</SelectItem>
                        <SelectItem value="WARM">Warm</SelectItem>
                        <SelectItem value="COLD">Cold</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={recruiterFilter} onValueChange={setRecruiterFilter}>
                    <SelectTrigger className="w-36 h-8 text-sm">
                        <SelectValue placeholder="Recruiter" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Recruiters</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {recruiterNames.map((name) => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    variant={overdueOnly ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOverdueOnly(!overdueOnly)}
                    className="gap-1.5 h-8"
                >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Overdue
                </Button>
                {hasFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => { setSearchQuery(''); setPriorityFilter('all'); setRecruiterFilter('all'); setOverdueOnly(false); }}
                    >
                        Clear
                    </Button>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                    {filteredLeads.length} of {leads.length} leads
                </span>
            </div>

            <div className="h-[calc(100vh-15rem)] flex gap-4 overflow-x-auto pb-4">
                {COLUMNS.map((column) => {
                    const columnLeads = getLeadsByStatus(column.id);

                    return (
                        <div
                            key={column.id}
                            className="flex-shrink-0 w-72 bg-muted/30 rounded-lg flex flex-col"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            <div className={`p-3 rounded-t-lg border-b bg-background flex items-center justify-between sticky top-0 z-10 border-t-4 ${column.color.replace('bg-', 'border-')}`}>
                                <h3 className="font-semibold text-sm">{column.label}</h3>
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {columnLeads.length}
                                </Badge>
                            </div>

                            <ScrollArea className="flex-1 p-2">
                                <div className="space-y-2">
                                    {columnLeads.map((lead) => (
                                        <LeadCard
                                            key={lead.id}
                                            lead={lead}
                                            isDragging={draggedLead === lead.id}
                                            onDragStart={handleDragStart}
                                            onClick={handleCardClick}
                                            onCall={initiateCall}
                                            onNoteAdded={handleRefresh}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    );
                })}
            </div>

            <LeadSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                leadId={selectedLeadId}
                onSuccess={() => {
                    handleRefresh();
                    setIsSheetOpen(false);
                }}
            />

            {hireLeadData && (
                <HireLeadDialog
                    open={hireDialogOpen}
                    onOpenChange={(open) => {
                        setHireDialogOpen(open);
                        if (!open) setHireLeadData(null);
                    }}
                    leadId={hireLeadData.id}
                    leadName={hireLeadData.name}
                    onSuccess={() => {
                        setHireDialogOpen(false);
                        setHireLeadData(null);
                        handleRefresh();
                    }}
                />
            )}
        </>
    );
}

interface LeadCardProps {
    lead: Lead;
    isDragging: boolean;
    onDragStart: (e: React.DragEvent, leadId: string) => void;
    onClick: (leadId: string) => void;
    onCall: (phone: string, e?: React.MouseEvent) => void;
    onNoteAdded: () => void;
}

function LeadCard({ lead, isDragging, onDragStart, onClick, onCall, onNoteAdded }: LeadCardProps) {
    return (
        <Card
            draggable
            onDragStart={(e) => onDragStart(e, lead.id)}
            className={cn(
                "cursor-move hover:shadow-md transition-all bg-card border-l-4",
                isDragging ? "opacity-50" : "",
                lead.priority === 'HOT' ? "border-l-red-500" :
                    lead.priority === 'WARM' ? "border-l-yellow-500" :
                        lead.priority === 'COLD' ? "border-l-blue-300" : "border-l-gray-300",
                lead.nextFollowUpDate && isPast(new Date(lead.nextFollowUpDate)) && "ring-1 ring-red-400/50 bg-red-50/30 dark:bg-red-950/10"
            )}
            onClick={() => onClick(lead.id)}
        >
            <CardContent className="p-3 space-y-1.5">
                <span className="font-medium text-sm line-clamp-1">
                    {lead.firstName} {lead.lastName}
                </span>

                {lead.aiSummary && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 italic leading-tight">
                        {lead.aiSummary}
                    </p>
                )}

                <div className="grid gap-1">
                    <button
                        onClick={(e) => onCall(lead.phone, e)}
                        className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors text-left"
                        title="Click to Call"
                    >
                        <Phone className="h-3 w-3 mr-2 shrink-0" />
                        <span className="truncate">{lead.phone}</span>
                    </button>
                    {lead.email && (
                        <div className="flex items-center text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 mr-2 shrink-0" />
                            <span className="truncate">{lead.email}</span>
                        </div>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-2 shrink-0" />
                        <span>{format(new Date(lead.updatedAt), 'MMM d')}</span>
                    </div>
                    {lead.nextFollowUpDate && (
                        <div className={cn(
                            "flex items-center text-xs",
                            isPast(new Date(lead.nextFollowUpDate)) ? "text-red-500 font-medium" :
                                isToday(new Date(lead.nextFollowUpDate)) ? "text-amber-500 font-medium" :
                                    "text-muted-foreground"
                        )}>
                            <Clock className="h-3 w-3 mr-2 shrink-0" />
                            <span>
                                {isPast(new Date(lead.nextFollowUpDate)) ? 'Overdue' :
                                    isToday(new Date(lead.nextFollowUpDate)) ? 'Today' :
                                        format(new Date(lead.nextFollowUpDate), 'MMM d')}
                            </span>
                        </div>
                    )}
                </div>

                {(lead.lastCallAt || lead.lastSmsAt) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1">
                        {lead.lastCallAt && (
                            <div className="flex items-center text-[11px] text-muted-foreground">
                                <Phone className="h-2.5 w-2.5 mr-1 shrink-0" />
                                <span>{formatDistanceToNow(new Date(lead.lastCallAt), { addSuffix: true })}</span>
                            </div>
                        )}
                        {lead.lastSmsAt && (
                            <div className="flex items-center text-[11px] text-muted-foreground">
                                <MessageSquare className="h-2.5 w-2.5 mr-1 shrink-0" />
                                <span>{formatDistanceToNow(new Date(lead.lastSmsAt), { addSuffix: true })}</span>
                            </div>
                        )}
                    </div>
                )}

                {lead.latestNote && (
                    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                        <StickyNote className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                        <span className="line-clamp-1 leading-tight">{lead.latestNote}</span>
                    </div>
                )}

                {lead.assignedTo && (
                    <div className="pt-1.5 mt-1.5 border-t flex items-center">
                        <User className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                            {lead.assignedTo.firstName}
                        </span>
                    </div>
                )}

                <div onClick={(e) => e.stopPropagation()}>
                    <KanbanQuickNote leadId={lead.id} onNoteAdded={onNoteAdded} />
                </div>
            </CardContent>
        </Card>
    );
}
