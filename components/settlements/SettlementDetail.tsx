'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { SettlementStatus } from '@prisma/client';
import {
  ArrowLeft,
  DollarSign,
  User,
  Calendar,
  FileText,
  Package,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface SettlementDetailProps {
  settlementId: string;
}

async function fetchSettlement(id: string) {
  const response = await fetch(apiUrl(`/api/settlements/${id}`));
  if (!response.ok) throw new Error('Failed to fetch settlement');
  return response.json();
}

async function updateSettlement(id: string, data: any) {
  const response = await fetch(apiUrl(`/api/settlements/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update settlement');
  }
  return response.json();
}

const statusColors: Record<SettlementStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  DISPUTED: 'bg-red-100 text-red-800 border-red-200',
};

function formatStatus(status: SettlementStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function SettlementDetail({ settlementId }: SettlementDetailProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SettlementStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['settlement', settlementId],
    queryFn: () => fetchSettlement(settlementId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateSettlement(settlementId, data),
    onSuccess: () => {
      toast.success('Settlement updated successfully');
      queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
      setIsEditing(false);
      setStatus('');
      setNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update settlement');
    },
  });

  const settlement = data?.data;
  if (!settlement) return null;

  const handleSave = () => {
    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    updateMutation.mutate(updateData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settlements">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{settlement.settlementNumber}</h1>
            <p className="text-muted-foreground">Settlement Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColors[settlement.status as SettlementStatus]}>
            {formatStatus(settlement.status)}
          </Badge>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                Save
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Driver Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Driver
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">
              {settlement.driver.user.firstName} {settlement.driver.user.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {settlement.driver.driverNumber}
            </p>
            <p className="text-sm text-muted-foreground">
              {settlement.driver.user.email}
            </p>
            <Link href={`/dashboard/drivers/${settlement.driverId}`}>
              <Button variant="ghost" size="sm" className="mt-2">
                View Driver
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Period */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{formatDate(settlement.periodStart)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium">{formatDate(settlement.periodEnd)}</p>
            </div>
            {settlement.paidDate && (
              <div>
                <p className="text-sm text-muted-foreground">Paid Date</p>
                <p className="font-medium">{formatDate(settlement.paidDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Gross Pay</span>
              <span className="font-medium">{formatCurrency(settlement.grossPay)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Deductions</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(settlement.deductions)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Advances</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(settlement.advances)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Net Pay</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(settlement.netPay)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Status Update */}
        {isEditing && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as SettlementStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="DISPUTED">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {settlement.notes && !isEditing && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{settlement.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Loads Included */}
        {settlement.loads && settlement.loads.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Loads Included ({settlement.loads.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Load #</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Driver Pay</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlement.loads.map((load: any) => (
                      <TableRow key={load.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dashboard/loads/${load.id}`}
                            className="text-primary hover:underline"
                          >
                            {load.loadNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {load.pickupCity}, {load.pickupState} → {load.deliveryCity},{' '}
                          {load.deliveryState}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(load.revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(load.driverPay || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {(load.route?.totalDistance || load.totalMiles || 0) ? `${(load.route?.totalDistance || load.totalMiles || 0)} mi` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {load.deliveredAt ? formatDate(load.deliveredAt) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/loads/${load.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

