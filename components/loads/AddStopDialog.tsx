'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LoadStop {
  stopType: 'PICKUP' | 'DELIVERY';
  sequence: number;
  company?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  earliestArrival?: string;
  latestArrival?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
  specialInstructions?: string;
}

interface AddStopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStop: (stop: Omit<LoadStop, 'sequence'>) => void;
  nextSequence: number;
  existingStops: LoadStop[];
}

export default function AddStopDialog({
  open,
  onOpenChange,
  onAddStop,
  nextSequence,
  existingStops,
}: AddStopDialogProps) {
  const [stopType, setStopType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [earliestArrival, setEarliestArrival] = useState('');
  const [latestArrival, setLatestArrival] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || !city || !state || !zip) {
      return;
    }

    onAddStop({
      stopType,
      company: company || undefined,
      address,
      city,
      state: state.toUpperCase().slice(0, 2),
      zip,
      phone: phone || undefined,
      earliestArrival: earliestArrival || undefined,
      latestArrival: latestArrival || undefined,
      contactName: contactName || undefined,
      contactPhone: contactPhone || undefined,
      notes: notes || undefined,
      specialInstructions: specialInstructions || undefined,
    });

    // Reset form
    setCompany('');
    setAddress('');
    setCity('');
    setState('');
    setZip('');
    setPhone('');
    setEarliestArrival('');
    setLatestArrival('');
    setContactName('');
    setContactPhone('');
    setNotes('');
    setSpecialInstructions('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset form
    setCompany('');
    setAddress('');
    setCity('');
    setState('');
    setZip('');
    setPhone('');
    setEarliestArrival('');
    setLatestArrival('');
    setContactName('');
    setContactPhone('');
    setNotes('');
    setSpecialInstructions('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Stop</DialogTitle>
          <DialogDescription>
            Add a new pickup or delivery stop to this load. Stop will be added as sequence {nextSequence}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stopType">Stop Type *</Label>
              <Select
                value={stopType}
                onValueChange={(value) => setStopType(value as 'PICKUP' | 'DELIVERY')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PICKUP">Pickup</SelectItem>
                  <SelectItem value="DELIVERY">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="ABC Warehouse"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              placeholder="123 Main St"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="Dallas"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                placeholder="TX"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code *</Label>
              <Input
                id="zip"
                placeholder="75001"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="555-0100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                placeholder="John Doe"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="555-0100"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="earliestArrival">Earliest Arrival</Label>
              <Input
                id="earliestArrival"
                type="datetime-local"
                value={earliestArrival}
                onChange={(e) => setEarliestArrival(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="latestArrival">Latest Arrival</Label>
              <Input
                id="latestArrival"
                type="datetime-local"
                value={latestArrival}
                onChange={(e) => setLatestArrival(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Additional notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <Input
              id="specialInstructions"
              placeholder="Special instructions for this stop"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Add Stop
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

