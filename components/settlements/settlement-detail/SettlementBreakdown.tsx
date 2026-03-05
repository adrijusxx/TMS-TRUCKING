'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, User, Calendar } from 'lucide-react';

interface SettlementBreakdownProps {
  settlement: any;
  isEditing: boolean;
  editedGrossPay: string;
  editedPeriodStart: string;
  editedPeriodEnd: string;
  onEditGrossPay: (value: string) => void;
  onEditPeriodStart: (value: string) => void;
  onEditPeriodEnd: (value: string) => void;
  onOpenDriver?: (driverId: string) => void;
}

export default function SettlementBreakdown({
  settlement,
  isEditing,
  editedGrossPay,
  editedPeriodStart,
  editedPeriodEnd,
  onEditGrossPay,
  onEditPeriodStart,
  onEditPeriodEnd,
  onOpenDriver,
}: SettlementBreakdownProps) {
  return (
    <>
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
            {settlement.driver?.user?.firstName} {settlement.driver?.user?.lastName}
          </p>
          <p className="text-sm text-muted-foreground">
            {settlement.driver?.driverNumber || 'N/A'}
          </p>
          <p className="text-sm text-muted-foreground">
            {settlement.driver?.user?.email || 'N/A'}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => onOpenDriver?.(settlement.driverId)}
          >
            Edit Driver
          </Button>
        </CardContent>
      </Card>

      {/* Pay Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pay Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold">
            {(() => {
              const payType = settlement.driver?.payType;
              const payRate = settlement.driver?.payRate;
              if (!payType || payRate === null || payRate === undefined) {
                return <span className="text-muted-foreground">Not Configured</span>;
              }
              switch (payType) {
                case 'PER_MILE': return `CPM: ${formatCurrency(payRate)}/mile`;
                case 'PERCENTAGE': return `Percentage: ${payRate}%`;
                case 'PER_LOAD': return `Per Load: ${formatCurrency(payRate)}/load`;
                case 'HOURLY': return `Hourly: ${formatCurrency(payRate)}/hour`;
                default: return <span className="text-muted-foreground">{payType}</span>;
              }
            })()}
          </div>
          {isEditing && (
            <div className="mt-3 space-y-1">
              <p className="text-sm text-muted-foreground">Gross Pay Override</p>
              <Input
                type="number"
                step="0.01"
                value={editedGrossPay}
                onChange={(e) => onEditGrossPay(e.target.value)}
              />
            </div>
          )}
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
            {isEditing ? (
              <Input type="date" value={editedPeriodStart} onChange={(e) => onEditPeriodStart(e.target.value)} />
            ) : (
              <p className="font-medium">{formatDate(settlement.periodStart)}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">End Date</p>
            {isEditing ? (
              <Input type="date" value={editedPeriodEnd} onChange={(e) => onEditPeriodEnd(e.target.value)} />
            ) : (
              <p className="font-medium">{formatDate(settlement.periodEnd)}</p>
            )}
          </div>
          {settlement.paidDate && (
            <div>
              <p className="text-sm text-muted-foreground">Paid Date</p>
              <p className="font-medium">{formatDate(settlement.paidDate)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
