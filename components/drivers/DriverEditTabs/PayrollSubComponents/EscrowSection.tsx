'use client';

import { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

interface EscrowSectionProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
  escrowBalance: number;
  isReadOnly: boolean;
}

export function EscrowSection({
  register,
  watch,
  errors,
  escrowBalance,
  isReadOnly,
}: EscrowSectionProps) {
  const escrowTargetAmount = watch('escrowTargetAmount') || 0;
  const escrowDeductionPerWeek = watch('escrowDeductionPerWeek') || 0;

  const weeksToTarget =
    escrowTargetAmount > 0 && escrowDeductionPerWeek > 0
      ? Math.ceil((escrowTargetAmount - escrowBalance) / escrowDeductionPerWeek)
      : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>Escrow / Holdings</CardTitle>
        </div>
        <CardDescription>
          Configure escrow target and automatic weekly deductions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="escrowTargetAmount">Target Amount</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                id="escrowTargetAmount"
                type="number"
                step="0.01"
                min="0"
                {...register('escrowTargetAmount', { valueAsNumber: true })}
                placeholder="2500.00"
                disabled={isReadOnly}
                readOnly={isReadOnly}
              />
            </div>
            {errors.escrowTargetAmount && (
              <p className="text-sm text-destructive">
                {errors.escrowTargetAmount.message as string}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Target escrow balance (e.g., $2,500)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="escrowDeductionPerWeek">Deduction Per Week</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                id="escrowDeductionPerWeek"
                type="number"
                step="0.01"
                min="0"
                {...register('escrowDeductionPerWeek', { valueAsNumber: true })}
                placeholder="100.00"
                disabled={isReadOnly}
                readOnly={isReadOnly}
              />
            </div>
            {errors.escrowDeductionPerWeek && (
              <p className="text-sm text-destructive">
                {errors.escrowDeductionPerWeek.message as string}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Weekly deduction amount (e.g., $100)
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="space-y-2">
            <Label>Current Balance (Read-Only)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                value={escrowBalance.toFixed(2)}
                readOnly
                className="bg-muted"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Current escrow balance (calculated from settlements)
            </p>
            {escrowTargetAmount > 0 &&
              escrowDeductionPerWeek > 0 &&
              weeksToTarget !== null && (
                <p className="text-sm text-muted-foreground mt-2">
                  {weeksToTarget > 0 ? (
                    <>
                      <span className="font-medium">{weeksToTarget}</span> week
                      {weeksToTarget !== 1 ? 's' : ''} remaining to reach target
                    </>
                  ) : (
                    <span className="text-green-600 font-medium">Target reached</span>
                  )}
                </p>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}







