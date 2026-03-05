'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AddTripsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverId: string;
  existingLoadIds: string[];
  onAdd: (loadIds: string[]) => void;
  isAdding?: boolean;
}

export default function AddTripsDialog({
  open, onOpenChange, driverId, existingLoadIds, onAdd, isAdding,
}: AddTripsDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['available-loads-for-settlement', driverId],
    queryFn: async () => {
      const res = await fetch(
        `/api/loads?driverId=${driverId}&status=DELIVERED&limit=100`
      );
      if (!res.ok) throw new Error('Failed to fetch loads');
      return res.json();
    },
    enabled: open && !!driverId,
  });

  const existingSet = new Set(existingLoadIds);
  const availableLoads = (data?.data || []).filter(
    (l: any) => !existingSet.has(l.id)
  );

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === availableLoads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableLoads.map((l: any) => l.id)));
    }
  };

  const handleAdd = () => {
    onAdd(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Trips to Settlement</DialogTitle>
          <DialogDescription>
            Select delivered loads to add to this settlement. Only loads assigned to this driver are shown.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : availableLoads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No available delivered loads found for this driver.
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox
                      checked={availableLoads.length > 0 && selectedIds.size === availableLoads.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Load #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Driver Pay</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Miles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableLoads.map((load: any) => (
                  <TableRow key={load.id} className="text-sm">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(load.id)}
                        onCheckedChange={() => toggleOne(load.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{load.loadNumber}</TableCell>
                    <TableCell>{load.customer?.name || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(load.driverPay || 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(load.revenue || 0)}</TableCell>
                    <TableCell className="text-right">{load.totalMiles?.toLocaleString() || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={selectedIds.size === 0 || isAdding}>
            {isAdding ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Adding...</> : `Add ${selectedIds.size} Trip${selectedIds.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
