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
import { Eye, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Settlement {
  id: string;
  settlementNumber: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  status: string;
  approvalStatus: string;
  paidAt: string | null;
  createdAt: string;
}

export function DriverSettlementHistory({ driverId }: { driverId: string }) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettlements();
  }, [driverId]);

  const fetchSettlements = async () => {
    try {
      const response = await fetch(`/api/settlements?driverId=${driverId}&limit=20`);
      const result = await response.json();
      if (result.success && result.data) {
        setSettlements(result.data);
      }
    } catch (error) {
      console.error('Error fetching settlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PAID') return <Badge variant="success">Paid</Badge>;
    if (status === 'APPROVED') return <Badge variant="info">Approved</Badge>;
    if (status === 'PENDING') return <Badge variant="warning">Pending</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settlement History</CardTitle>
          <CardDescription>Loading...</CardDescription>
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
        <CardTitle>Settlement History</CardTitle>
        <CardDescription>View your past settlements and payment details</CardDescription>
      </CardHeader>
      <CardContent>
        {settlements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No settlements found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Settlement #</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((settlement) => (
                <TableRow key={settlement.id}>
                  <TableCell className="font-medium">{settlement.settlementNumber}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(settlement.periodStart).toLocaleDateString()} -{' '}
                      {new Date(settlement.periodEnd).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${settlement.grossPay.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-status-error">
                    -${settlement.totalDeductions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold text-status-success">
                    ${settlement.netPay.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                  <TableCell>
                    {settlement.paidAt
                      ? new Date(settlement.paidAt).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/settlements?settlementId=${settlement.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
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





