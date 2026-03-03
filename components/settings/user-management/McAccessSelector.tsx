'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { UseFormReturn } from 'react-hook-form';
import type { UserFormData } from './types';

interface McAccessSelectorProps {
  form: UseFormReturn<UserFormData>;
  mcNumbers: any[];
  selectedRole: string;
  idPrefix: string;
}

export default function McAccessSelector({
  form,
  mcNumbers,
  selectedRole,
  idPrefix,
}: McAccessSelectorProps) {
  const showMcAccess = ['DISPATCHER', 'ACCOUNTANT', 'ADMIN', 'DRIVER', 'HR', 'SAFETY', 'FLEET'].includes(selectedRole);

  if (!showMcAccess) return null;

  const currentAccess = form.watch('mcAccess') || [];

  const handleCheckChange = (mcId: string, checked: boolean) => {
    if (checked) {
      const newAccess = [...currentAccess, mcId];
      form.setValue('mcAccess', newAccess, { shouldValidate: true });
      if (!form.watch('mcNumberId')) {
        form.setValue('mcNumberId', mcId, { shouldValidate: true });
      }
    } else {
      const newAccess = currentAccess.filter((id: string) => id !== mcId);
      form.setValue('mcAccess', newAccess, { shouldValidate: true });
      if (form.watch('mcNumberId') === mcId && newAccess.length > 0) {
        form.setValue('mcNumberId', newAccess[0], { shouldValidate: true });
      }
    }
  };

  const toggleAll = () => {
    if (currentAccess.length === 0) {
      const allMcIds = mcNumbers.map((mc: any) => mc.id);
      form.setValue('mcAccess', allMcIds, { shouldValidate: true });
      if (allMcIds.length > 0) {
        form.setValue('mcNumberId', allMcIds[0], { shouldValidate: true });
      }
    } else {
      form.setValue('mcAccess', [], { shouldValidate: true });
      if (mcNumbers.length > 0) {
        form.setValue('mcNumberId', mcNumbers[0].id, { shouldValidate: true });
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label>MC Access *</Label>
      <p className="text-xs text-muted-foreground">
        {selectedRole === 'ADMIN'
          ? 'Leave empty for access to all MCs, or select specific MCs'
          : 'Select which MC numbers this user can access'}
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
        {mcNumbers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No MC numbers available</p>
        ) : (
          mcNumbers.map((mc: any) => {
            const isSelected = currentAccess.includes(mc.id);
            return (
              <div key={mc.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${idPrefix}-mc-access-${mc.id}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleCheckChange(mc.id, checked as boolean)}
                />
                <Label
                  htmlFor={`${idPrefix}-mc-access-${mc.id}`}
                  className="font-normal cursor-pointer flex-1"
                >
                  {mc.companyName} (MC {mc.number})
                </Label>
              </div>
            );
          })
        )}
      </div>
      {selectedRole === 'ADMIN' && (
        <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
          {currentAccess.length === 0 ? 'Select All MCs' : 'Clear (All Access)'}
        </Button>
      )}
    </div>
  );
}
