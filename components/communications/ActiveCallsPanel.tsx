'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Loader2, Phone, PhoneOff, PhoneForwarded, Pause, Play,
  ArrowRightLeft, Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface ActiveCall {
  callid: string;
  orig_from_user?: string;
  orig_from_name?: string;
  orig_to_user?: string;
  orig_to_name?: string;
  time_start?: string;
  duration?: number;
  direction?: string;
  state?: string;
}

function CallDuration({ startTime }: { startTime?: string }) {
  const [, setTick] = useState(0);

  // Re-render every second to update duration
  useState(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  });

  if (!startTime) return <span>--:--</span>;

  const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return <span>{mins}:{secs.toString().padStart(2, '0')}</span>;
}

function CallRow({ call }: { call: ActiveCall }) {
  const [transferTarget, setTransferTarget] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string, target?: string) => {
    setActionLoading(action);
    try {
      if (action === 'disconnect') {
        const res = await fetch(`/api/integrations/netsapiens/calls?callId=${call.callid}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to disconnect');
        toast.success('Call disconnected');
      } else {
        const res = await fetch('/api/integrations/netsapiens/calls', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callId: call.callid, action, target }),
        });
        if (!res.ok) throw new Error(`Failed to ${action}`);
        toast.success(`Call ${action} successful`);
      }
      setShowTransfer(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const fromDisplay = call.orig_from_name || call.orig_from_user || 'Unknown';
  const toDisplay = call.orig_to_name || call.orig_to_user || 'Unknown';

  return (
    <div className="p-3 rounded-lg border space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-green-600 animate-pulse" />
          <div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{fromDisplay}</span>
              <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{toDisplay}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              {call.direction && (
                <Badge variant="outline" className="text-xs py-0">
                  {call.direction}
                </Badge>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <CallDuration startTime={call.time_start} />
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon" title="Hold"
            onClick={() => handleAction('hold')}
            disabled={!!actionLoading}
          >
            {actionLoading === 'hold' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost" size="icon" title="Transfer"
            onClick={() => setShowTransfer(!showTransfer)}
            disabled={!!actionLoading}
          >
            <PhoneForwarded className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon" title="Disconnect"
            onClick={() => handleAction('disconnect')}
            disabled={!!actionLoading}
          >
            {actionLoading === 'disconnect' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4 text-destructive" />}
          </Button>
        </div>
      </div>

      {showTransfer && (
        <div className="flex items-center gap-2 pl-7">
          <Input
            value={transferTarget}
            onChange={(e) => setTransferTarget(e.target.value)}
            placeholder="Transfer to number or ext..."
            className="h-8 text-sm"
          />
          <Button
            size="sm" variant="outline"
            onClick={() => handleAction('transfer', transferTarget)}
            disabled={!transferTarget || !!actionLoading}
          >
            Transfer
          </Button>
        </div>
      )}
    </div>
  );
}

interface ActiveCallsPanelProps {
  /** Poll interval in ms (default 5000) */
  pollInterval?: number;
}

export default function ActiveCallsPanel({ pollInterval = 5000 }: ActiveCallsPanelProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['netsapiens-active-calls'],
    queryFn: async () => {
      const res = await fetch('/api/integrations/netsapiens/calls');
      if (!res.ok) throw new Error('Failed to load active calls');
      return res.json();
    },
    refetchInterval: pollInterval,
  });

  const calls: ActiveCall[] = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Active Calls
          {calls.length > 0 && (
            <Badge className="ml-2 bg-green-600">{calls.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>Live calls across the company PBX</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive text-center p-4">
            Failed to load active calls. Check PBX connection.
          </p>
        ) : calls.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center p-8">
            No active calls right now
          </p>
        ) : (
          <div className="space-y-2">
            {calls.map((call) => (
              <CallRow key={call.callid} call={call} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
