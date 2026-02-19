'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Phone, MessageSquare, Voicemail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SmsComposer from './SmsComposer';
import { useClickToCall } from '@/lib/hooks/useClickToCall';

export default function QuickActions() {
  const [dialNumber, setDialNumber] = useState('');
  const [dialOpen, setDialOpen] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const { initiateCall, calling } = useClickToCall();

  const { data: callsData } = useQuery({
    queryKey: ['netsapiens-active-calls-count'],
    queryFn: async () => {
      const res = await fetch('/api/integrations/netsapiens/calls');
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    refetchInterval: 10000,
  });

  const handleDial = async () => {
    if (!dialNumber) {
      toast.error('Enter a phone number');
      return;
    }
    await initiateCall(dialNumber);
    setDialNumber('');
    setDialOpen(false);
  };

  const activeCalls = callsData?.count ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Make Call */}
          <Dialog open={dialOpen} onOpenChange={setDialOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <Phone className="h-6 w-6" />
                <span className="text-sm font-medium">Make Call</span>
                {activeCalls > 0 && (
                  <Badge className="bg-green-600">{activeCalls} active</Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Make a Call</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  placeholder="Enter phone number..."
                  onKeyDown={(e) => e.key === 'Enter' && handleDial()}
                />
                <Button onClick={handleDial} disabled={calling || !dialNumber} className="w-full">
                  {calling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                  {calling ? 'Dialing...' : 'Call'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Send SMS */}
          <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                <span className="text-sm font-medium">Send SMS</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send SMS</DialogTitle>
              </DialogHeader>
              <SmsComposer compact onSent={() => setSmsOpen(false)} />
            </DialogContent>
          </Dialog>

          {/* Voicemail shortcut */}
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => {
              // Scroll to voicemail tab or switch tab
              const el = document.getElementById('tab-voicemail');
              el?.click();
            }}
          >
            <Voicemail className="h-6 w-6" />
            <span className="text-sm font-medium">Voicemail</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
