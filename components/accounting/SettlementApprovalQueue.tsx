'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Settlement {
  id: string;
  settlementNumber: string;
  driver: {
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  createdAt: string;
}

export function SettlementApprovalQueue() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      const response = await fetch('/api/settlements/pending-approval');
      const data = await response.json();

      if (data.success) {
        setSettlements(data.data);
      }
    } catch (error) {
      console.error('Error fetching settlements:', error);
      alert('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (settlementId: string) => {
    setProcessingId(settlementId);
    try {
      const response = await fetch(`/api/settlements/${settlementId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: true,
          paymentMethod: 'DIRECT_DEPOSIT',
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Settlement approved successfully');
        fetchSettlements();
      } else {
        throw new Error(data.error?.message || 'Failed to approve settlement');
      }
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to approve settlement'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (settlementId: string) => {
    const notes = prompt('Please provide a reason for rejection:');
    if (!notes) return;

    setProcessingId(settlementId);
    try {
      const response = await fetch(`/api/settlements/${settlementId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: false,
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Settlement rejected successfully');
        fetchSettlements();
      } else {
        throw new Error(data.error?.message || 'Failed to reject settlement');
      }
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to reject settlement'));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settlement Approval Queue</CardTitle>
          <CardDescription>Loading settlements...</CardDescription>
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
    <Card>
      <CardHeader>
        <CardTitle>Settlement Approval Queue</CardTitle>
        <CardDescription>
          {settlements.length} settlement{settlements.length !== 1 ? 's' : ''} pending approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        {settlements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No settlements pending approval</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Settlement #</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((settlement) => (
                <TableRow key={settlement.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/settlements/${settlement.id}`}
                      className="hover:underline"
                    >
                      {settlement.settlementNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {settlement.driver.user.firstName} {settlement.driver.user.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        #{settlement.driver.driverNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {new Date(settlement.periodStart).toLocaleDateString()} -{' '}
                      {new Date(settlement.periodEnd).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${(settlement.grossPay ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    -${(settlement.totalDeductions ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    ${(settlement.netPay ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(settlement.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/api/settlements/${settlement.id}/breakdown`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(settlement.id)}
                        disabled={processingId === settlement.id}
                      >
                        {processingId === settlement.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(settlement.id)}
                        disabled={processingId === settlement.id}
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
  );
}

