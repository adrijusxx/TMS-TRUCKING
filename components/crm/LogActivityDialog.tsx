'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Phone, MessageSquare, Mail, Calendar } from 'lucide-react';

interface LogActivityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId: string;
    activityType: 'CALL' | 'SMS' | 'EMAIL';
    onSuccess?: () => void;
}

const typeConfig = {
    CALL: { icon: Phone, label: 'Log Phone Call', color: 'text-blue-600' },
    SMS: { icon: MessageSquare, label: 'Log SMS/Text', color: 'text-green-600' },
    EMAIL: { icon: Mail, label: 'Log Email', color: 'text-purple-600' },
};

const QUICK_FOLLOW_UPS = [
    { label: 'Tomorrow', days: 1 },
    { label: 'In 3 days', days: 3 },
    { label: 'Next week', days: 7 },
    { label: 'In 2 weeks', days: 14 },
];

export default function LogActivityDialog({
    open, onOpenChange, leadId, activityType, onSuccess,
}: LogActivityDialogProps) {
    const [notes, setNotes] = useState('');
    const [duration, setDuration] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpNote, setFollowUpNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const config = typeConfig[activityType];
    const Icon = config.icon;

    const setQuickFollowUp = (days: number) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        date.setHours(9, 0, 0, 0);
        setFollowUpDate(date.toISOString().slice(0, 16));
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/log-activity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: activityType,
                    content: notes || undefined,
                    duration: duration ? parseInt(duration) : undefined,
                    nextFollowUpDate: followUpDate || undefined,
                    nextFollowUpNote: followUpNote || undefined,
                }),
            });
            if (!res.ok) throw new Error('Failed to log activity');

            toast.success(`${activityType.toLowerCase()} logged successfully`);
            resetForm();
            onOpenChange(false);
            onSuccess?.();
        } catch {
            toast.error('Failed to log activity');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setNotes('');
        setDuration('');
        setFollowUpDate('');
        setFollowUpNote('');
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        {config.label}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div>
                        <Label>Notes</Label>
                        <Textarea
                            placeholder={`What was discussed? Any key takeaways...`}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {activityType === 'CALL' && (
                        <div>
                            <Label>Duration (minutes)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 15"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                min={0}
                            />
                        </div>
                    )}

                    <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Label className="mb-0">Schedule Follow-Up</Label>
                        </div>
                        <div className="flex gap-2 mb-2 flex-wrap">
                            {QUICK_FOLLOW_UPS.map((q) => (
                                <Button
                                    key={q.days}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setQuickFollowUp(q.days)}
                                >
                                    {q.label}
                                </Button>
                            ))}
                            {followUpDate && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setFollowUpDate(''); setFollowUpNote(''); }}
                                    className="text-red-500"
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                        <Input
                            type="datetime-local"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                        />
                        {followUpDate && (
                            <div className="mt-2">
                                <Input
                                    placeholder="Follow-up reminder note (optional)"
                                    value={followUpNote}
                                    onChange={(e) => setFollowUpNote(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Log {activityType.charAt(0) + activityType.slice(1).toLowerCase()}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
