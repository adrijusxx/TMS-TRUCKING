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
      // TODO: Create API endpoint for driver settlements
      // For now, using mock data
      const mockData: Settlement[] = [
        {
          id: '1',
          settlementNumber: 'SET-2025-001',
          periodStart: '2025-11-11',
          periodEnd: '2025-11-17',
          grossPay: 3500,
          totalDeductions: 850,
          netPay: 2650,
          status: 'PAID',
          approvalStatus: 'APPROVED',
          paidAt: '2025-11-20',
          createdAt: '2025-11-18',
        },
        {
          id: '2',
          settlementNumber: 'SET-2025-002',
          periodStart: '2025-11-18',
          periodEnd: '2025-11-24',
          grossPay: 4200,
          totalDeductions: 920,
          netPay: 3280,
          status: 'APPROVED',
          approvalStatus: 'APPROVED',
          paidAt: null,
          createdAt: '2025-11-25',
        },
      ];
      setSettlements(mockData);
    } catch (error) {
      console.error('Error fetching settlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PAID') return <Badge className="bg-green-500">Paid</Badge>;
    if (status === 'APPROVED') return <Badge className="bg-blue-500">Approved</Badge>;
    if (status === 'PENDING') return <Badge className="bg-yellow-500">Pending</Badge>;
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
                  <TableCell className="text-right text-red-600">
                    -${settlement.totalDeductions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
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
                      <Link href={`/api/settlements/${settlement.id}/breakdown`}>
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





