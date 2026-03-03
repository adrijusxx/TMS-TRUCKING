'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, User, Calendar } from 'lucide-react';

interface SettlementBreakdownProps {
  settlement: any;
  additionsData: any;
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
  additionsData,
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
        </CardContent>
      </Card>

      {/* Escrow Information */}
      {(settlement.driver?.escrowTargetAmount || settlement.driver?.escrowDeductionPerWeek) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Escrow / Holdings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {settlement.driver?.escrowTargetAmount && (
              <div>
                <p className="text-sm text-muted-foreground">Target Amount</p>
                <p className="font-medium">{formatCurrency(settlement.driver.escrowTargetAmount)}</p>
              </div>
            )}
            {settlement.driver?.escrowDeductionPerWeek && (
              <div>
                <p className="text-sm text-muted-foreground">Deduction Per Week</p>
                <p className="font-medium">{formatCurrency(settlement.driver.escrowDeductionPerWeek)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="font-medium">{formatCurrency(settlement.driver?.escrowBalance || 0)}</p>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Gross Pay</span>
            {isEditing ? (
              <Input
                type="number"
                step="0.01"
                className="w-32 text-right"
                value={editedGrossPay}
                onChange={(e) => onEditGrossPay(e.target.value)}
              />
            ) : (
              <span className="font-medium">{formatCurrency(settlement.grossPay)}</span>
            )}
          </div>
          <div className="flex justify-between items-center pt-2 border-t mt-2">
            <span className="text-sm text-muted-foreground">Total Miles</span>
            <span className="font-medium">
              {settlement.loads?.reduce((sum: number, load: any) => sum + (load.totalMiles || load.loadedMiles || 0), 0).toLocaleString()} mi
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b mb-2">
            <span className="text-sm text-muted-foreground">Loaded Miles</span>
            <span className="font-medium">
              {settlement.loads?.reduce((sum: number, load: any) => sum + (load.loadedMiles || 0), 0).toLocaleString()} mi
            </span>
          </div>
          {additionsData?.data && additionsData.data.length > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Additions</span>
              <span className="font-medium text-green-600">
                +{formatCurrency(additionsData.data.reduce((sum: number, a: any) => sum + a.amount, 0))}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Deductions</span>
            <span className="font-medium text-red-600">-{formatCurrency(settlement.deductions)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Advances</span>
            <span className="font-medium text-red-600">-{formatCurrency(settlement.advances)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold">Net Pay</span>
            <span className="text-xl font-bold text-green-600">{formatCurrency(settlement.netPay)}</span>
          </div>
          {(settlement as any).carriedForwardAmount > 0 && (
            <div className="flex justify-between pt-1 text-sm">
              <span className="text-amber-600 font-medium">Carried Forward</span>
              <span className="text-amber-600 font-medium">
                -{formatCurrency((settlement as any).carriedForwardAmount)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
