'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { AccountingSyncStatus } from '@prisma/client';

const syncStatusVariant: Record<AccountingSyncStatus, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "error" | "info" | "neutral"> = {
  NOT_SYNCED: 'neutral',
  PENDING_SYNC: 'warning',
  SYNCED: 'success',
  SYNC_FAILED: 'error',
  REQUIRES_REVIEW: 'warning',
};

interface AccountingStatusCardProps {
  load: {
    accountingSyncStatus?: string | null;
    accountingSyncedAt?: string | null;
    readyForSettlement?: boolean;
    podUploadedAt?: string | null;
    totalExpenses?: number | null;
    netProfit?: number | null;
  };
}

export default function AccountingStatusCard({ load }: AccountingStatusCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Accounting Status</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm text-muted-foreground">Sync Status</Label>
            <div className="mt-1">
              <Badge variant={syncStatusVariant[(load.accountingSyncStatus || 'NOT_SYNCED') as AccountingSyncStatus]}>
                {load.accountingSyncStatus?.replace(/_/g, ' ') || 'NOT_SYNCED'}
              </Badge>
            </div>
          </div>

          {load.accountingSyncedAt && (
            <div>
              <Label className="text-sm text-muted-foreground">Last Synced</Label>
              <p className="font-medium text-sm mt-1">
                {new Date(load.accountingSyncedAt).toLocaleString()}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            {load.readyForSettlement ? (
              <CheckCircle2 className="h-4 w-4 text-status-success" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <Label className="text-sm">
              {load.readyForSettlement ? 'Ready for Settlement' : 'Not Ready for Settlement'}
            </Label>
          </div>

          {load.podUploadedAt && (
            <div>
              <Label className="text-sm text-muted-foreground">POD Uploaded</Label>
              <p className="font-medium text-sm mt-1">
                {new Date(load.podUploadedAt).toLocaleString()}
              </p>
            </div>
          )}

          {load.totalExpenses !== null && load.totalExpenses !== undefined && (
            <div>
              <Label className="text-sm text-muted-foreground">Total Expenses</Label>
              <p className="font-medium text-sm mt-1">{formatCurrency(load.totalExpenses)}</p>
            </div>
          )}

          {load.netProfit !== null && load.netProfit !== undefined && (
            <div>
              <Label className="text-sm text-muted-foreground">Net Profit (Calculated)</Label>
              <p className={`font-medium text-sm mt-1 ${load.netProfit >= 0 ? 'text-status-success' : 'text-status-error'}`}>
                {formatCurrency(load.netProfit)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
