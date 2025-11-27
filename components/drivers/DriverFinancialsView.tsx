'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Calculator, Shield, ExternalLink } from 'lucide-react';
import { PayType } from '@prisma/client';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface DriverFinancialsViewProps {
  driver: {
    id: string;
    payType: PayType;
    payRate: number;
    perDiem?: number | null;
    escrowTargetAmount?: number | null;
    escrowDeductionPerWeek?: number | null;
    escrowBalance?: number | null;
    recurringDeductions?: Array<{
      type: string;
      amount: number;
      frequency: string;
    }> | null;
  };
}

function formatPayType(payType: PayType): string {
  return payType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDeductionType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatFrequency(frequency: string): string {
  return frequency.charAt(0) + frequency.slice(1).toLowerCase();
}

export default function DriverFinancialsView({ driver }: DriverFinancialsViewProps) {
  const escrowTargetAmount = driver.escrowTargetAmount || 0;
  const escrowDeductionPerWeek = driver.escrowDeductionPerWeek || 0;
  const escrowBalance = driver.escrowBalance || 0;
  
  // Calculate weeks to reach target
  const weeksToTarget = escrowTargetAmount > 0 && escrowDeductionPerWeek > 0
    ? Math.ceil((escrowTargetAmount - escrowBalance) / escrowDeductionPerWeek)
    : null;

  const payRateDisplay = driver.payType === 'PERCENTAGE' 
    ? `${driver.payRate}%`
    : driver.payType === 'PER_MILE'
    ? `${formatCurrency(driver.payRate)}/mile`
    : formatCurrency(driver.payRate);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Financial Settings</h3>
        <Link href={`/dashboard/drivers/${driver.id}?tab=financial`}>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Edit Financials
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pay Structure */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <CardTitle className="text-sm">Pay Structure</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-xs text-muted-foreground">Method</div>
              <div className="font-medium">{formatPayType(driver.payType)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Rate</div>
              <div className="font-medium">{payRateDisplay}</div>
            </div>
            {driver.perDiem && (
              <div>
                <div className="text-xs text-muted-foreground">Per Diem</div>
                <div className="font-medium">{driver.perDiem} cents/mile</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recurring Deductions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <CardTitle className="text-sm">Recurring Deductions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {driver.recurringDeductions && driver.recurringDeductions.length > 0 ? (
              <div className="space-y-2">
                {driver.recurringDeductions.map((deduction, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{formatDeductionType(deduction.type)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatFrequency(deduction.frequency)}
                      </div>
                    </div>
                    <div className="font-medium">{formatCurrency(deduction.amount)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No deductions configured</div>
            )}
          </CardContent>
        </Card>

        {/* Escrow / Holdings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <CardTitle className="text-sm">Escrow / Holdings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {escrowTargetAmount > 0 && (
              <div>
                <div className="text-xs text-muted-foreground">Target Amount</div>
                <div className="font-medium">{formatCurrency(escrowTargetAmount)}</div>
              </div>
            )}
            {escrowDeductionPerWeek > 0 && (
              <div>
                <div className="text-xs text-muted-foreground">Weekly Deduction</div>
                <div className="font-medium">{formatCurrency(escrowDeductionPerWeek)}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">Current Balance</div>
              <div className="font-medium">{formatCurrency(escrowBalance)}</div>
            </div>
            {weeksToTarget !== null && weeksToTarget > 0 && (
              <div className="pt-2">
                <Badge variant="outline" className="text-xs">
                  {weeksToTarget} week{weeksToTarget !== 1 ? 's' : ''} to target
                </Badge>
              </div>
            )}
            {weeksToTarget !== null && weeksToTarget <= 0 && (
              <div className="pt-2">
                <Badge variant="outline" className="text-xs text-green-600">
                  Target reached
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

