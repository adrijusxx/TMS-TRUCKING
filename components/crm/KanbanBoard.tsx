'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format, isPast, isToday } from 'date-fns';
import { User, Phone, Mail, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import LeadSheet from './LeadSheet';
import { useClickToCall } from '@/lib/hooks/useClickToCall';

interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    status: string;
    priority: string | null;
    phone: string;
    email: string | null;
    assignedTo?: {
        firstName: string;
        lastName: string;
    } | null;
    updatedAt: string;
    nextFollowUpDate?: string | null;
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
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [draggedLead, setDraggedLead] = useState<string | null>(null);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleCardClick = (leadId: string) => {
        setSelectedLeadId(leadId);
        setIsSheetOpen(true);
    };

    const { initiateCall } = useClickToCall();

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
            onRefresh?.();
        } catch (error) {
            toast.error('Failed to move lead');
            setLeads((prev) =>
                prev.map((l) => (l.id === leadId ? { ...l, status: previousStatus } : l))
            );
        } finally {
            setDraggedLead(null);
        }
    };

    const getLeadsByStatus = (status: string) => leads.filter((lead) => lead.status === status);

    return (
        <>
            <div className="h-[calc(100vh-12rem)] flex gap-4 overflow-x-auto pb-4">
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
                                        <Card
                                            key={lead.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, lead.id)}
                                            className={cn(
                                                "cursor-move hover:shadow-md transition-all bg-card border-l-4",
                                                draggedLead === lead.id ? "opacity-50" : "",
                                                lead.priority === 'HOT' ? "border-l-red-500" :
                                                    lead.priority === 'WARM' ? "border-l-yellow-500" :
                                                        lead.priority === 'COLD' ? "border-l-blue-300" : "border-l-gray-300"
                                            )}
                                            onClick={() => handleCardClick(lead.id)}
                                        >
                                            <CardContent className="p-3 space-y-2">
                                                <span className="font-medium text-sm line-clamp-1">
                                                    {lead.firstName} {lead.lastName}
                                                </span>

                                                <div className="grid gap-1">
                                                    <button
                                                        onClick={(e) => initiateCall(lead.phone, e)}
                                                        className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors text-left"
                                                        title="Click to Call"
                                                    >
                                                        <Phone className="h-3 w-3 mr-2" />
                                                        <span className="truncate">{lead.phone}</span>
                                                    </button>
                                                    {lead.email && (
                                                        <div className="flex items-center text-xs text-muted-foreground">
                                                            <Mail className="h-3 w-3 mr-2" />
                                                            <span className="truncate">{lead.email}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3 mr-2" />
                                                        <span>{format(new Date(lead.updatedAt), 'MMM d')}</span>
                                                    </div>
                                                    {lead.nextFollowUpDate && (
                                                        <div className={cn(
                                                            "flex items-center text-xs",
                                                            isPast(new Date(lead.nextFollowUpDate)) ? "text-red-500 font-medium" :
                                                                isToday(new Date(lead.nextFollowUpDate)) ? "text-amber-500 font-medium" :
                                                                    "text-muted-foreground"
                                                        )}>
                                                            <Clock className="h-3 w-3 mr-2" />
                                                            <span>
                                                                {isPast(new Date(lead.nextFollowUpDate)) ? 'Overdue' :
                                                                    isToday(new Date(lead.nextFollowUpDate)) ? 'Today' :
                                                                        format(new Date(lead.nextFollowUpDate), 'MMM d')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {lead.assignedTo && (
                                                    <div className="pt-2 mt-2 border-t flex items-center">
                                                        <User className="h-3 w-3 mr-1 text-muted-foreground" />
                                                        <span className="text-xs text-muted-foreground truncate">
                                                            {lead.assignedTo.firstName}
                                                        </span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
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
                    onRefresh?.();
                    setIsSheetOpen(false);
                }}
            />
        </>
    );
}
