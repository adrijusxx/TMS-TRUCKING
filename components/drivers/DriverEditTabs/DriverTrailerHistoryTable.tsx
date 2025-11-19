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

interface DriverTrailerHistoryTableProps {
  driver: any;
  trailers: Array<{ id: string; trailerNumber: string }>;
}

export default function DriverTrailerHistoryTable({
  driver,
  trailers,
}: DriverTrailerHistoryTableProps) {
  const [history, setHistory] = useState(driver.trailerHistory || []);
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({
    trailerId: '',
    pickupDate: '',
    dropOffDate: '',
  });

  const handleAdd = () => {
    if (!newEntry.trailerId) return;

    const trailer = trailers.find((t) => t.id === newEntry.trailerId);
    const entry = {
      id: `temp-${Date.now()}`,
      trailerId: newEntry.trailerId,
      trailer: { trailerNumber: trailer?.trailerNumber || '' },
      pickupDate: newEntry.pickupDate || null,
      dropOffDate: newEntry.dropOffDate || null,
    };

    setHistory([entry, ...history]);
    setNewEntry({
      trailerId: '',
      pickupDate: '',
      dropOffDate: '',
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
          Add Trailer
        </Button>
      </div>

      {isAdding && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Driver</Label>
              <Input
                value={`${driver.user.firstName} ${driver.user.lastName}`}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Trailer</Label>
              <Select
                value={newEntry.trailerId}
                onValueChange={(value) => setNewEntry({ ...newEntry, trailerId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {trailers.map((trailer) => (
                    <SelectItem key={trailer.id} value={trailer.id}>
                      {trailer.trailerNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <TableHead>Driver</TableHead>
              <TableHead>Trailer</TableHead>
              <TableHead>Pickup Date</TableHead>
              <TableHead>Drop Off Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No trailer history
                </TableCell>
              </TableRow>
            ) : (
              history.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {driver.user.firstName} {driver.user.lastName}
                  </TableCell>
                  <TableCell>{entry.trailer?.trailerNumber || '-'}</TableCell>
                  <TableCell>
                    {entry.pickupDate ? formatDate(entry.pickupDate) : '-'}
                  </TableCell>
                  <TableCell>
                    {entry.dropOffDate ? formatDate(entry.dropOffDate) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

