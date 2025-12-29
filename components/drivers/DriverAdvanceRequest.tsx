'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Advance {
  id: string;
  amount: number;
  requestDate: string;
  approvalStatus: string;
  approvedAt: string | null;
  notes: string;
}

export function DriverAdvanceRequest({ driverId }: { driverId: string }) {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchAdvances();
  }, [driverId]);

  const fetchAdvances = async () => {
    try {
      const response = await fetch(`/api/advances?driverId=${driverId}`);
      const data = await response.json();

      if (data.success) {
        setAdvances(data.data);
      }
    } catch (error) {
      console.error('Error fetching advances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/advances/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          amount: parseFloat(amount),
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Advance request submitted successfully');
        setDialogOpen(false);
        setAmount('');
        setNotes('');
        fetchAdvances();
      } else {
        alert('Error: ' + (data.error?.message || 'Failed to submit request'));
      }
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to submit request'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') return <Badge className="bg-green-500">Approved</Badge>;
    if (status === 'PENDING') return <Badge className="bg-yellow-500">Pending</Badge>;
    if (status === 'REJECTED') return <Badge variant="destructive">Rejected</Badge>;
    if (status === 'PAID') return <Badge className="bg-blue-500">Paid</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Request New Advance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Request Advance</CardTitle>
              <CardDescription>Request a cash advance on your next settlement</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Advance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Request Cash Advance</DialogTitle>
                    <DialogDescription>
                      Enter the amount you need and a brief explanation
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="1"
                        max="10000"
                        placeholder="500.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Reason (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="e.g., Fuel advance, emergency expense, etc."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Request'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Advance History */}
      <Card>
        <CardHeader>
          <CardTitle>Advance History</CardTitle>
          <CardDescription>Your advance requests and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : advances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No advance requests yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Approved Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advances.map((advance) => (
                  <TableRow key={advance.id}>
                    <TableCell>
                      {new Date(advance.requestDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${advance.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(advance.approvalStatus)}</TableCell>
                    <TableCell className="max-w-xs truncate">{advance.notes || '-'}</TableCell>
                    <TableCell>
                      {advance.approvedAt
                        ? new Date(advance.approvedAt).toLocaleDateString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





