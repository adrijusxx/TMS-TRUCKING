'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { DormantEquipment } from '@/lib/managers/fleet-monitoring/types';

interface Props {
  equipment: DormantEquipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function MarkOOSDialog({ equipment, open, onOpenChange, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await fetch('/api/fleet/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: equipment.id,
          equipmentType: equipment.type,
          longTermOutOfService: true,
          outOfServiceReason: reason || undefined,
          expectedReturnDate: expectedReturn || undefined,
        }),
      });

      if (res.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to mark as OOS:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as Long-term Out of Service</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Mark <strong>{equipment.number}</strong> ({equipment.type}) as long-term out of service.
            This will exclude it from dormant equipment alerts.
          </p>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Engine rebuild, waiting for parts..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedReturn">Expected Return Date</Label>
            <Input
              id="expectedReturn"
              type="date"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Mark as OOS'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
