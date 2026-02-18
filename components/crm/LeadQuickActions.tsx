'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Phone, MessageSquare, Mail } from 'lucide-react';
import LogActivityDialog from './LogActivityDialog';

interface LeadQuickActionsProps {
    leadId: string;
    onSuccess?: () => void;
}

const actions = [
    { type: 'CALL' as const, icon: Phone, label: 'Log Call', color: 'text-blue-600 hover:bg-blue-50' },
    { type: 'SMS' as const, icon: MessageSquare, label: 'Log SMS', color: 'text-green-600 hover:bg-green-50' },
    { type: 'EMAIL' as const, icon: Mail, label: 'Log Email', color: 'text-purple-600 hover:bg-purple-50' },
];

export default function LeadQuickActions({ leadId, onSuccess }: LeadQuickActionsProps) {
    const [dialogType, setDialogType] = useState<'CALL' | 'SMS' | 'EMAIL' | null>(null);

    return (
        <>
            <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-1">Quick log:</span>
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
        </>
    );
}
