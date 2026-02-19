'use client';

import { useState } from 'react';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, MessageSquare, Send, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface BulkSmsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedIds: string[];
    onSuccess: () => void;
}

export default function BulkSmsDialog({
    open, onOpenChange, selectedIds, onSuccess,
}: BulkSmsDialogProps) {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

    const handleSubmit = async () => {
        if (!message.trim()) {
            toast.error('Please enter a message');
            return;
        }

        setIsSubmitting(true);
        setProgress(10);
        setResult(null);

        try {
            const res = await fetch('/api/crm/leads/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ids: selectedIds,
                    action: 'send-sms',
                    payload: { message: message.trim() },
                }),
            });

            setProgress(90);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Bulk SMS failed');

            setResult({ sent: data.sent || 0, failed: data.failed || 0 });
            setProgress(100);

            if (data.sent > 0) {
                toast.success(`SMS sent to ${data.sent} lead(s)`);
            }
            if (data.failed > 0) {
                toast.warning(`${data.failed} lead(s) failed (no phone or send error)`);
            }

            onSuccess();
        } catch (err: any) {
            toast.error(err.message || 'Bulk SMS failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setMessage('');
            setProgress(0);
            setResult(null);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        Send SMS to {selectedIds.length} Lead(s)
                    </DialogTitle>
                    <DialogDescription>
                        The same message will be sent to all selected leads with a phone number.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="flex items-start gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                        <span className="text-yellow-800">
                            Leads without a phone number will be skipped.
                        </span>
                    </div>

                    <div>
                        <Label>Message</Label>
                        <Textarea
                            placeholder="Type your SMS message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            maxLength={1600}
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {message.length}/1600 characters
                            {message.length > 160 && ` (${Math.ceil(message.length / 160)} segments)`}
                        </p>
                    </div>

                    {isSubmitting && (
                        <Progress value={progress} className="h-2" />
                    )}

                    {result && (
                        <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1">
                            <p className="font-medium">Results:</p>
                            <p className="text-green-600">{result.sent} sent successfully</p>
                            {result.failed > 0 && (
                                <p className="text-red-600">{result.failed} failed</p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        {result ? 'Close' : 'Cancel'}
                    </Button>
                    {!result && (
                        <Button onClick={handleSubmit} disabled={isSubmitting || !message.trim()}>
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            {isSubmitting ? 'Sending...' : `Send to ${selectedIds.length} Lead(s)`}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
