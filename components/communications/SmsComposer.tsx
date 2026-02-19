'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SmsComposerProps {
  /** Pre-fill the recipient number */
  defaultTo?: string;
  /** Callback after successful send */
  onSent?: () => void;
  /** Compact mode for inline/dialog usage */
  compact?: boolean;
}

export default function SmsComposer({ defaultTo, onSent, compact }: SmsComposerProps) {
  const [to, setTo] = useState(defaultTo || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [lastStatus, setLastStatus] = useState<'sent' | 'error' | null>(null);

  const handleSend = async () => {
    if (!to || !message.trim()) {
      toast.error('Recipient number and message are required');
      return;
    }

    setSending(true);
    setLastStatus(null);

    try {
      const res = await fetch('/api/integrations/netsapiens/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message: message.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to send SMS');
      }

      setLastStatus('sent');
      toast.success('SMS sent successfully');
      setMessage('');
      onSent?.();
    } catch (error: any) {
      setLastStatus('error');
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const charCount = message.length;
  const segmentCount = Math.ceil(charCount / 160) || 1;

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Recipient Phone Number</Label>
        <Input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="e.g. 15551234567"
          disabled={!!defaultTo}
        />
      </div>

      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          rows={3}
          maxLength={1600}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{charCount} chars ({segmentCount} segment{segmentCount > 1 ? 's' : ''})</span>
          {lastStatus === 'sent' && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" /> Sent
            </span>
          )}
          {lastStatus === 'error' && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-3 w-3" /> Failed
            </span>
          )}
        </div>
      </div>

      <Button
        onClick={handleSend}
        disabled={sending || !to || !message.trim()}
        className="w-full"
      >
        {sending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        {sending ? 'Sending...' : 'Send SMS'}
      </Button>
    </div>
  );

  if (compact) return content;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send SMS</CardTitle>
        <CardDescription>Send a text message via the company PBX</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
