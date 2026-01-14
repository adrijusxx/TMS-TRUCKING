'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PayType } from '@prisma/client';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

// Sub-components
import { PayStructureSection } from './PayrollSubComponents/PayStructureSection';
import {
  RecurringTransactionsSection,
  RecurringTransaction,
} from './PayrollSubComponents/RecurringTransactionsSection';

interface DriverFinancialPayrollTabProps {
  driver: any;
  onSave: (data: any) => void;
}

const financialsSchema = z.object({
  payType: z.nativeEnum(PayType),
  payRate: z.number().min(0, 'Rate cannot be negative'),
  payTo: z.string().optional(),
  notes: z.string().optional(),
  // Legacy escrow fields removed from UI
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

  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FinancialsFormData>({
    resolver: zodResolver(financialsSchema),
    defaultValues: {
      payType: driver.payType || 'PER_MILE',
      payRate: driver.payRate || 0,
      payTo: driver.payTo || '',
      notes: driver.notes || '',
      escrowTargetAmount: driver.escrowTargetAmount || undefined,
      escrowDeductionPerWeek: driver.escrowDeductionPerWeek || undefined,
    },
  });

  const onSubmit = useCallback(
    (data: FinancialsFormData) => {
      console.log('[Driver Financial Tab] onSubmit called with form data:', data);
      console.log('[Driver Financial Tab] Current recurringTransactions:', recurringTransactions);

      // Filter out incomplete transactions (missing type, amount, or frequency)
      const validTransactions = recurringTransactions.filter(
        (t) => t.type && t.type.trim() !== '' && t.amount > 0 && t.frequency && t.frequency.trim() !== '' && t.category
      );

      console.log(
        '[Driver Financial Tab] Valid transactions (after filtering):',
        validTransactions.length,
        'out of',
        recurringTransactions.length
      );

      if (recurringTransactions.length > 0 && validTransactions.length === 0) {
        console.warn('[Driver Financial Tab] WARNING: Transactions exist but none are valid!');
        console.warn('[Driver Financial Tab] All transactions:', recurringTransactions);
        toast.error('Please complete all transaction fields (Type, Amount, Frequency) before saving');
        return;
      }

      if (validTransactions.length > 0) {
        console.log(
          '[Driver Financial Tab] Preparing to save',
          validTransactions.length,
          'valid recurring transactions'
        );
        validTransactions.forEach((t, idx) => {
          console.log(`[Driver Financial Tab] Valid Transaction ${idx + 1}:`, {
            type: t.type,
            category: t.category,
            amount: t.amount,
            frequency: t.frequency,
            stopLimit: t.stopLimit,
            note: t.note,
            id: t.id,
          });
        });
      } else {
        console.log('[Driver Financial Tab] No valid recurring transactions to save');
      }

      const formData = {
        payType: data.payType,
        payRate: parseFloat(data.payRate.toString()),
        payTo: data.payTo,
        notes: data.notes,
        escrowTargetAmount: data.escrowTargetAmount
          ? parseFloat(data.escrowTargetAmount.toString())
          : undefined,
        escrowDeductionPerWeek: data.escrowDeductionPerWeek
          ? parseFloat(data.escrowDeductionPerWeek.toString())
          : undefined,
        // Send unified recurring transactions
        recurringTransactions: validTransactions.length > 0 ? validTransactions : undefined,
      };

      console.log(
        '[Driver Financial Tab] Final formData being sent to onSave:',
        JSON.stringify(formData, null, 2)
      );
      console.log('[Driver Financial Tab] recurringTransactions in formData:', formData.recurringTransactions);
      onSave(formData);
    },
    [recurringTransactions, onSave]
  );

  // Load existing deduction rules for this driver
  useEffect(() => {
    const loadDeductionRules = async () => {
      try {
        // Fetch rules by driverId (proper association)
        const response = await fetch(
          apiUrl(`/api/deduction-rules?driverId=${driver.id}&isActive=true&t=${Date.now()}`),
          { cache: 'no-store' }
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Convert to form format
            const loadedTransactions: RecurringTransaction[] = result.data.map((rule: any) => {
              let type = rule.deductionType;

              // If type is OTHER and we stored custom type in name, try to extract
              if (type === 'OTHER' && rule.name) {
                const parts = rule.name.split(' - ');
                if (parts.length >= 2) {
                  let extracted = parts.slice(1).join(' - ');
                  // Remove note from name if present
                  if (rule.notes && extracted.endsWith(` (${rule.notes})`)) {
                    extracted = extracted.slice(0, -(rule.notes.length + 3));
                  }
                  type = extracted.trim();
                }
              }

              return {
                id: rule.id,
                type: type,
                category: rule.isAddition ? 'addition' : 'deduction',
                amount: rule.amount || 0,
                frequency: rule.frequency || rule.deductionFrequency || 'WEEKLY',
                stopLimit: rule.goalAmount || undefined,
                currentBalance: rule.currentAmount || 0,
                note: rule.notes || '',
              };
            });

            if (loadedTransactions.length > 0) {
              console.log('[Driver Financial Tab] Loaded', loadedTransactions.length, 'deduction rules for driver', driver.id);
              setRecurringTransactions(loadedTransactions);
            }
          }
        } else {
          console.warn('[Driver Financial Tab] Failed to load deduction rules:', response.status);
        }
      } catch (error) {
        console.error('[Driver Financial Tab] Error loading deduction rules:', error);
      }
    };

    if (driver.id) {
      loadDeductionRules();
    }
  }, [driver.id]);

  useEffect(() => {
    const handleSave = () => {
      console.log('[Driver Financial Tab] Save event received');
      console.log('[Driver Financial Tab] Current recurringTransactions:', recurringTransactions);

      // Get current form values using watch
      const formValues = watch();
      console.log('[Driver Financial Tab] Current form values from watch:', formValues);

      // Manually call onSubmit with current form data
      onSubmit(formValues);
    };

    window.addEventListener('driver-form-save', handleSave);
    return () => window.removeEventListener('driver-form-save', handleSave);
  }, [watch, onSubmit, recurringTransactions]);

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

      {/* Unified Recurring Transactions Section */}
      <RecurringTransactionsSection
        transactions={recurringTransactions}
        onTransactionsChange={setRecurringTransactions}
        isReadOnly={isReadOnly}
      />
    </form>
  );
}
