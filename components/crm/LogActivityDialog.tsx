'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Phone, MessageSquare, Mail, Calendar, Send } from 'lucide-react';

interface LogActivityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId: string;
    activityType: 'CALL' | 'SMS' | 'EMAIL';
    onSuccess?: () => void;
}

const typeConfig = {
    CALL: { icon: Phone, label: 'Log Phone Call', color: 'text-blue-600' },
    SMS: { icon: MessageSquare, label: 'Send SMS', color: 'text-green-600' },
    EMAIL: { icon: Mail, label: 'Send Email', color: 'text-purple-600' },
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
    const [message, setMessage] = useState('');
    const [subject, setSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
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
            const followUpPayload = {
                nextFollowUpDate: followUpDate || undefined,
                nextFollowUpNote: followUpNote || undefined,
            };

            if (activityType === 'SMS') {
                if (!message.trim()) {
                    toast.error('Please enter a message');
                    return;
                }
                const res = await fetch(`/api/crm/leads/${leadId}/send-sms`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: message.trim(), ...followUpPayload }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to send SMS');
                toast.success('SMS sent successfully');
            } else if (activityType === 'EMAIL') {
                if (!subject.trim() || !emailBody.trim()) {
                    toast.error('Subject and body are required');
                    return;
                }
                const res = await fetch(`/api/crm/leads/${leadId}/send-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subject: subject.trim(),
                        body: emailBody.trim(),
                        ...followUpPayload,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to send email');
                toast.success('Email sent successfully');
            } else {
                // CALL — log only (calls are initiated via click-to-call)
                const res = await fetch(`/api/crm/leads/${leadId}/log-activity`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'CALL',
                        content: notes || undefined,
                        duration: duration ? parseInt(duration) : undefined,
                        ...followUpPayload,
                    }),
                });
                if (!res.ok) throw new Error('Failed to log call');
                toast.success('Call logged successfully');
            }

            resetForm();
            onOpenChange(false);
            onSuccess?.();
        } catch (err: any) {
            toast.error(err.message || 'Operation failed');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setNotes('');
        setMessage('');
        setSubject('');
        setEmailBody('');
        setDuration('');
        setFollowUpDate('');
        setFollowUpNote('');
    };

    const getButtonLabel = () => {
        if (isLoading) return activityType === 'CALL' ? 'Logging...' : 'Sending...';
        if (activityType === 'CALL') return 'Log Call';
        if (activityType === 'SMS') return 'Send SMS';
        return 'Send Email';
    };

    const isSubmitDisabled = () => {
        if (isLoading) return true;
        if (activityType === 'SMS') return !message.trim();
        if (activityType === 'EMAIL') return !subject.trim() || !emailBody.trim();
        return false;
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
                    {/* CALL-specific fields */}
                    {activityType === 'CALL' && (
                        <>
                            <div>
                                <Label>Notes</Label>
                                <Textarea
                                    placeholder="What was discussed? Any key takeaways..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>
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
                        </>
                    )}

                    {/* SMS-specific fields */}
                    {activityType === 'SMS' && (
                        <div>
                            <Label>Message</Label>
                            <Textarea
                                placeholder="Type your SMS message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                maxLength={1600}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {message.length}/1600 characters
                                {message.length > 160 && ` (${Math.ceil(message.length / 160)} segments)`}
                            </p>
                        </div>
                    )}

                    {/* EMAIL-specific fields */}
                    {activityType === 'EMAIL' && (
                        <>
                            <div>
                                <Label>Subject</Label>
                                <Input
                                    placeholder="Email subject..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Body</Label>
                                <Textarea
                                    placeholder="Type your email message..."
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    rows={5}
                                />
                            </div>
                        </>
                    )}

                    {/* Follow-up section (shared) */}
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
                    <Button onClick={handleSubmit} disabled={isSubmitDisabled()}>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : activityType !== 'CALL' ? (
                            <Send className="h-4 w-4 mr-2" />
                        ) : null}
                        {getButtonLabel()}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
