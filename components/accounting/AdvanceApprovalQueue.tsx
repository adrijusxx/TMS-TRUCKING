'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface DriverAdvance {
  id: string;
  amount: number;
  requestDate: string;
  notes?: string;
  driver: {
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  load?: {
    loadNumber: string;
  };
}

export function AdvanceApprovalQueue() {
  const [advances, setAdvances] = useState<DriverAdvance[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    advance: DriverAdvance | null;
  }>({ open: false, advance: null });
  const [paymentMethod, setPaymentMethod] = useState('ACH');
  const [paymentReference, setPaymentReference] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdvances();
  }, []);

  const fetchAdvances = async () => {
    try {
      const response = await fetch(apiUrl('/api/advances?status=PENDING'));
      const data = await response.json();

      if (data.success) {
        setAdvances(data.data);
      }
    } catch (error) {
      console.error('Error fetching advances:', error);
      setError('Failed to load advance requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalDialog.advance) return;

    setProcessingId(approvalDialog.advance.id);
    try {
      const response = await fetch(apiUrl(`/api/advances/${approvalDialog.advance.id}/approve`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: true,
          paymentMethod,
          paymentReference,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Advance approved successfully');
        setApprovalDialog({ open: false, advance: null });
        setPaymentReference('');
        fetchAdvances();
      } else {
        throw new Error(data.error?.message || 'Failed to approve advance');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve advance');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (advanceId: string) => {
    const rejectionReason = prompt('Please provide a reason for rejection:');
    if (!rejectionReason) return;

    setProcessingId(advanceId);
    try {
      const response = await fetch(apiUrl(`/api/advances/${advanceId}/approve`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: false,
          rejectionReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Advance rejected');
        fetchAdvances();
      } else {
        throw new Error(data.error?.message || 'Failed to reject advance');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject advance');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Advance Approval Queue</CardTitle>
          <CardDescription>Loading advance requests...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Advance Approval Queue</CardTitle>
          <CardDescription>
            {advances.length} advance request{advances.length !== 1 ? 's' : ''} pending approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {advances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No advance requests pending approval</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Load</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advances.map((advance) => (
                  <TableRow key={advance.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {advance.driver.user.firstName} {advance.driver.user.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          #{advance.driver.driverNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${(advance.amount ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {advance.load ? (
                        <span className="text-sm">{advance.load.loadNumber}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">General</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{advance.notes || '-'}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(advance.requestDate), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setApprovalDialog({ open: true, advance })}
                          disabled={processingId === advance.id}
                        >
                          {processingId === advance.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(advance.id)}
                          disabled={processingId === advance.id}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={approvalDialog.open} onOpenChange={(open) => setApprovalDialog({ open, advance: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Advance Request</DialogTitle>
            <DialogDescription>
              Approve ${(approvalDialog.advance?.amount ?? 0).toLocaleString()} advance for{' '}
              {approvalDialog.advance?.driver.user.firstName}{' '}
              {approvalDialog.advance?.driver.user.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACH">ACH Transfer</SelectItem>
                  <SelectItem value="WIRE">Wire Transfer</SelectItem>
                  <SelectItem value="CHECK">Check</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentReference">Payment Reference (Optional)</Label>
              <Input
                id="paymentReference"
                placeholder="Transaction ID, Check #, etc."
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog({ open: false, advance: null })}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={!!processingId}>
              {processingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Approve Advance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

