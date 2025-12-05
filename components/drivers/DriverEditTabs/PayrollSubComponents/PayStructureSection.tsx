'use client';

import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign } from 'lucide-react';
import { PayType } from '@prisma/client';

interface PayStructureSectionProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
  isReadOnly: boolean;
}

export function PayStructureSection({
  register,
  setValue,
  watch,
  errors,
  isReadOnly,
}: PayStructureSectionProps) {
  const payType = watch('payType');
  const payRate = watch('payRate');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          <CardTitle>Pay Structure</CardTitle>
        </div>
        <CardDescription>
          {isReadOnly
            ? 'View driver compensation method and rates (read-only)'
            : 'Configure driver compensation method and rates'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payType">
              Method <span className="text-destructive">*</span>
            </Label>
            <Select
              value={payType}
              onValueChange={(value) => setValue('payType', value as PayType)}
              disabled={isReadOnly}
            >
              <SelectTrigger id="payType" disabled={isReadOnly}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PER_MILE">CPM (Cents Per Mile)</SelectItem>
                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                <SelectItem value="PER_LOAD">Flat (Per Load)</SelectItem>
                <SelectItem value="HOURLY">Hourly</SelectItem>
                <SelectItem value="WEEKLY">Weekly Flat Rate</SelectItem>
              </SelectContent>
            </Select>
            {errors.payType && (
              <p className="text-sm text-destructive">{errors.payType.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payRate">
              Rate <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              {payType === 'PERCENTAGE' ? (
                <>
                  <Input
                    id="payRate"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('payRate', { valueAsNumber: true })}
                    placeholder="25"
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </>
              ) : payType === 'PER_MILE' ? (
                <>
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    id="payRate"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('payRate', { valueAsNumber: true })}
                    placeholder="0.60"
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                  />
                  <span className="text-sm text-muted-foreground">/mile</span>
                </>
              ) : payType === 'HOURLY' ? (
                <>
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    id="payRate"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('payRate', { valueAsNumber: true })}
                    placeholder="25.00"
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                  />
                  <span className="text-sm text-muted-foreground">/hour</span>
                </>
              ) : payType === 'WEEKLY' ? (
                <>
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    id="payRate"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('payRate', { valueAsNumber: true })}
                    placeholder="1500.00"
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                  />
                  <span className="text-sm text-muted-foreground">/week</span>
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    id="payRate"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('payRate', { valueAsNumber: true })}
                    placeholder="500.00"
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                  />
                </>
              )}
            </div>
            {errors.payRate && (
              <p className="text-sm text-destructive">{errors.payRate.message as string}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {payType === 'PER_MILE' && 'e.g., 0.60 = $0.60 per mile'}
              {payType === 'PERCENTAGE' && 'e.g., 25 = 25% of load revenue'}
              {payType === 'PER_LOAD' && 'e.g., 500 = $500 per load'}
              {payType === 'HOURLY' && 'e.g., 25 = $25 per hour'}
              {payType === 'WEEKLY' && 'e.g., 1500 = $1,500 per week'}
            </p>
          </div>
        </div>

        {/* Payment Summary - Auto-calculated display */}
        <div className="pt-4 border-t bg-muted/30 p-4 rounded-lg">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Payment Summary</Label>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Pay:</span>
                <span className="font-medium">
                  {payType === 'PER_MILE' && `$${payRate?.toFixed(2) || '0.00'}/mile`}
                  {payType === 'PERCENTAGE' && `${payRate || 0}% of revenue`}
                  {payType === 'PER_LOAD' && `$${payRate?.toFixed(2) || '0.00'}/load`}
                  {payType === 'HOURLY' && `$${payRate?.toFixed(2) || '0.00'}/hour`}
                  {payType === 'WEEKLY' && `$${payRate?.toFixed(2) || '0.00'}/week`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}







