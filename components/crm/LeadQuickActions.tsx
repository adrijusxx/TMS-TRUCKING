'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Phone, MessageSquare, Mail, Calendar } from 'lucide-react';
import LogActivityDialog from './LogActivityDialog';
import LeadFollowUpScheduler from './LeadFollowUpScheduler';

interface LeadQuickActionsProps {
    leadId: string;
    leadData?: any;
    onSuccess?: () => void;
}

const actions = [
    { type: 'CALL' as const, icon: Phone, label: 'Log Call', color: 'text-blue-600 hover:bg-blue-50' },
    { type: 'SMS' as const, icon: MessageSquare, label: 'Send SMS', color: 'text-green-600 hover:bg-green-50' },
    { type: 'EMAIL' as const, icon: Mail, label: 'Send Email', color: 'text-purple-600 hover:bg-purple-50' },
];

export default function LeadQuickActions({ leadId, leadData, onSuccess }: LeadQuickActionsProps) {
    const [dialogType, setDialogType] = useState<'CALL' | 'SMS' | 'EMAIL' | null>(null);
    const [followUpOpen, setFollowUpOpen] = useState(false);

    return (
        <>
            <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-1">Quick actions:</span>
                <TooltipProvider delayDuration={200}>
                    {actions.map((action) => (
                        <Tooltip key={action.type}>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className={action.color}
                                    onClick={() => setDialogType(action.type)}
                                >
                                    <action.icon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{action.label}</TooltipContent>
                        </Tooltip>
                    ))}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-amber-600 hover:bg-amber-50"
                                onClick={() => setFollowUpOpen(true)}
                            >
                                <Calendar className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Schedule Follow-Up</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {dialogType && (
                <LogActivityDialog
                    open={!!dialogType}
                    onOpenChange={(open) => { if (!open) setDialogType(null); }}
                    leadId={leadId}
                    activityType={dialogType}
                    onSuccess={onSuccess}
                />
            )}

            <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-amber-600" />
                            Schedule Follow-Up
                        </DialogTitle>
                    </DialogHeader>
                    <LeadFollowUpScheduler
                        leadId={leadId}
                        currentFollowUpDate={leadData?.nextFollowUpDate || null}
                        currentFollowUpNote={leadData?.nextFollowUpNote || null}
                        onUpdated={() => { setFollowUpOpen(false); onSuccess?.(); }}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
