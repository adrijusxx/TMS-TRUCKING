'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OOS_REASON_CATEGORIES } from '@/lib/managers/fleet-monitoring/types';
import type { OOSEquipmentRef } from '@/lib/managers/fleet-monitoring/types';

interface Props {
  equipment: OOSEquipmentRef;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function MarkOOSDialog({ equipment, open, onOpenChange, onSuccess }: Props) {
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      const reason = category
        ? notes ? `${category}: ${notes}` : category
        : notes || undefined;

      const res = await fetch('/api/fleet/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: equipment.id,
          equipmentType: equipment.type,
          longTermOutOfService: true,
          outOfServiceReason: reason,
          expectedReturnDate: expectedReturn || undefined,
        }),
      });

      if (res.ok) {
        setCategory('');
        setNotes('');
        setExpectedReturn('');
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
            <Label>Reason Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {OOS_REASON_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Engine rebuild at Smith's Garage..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
