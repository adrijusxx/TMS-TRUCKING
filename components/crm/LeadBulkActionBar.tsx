'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, UserPlus, MessageSquare, Mail } from 'lucide-react';

interface LeadBulkActionBarProps {
    selectedCount: number;
    onChangeStatus: () => void;
    onAssign: () => void;
    onSendSms: () => void;
    onSendEmail: () => void;
    onClear: () => void;
}

export default function LeadBulkActionBar({
    selectedCount, onChangeStatus, onAssign,
    onSendSms, onSendEmail, onClear,
}: LeadBulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
            <span className="text-sm font-medium">
                {selectedCount} selected
            </span>
            <Button variant="outline" size="sm" onClick={onChangeStatus} className="gap-1">
                <ArrowRight className="h-3.5 w-3.5" />
                Change Status
            </Button>
            <Button variant="outline" size="sm" onClick={onAssign} className="gap-1">
                <UserPlus className="h-3.5 w-3.5" />
                Assign
            </Button>
            <Button variant="outline" size="sm" onClick={onSendSms} className="gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                Send SMS
            </Button>
            <Button variant="outline" size="sm" onClick={onSendEmail} className="gap-1">
                <Mail className="h-3.5 w-3.5" />
                Send Email
            </Button>
            <Button variant="ghost" size="sm" onClick={onClear}>
                Clear
            </Button>
        </div>
    );
}
