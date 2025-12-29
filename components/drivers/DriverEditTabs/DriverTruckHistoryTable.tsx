'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface DriverTruckHistoryTableProps {
  driver: any;
  trucks: Array<{ id: string; truckNumber: string }>;
}

export default function DriverTruckHistoryTable({
  driver,
  trucks,
}: DriverTruckHistoryTableProps) {
  const [history, setHistory] = useState(driver.truckHistory || []);
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({
    truckId: '',
    date: '',
    isActive: true,
    pickupDate: '',
    dropOffDate: '',
    pickupMile: '',
    dropOffMile: '',
    note: '',
  });

  const handleAdd = () => {
    if (!newEntry.truckId || !newEntry.date) return;

    const truck = trucks.find((t) => t.id === newEntry.truckId);
    const entry = {
      id: `temp-${Date.now()}`,
      truckId: newEntry.truckId,
      truck: { truckNumber: truck?.truckNumber || '' },
      date: newEntry.date,
      isActive: newEntry.isActive,
      pickupDate: newEntry.pickupDate || null,
      dropOffDate: newEntry.dropOffDate || null,
      pickupMile: newEntry.pickupMile ? parseFloat(newEntry.pickupMile) : null,
      dropOffMile: newEntry.dropOffMile ? parseFloat(newEntry.dropOffMile) : null,
      note: newEntry.note || null,
    };

    setHistory([entry, ...history]);
    setNewEntry({
      truckId: '',
      date: '',
      isActive: true,
      pickupDate: '',
      dropOffDate: '',
      pickupMile: '',
      dropOffMile: '',
      note: '',
    });
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Truck
        </Button>
      </div>

      {isAdding && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Truck</Label>
              <Select
                value={newEntry.truckId}
                onValueChange={(value) => setNewEntry({ ...newEntry, truckId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {trucks.map((truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.truckNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Pickup Date</Label>
              <Input
                type="date"
                value={newEntry.pickupDate}
                onChange={(e) => setNewEntry({ ...newEntry, pickupDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Drop Off Date</Label>
              <Input
                type="date"
                value={newEntry.dropOffDate}
                onChange={(e) => setNewEntry({ ...newEntry, dropOffDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Pickup Mile</Label>
              <Input
                type="number"
                value={newEntry.pickupMile}
                onChange={(e) => setNewEntry({ ...newEntry, pickupMile: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Drop Off Mile</Label>
              <Input
                type="number"
                value={newEntry.dropOffMile}
                onChange={(e) => setNewEntry({ ...newEntry, dropOffMile: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Input
                value={newEntry.note}
                onChange={(e) => setNewEntry({ ...newEntry, note: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={newEntry.isActive}
                onCheckedChange={(checked) =>
                  setNewEntry({ ...newEntry, isActive: checked as boolean })
                }
              />
              <Label htmlFor="isActive">Is Active</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleAdd} size="sm">
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Truck</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Is Active</TableHead>
              <TableHead>Pickup Date</TableHead>
              <TableHead>Drop Off Date</TableHead>
              <TableHead>Pickup Mile</TableHead>
              <TableHead>Drop Off Mile</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No truck history
                </TableCell>
              </TableRow>
            ) : (
              history.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.truck?.truckNumber || '-'}</TableCell>
                  <TableCell>
                    {entry.date ? formatDate(entry.date) : '-'}
                  </TableCell>
                  <TableCell>{entry.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    {entry.pickupDate ? formatDate(entry.pickupDate) : '-'}
                  </TableCell>
                  <TableCell>
                    {entry.dropOffDate ? formatDate(entry.dropOffDate) : '-'}
                  </TableCell>
                  <TableCell>
                    {entry.pickupMile ? entry.pickupMile.toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    {entry.dropOffMile ? entry.dropOffMile.toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>{entry.note || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

