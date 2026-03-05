'use client';

import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PayType } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

// Sub-components
import { PayStructureSection } from './PayrollSubComponents/PayStructureSection';

interface DriverFinancialPayrollTabProps {
  driver: any;
  onSave: (data: any) => void;
}

const financialsSchema = z.object({
  payType: z.nativeEnum(PayType),
  payRate: z.number().min(0, 'Rate cannot be negative'),
  stopPayEnabled: z.boolean().optional(),
  stopPayRate: z.number().min(0).optional(),
  payTo: z.string().optional(),
  notes: z.string().optional(),
  escrowTargetAmount: z.number().min(0).optional(),
  escrowDeductionPerWeek: z.number().min(0).optional(),
});

type FinancialsFormData = z.infer<typeof financialsSchema>;

export default function DriverFinancialPayrollTab({
  driver,
  onSave,
}: DriverFinancialPayrollTabProps) {
  const { data: session } = useSession();
  const role = session?.user?.role as 'ADMIN' | 'ACCOUNTANT' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER';
  const isReadOnly = role === 'DISPATCHER';

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FinancialsFormData>({
    resolver: zodResolver(financialsSchema),
    defaultValues: {
      payType: driver.payType || 'PER_MILE',
      payRate: driver.payRate || 0,
      stopPayEnabled: driver.stopPayEnabled || false,
      stopPayRate: driver.stopPayRate ?? 30,
      payTo: driver.payTo || '',
      notes: driver.notes || '',
      escrowTargetAmount: driver.escrowTargetAmount || undefined,
      escrowDeductionPerWeek: driver.escrowDeductionPerWeek || undefined,
    },
  });

  const onSubmit = useCallback(
    (data: FinancialsFormData) => {
      const formData = {
        payType: data.payType,
        payRate: parseFloat(data.payRate.toString()),
        stopPayEnabled: data.stopPayEnabled,
        stopPayRate: data.stopPayRate != null ? parseFloat(data.stopPayRate.toString()) : undefined,
        payTo: data.payTo,
        notes: data.notes,
        escrowTargetAmount: data.escrowTargetAmount
          ? parseFloat(data.escrowTargetAmount.toString())
          : undefined,
        escrowDeductionPerWeek: data.escrowDeductionPerWeek
          ? parseFloat(data.escrowDeductionPerWeek.toString())
          : undefined,
      };
      onSave(formData);
    },
    [onSave]
  );

  useEffect(() => {
    const handleSave = () => onSubmit(watch());
    window.addEventListener('driver-form-save', handleSave);
    return () => window.removeEventListener('driver-form-save', handleSave);
  }, [watch, onSubmit]);

  return (
    <form id="driver-financial-payroll-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {isReadOnly && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You have read-only access to financial data. Only administrators and accountants can modify pay
            structure and deductions.
          </AlertDescription>
        </Alert>
      )}

      {/* Pay Structure Section */}
      <PayStructureSection
        register={register}
        setValue={setValue}
        watch={watch}
        errors={errors}
        isReadOnly={isReadOnly}
      />
    </form>
  );
}
