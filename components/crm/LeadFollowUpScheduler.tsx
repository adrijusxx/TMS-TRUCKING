'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow, isPast } from 'date-fns';

const QUICK_FOLLOW_UPS = [
    { label: 'Tomorrow', days: 1 },
    { label: 'In 3 days', days: 3 },
    { label: 'Next week', days: 7 },
    { label: 'In 2 weeks', days: 14 },
];

interface LeadFollowUpSchedulerProps {
    leadId: string;
    currentFollowUpDate: string | null;
    currentFollowUpNote: string | null;
    onUpdated: () => void;
}

export default function LeadFollowUpScheduler({
    leadId,
    currentFollowUpDate,
    currentFollowUpNote,
    onUpdated,
}: LeadFollowUpSchedulerProps) {
    const [date, setDate] = useState(currentFollowUpDate?.slice(0, 16) || '');
    const [note, setNote] = useState(currentFollowUpNote || '');
    const [saving, setSaving] = useState(false);

    const followUp = currentFollowUpDate ? new Date(currentFollowUpDate) : null;
    const isOverdue = followUp ? isPast(followUp) : false;

    const setQuickFollowUp = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        d.setHours(9, 0, 0, 0);
        setDate(d.toISOString().slice(0, 16));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/crm/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nextFollowUpDate: date || null,
                    nextFollowUpNote: note || null,
                }),
            });
            if (!res.ok) throw new Error('Failed to update follow-up');
            toast.success(date ? 'Follow-up scheduled' : 'Follow-up cleared');
            onUpdated();
        } catch {
            toast.error('Failed to update follow-up');
        } finally {
            setSaving(false);
        }
    };

    const handleClear = async () => {
        setDate('');
        setNote('');
        setSaving(true);
        try {
            const res = await fetch(`/api/crm/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nextFollowUpDate: null, nextFollowUpNote: null }),
            });
            if (!res.ok) throw new Error('Failed to clear');
            toast.success('Follow-up cleared');
            onUpdated();
        } catch {
            toast.error('Failed to clear follow-up');
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = (date || '') !== (currentFollowUpDate?.slice(0, 16) || '')
        || (note || '') !== (currentFollowUpNote || '');

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Follow-Up
                </label>
                {followUp && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500" onClick={handleClear} disabled={saving}>
                        <X className="h-3 w-3 mr-1" /> Clear
                    </Button>
                )}
            </div>

            {/* Current follow-up display */}
            {followUp && (
                <div className={cn(
                    'text-sm px-3 py-2 rounded-md',
                    isOverdue ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-muted'
                )}>
                    <div className="flex items-center gap-1.5">
                        {isOverdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        <span className="font-medium">
                            {isOverdue ? 'Overdue' : 'Scheduled'}: {formatDistanceToNow(followUp, { addSuffix: true })}
                        </span>
                    </div>
                    {currentFollowUpNote && (
                        <p className="text-xs mt-1 opacity-80">{currentFollowUpNote}</p>
                    )}
                </div>
            )}

            {/* Quick buttons */}
            <div className="flex gap-1.5 flex-wrap">
                {QUICK_FOLLOW_UPS.map((q) => (
                    <Button key={q.days} type="button" variant="outline" size="sm" className="h-7 text-xs"
                        onClick={() => setQuickFollowUp(q.days)}>
                        {q.label}
                    </Button>
                ))}
            </div>

            {/* Date/time input */}
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-sm" />

            {/* Note */}
            {date && (
                <Input
                    placeholder="Follow-up reminder note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-8 text-sm"
                />
            )}

            {/* Save button */}
            {hasChanges && (
                <Button size="sm" className="w-full h-8" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Follow-Up'}
                </Button>
            )}
        </div>
    );
}
