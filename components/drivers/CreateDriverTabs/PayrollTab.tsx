'use client';

import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { PayStructureSection } from '@/components/drivers/DriverEditTabs/PayrollSubComponents/PayStructureSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PayrollTabProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
}

export function PayrollTab({ register, setValue, watch, errors }: PayrollTabProps) {
  return (
    <div className="space-y-6">
      <PayStructureSection
        register={register}
        setValue={setValue}
        watch={watch}
        errors={errors}
        isReadOnly={false}
      />

      <Card>
        <CardHeader><CardTitle>Additional Payroll</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="homeTerminal">Home Terminal</Label>
              <Input id="homeTerminal" placeholder="Dallas, TX" {...register('homeTerminal')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="escrowTargetAmount">Escrow Target ($)</Label>
              <Input
                id="escrowTargetAmount"
                type="number"
                step="0.01"
                min="0"
                {...register('escrowTargetAmount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="escrowDeductionPerWeek">Escrow Per Week ($)</Label>
              <Input
                id="escrowDeductionPerWeek"
                type="number"
                step="0.01"
                min="0"
                {...register('escrowDeductionPerWeek', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
