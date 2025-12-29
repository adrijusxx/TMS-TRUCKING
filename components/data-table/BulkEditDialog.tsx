'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiUrl } from '@/lib/utils';
import { getMcNumberOptions, MC_NUMBER_FIELD_KEY } from '@/lib/utils/mc-number-options';
import type { BulkEditField } from './types';

interface BulkEditDialogProps {
  /**
   * Whether dialog is open
   */
  open: boolean;
  /**
   * Open change handler
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Selected row IDs
   */
  selectedIds: string[];
  /**
   * Entity type
   */
  entityType: string;
  /**
   * Bulk edit field definitions
   */
  fields: BulkEditField[];
  /**
   * On success callback
   */
  onSuccess?: () => void;
}

/**
 * Bulk edit dialog component
 * Allows editing multiple records at once with flexible field definitions
 */
export function BulkEditDialog({
  open,
  onOpenChange,
  selectedIds,
  entityType,
  fields,
  onSuccess,
}: BulkEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [mcNumberOptions, setMcNumberOptions] = React.useState<Array<{ value: string; label: string }>>([]);
  const [isLoadingMcNumbers, setIsLoadingMcNumbers] = React.useState(false);

  // Load MC number options when dialog opens and MC number field is present
  React.useEffect(() => {
    if (open && fields.some(f => f.key === MC_NUMBER_FIELD_KEY)) {
      setIsLoadingMcNumbers(true);
      getMcNumberOptions().then(options => {
        setMcNumberOptions(options);
        setIsLoadingMcNumbers(false);
      }).catch(() => {
        setIsLoadingMcNumbers(false);
      });
    }
  }, [open, fields]);

  // Build form schema from fields
  const formSchema = React.useMemo(() => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    fields.forEach((field) => {
      let fieldSchema: z.ZodTypeAny = z.any().optional();

      switch (field.type) {
        case 'text':
          fieldSchema = z.string().optional();
          break;
        case 'number':
          fieldSchema = z.number().optional();
          break;
        case 'boolean':
          fieldSchema = z.boolean().optional();
          break;
        case 'date':
          fieldSchema = z.string().optional();
          break;
        case 'select':
        case 'multiselect':
          fieldSchema = field.type === 'multiselect'
            ? z.array(z.string()).optional()
            : z.string().optional();
          break;
      }

      if (field.required) {
        fieldSchema = fieldSchema as z.ZodTypeAny;
      }

      schemaFields[field.key] = fieldSchema;
    });

    return z.object(schemaFields);
  }, [fields]);

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: fields.reduce((acc, field) => {
      acc[field.key] = field.defaultValue;
      return acc;
    }, {} as FormData),
  });

  const handleClose = () => {
    reset();
    setErrors({});
    onOpenChange(false);
  };

  const onSubmit = async (data: FormData) => {
    if (selectedIds.length === 0) {
      toast.error('No records selected');
      return;
    }

    // Validate fields
    const validationErrors: Record<string, string> = {};
    const updates: Record<string, any> = {};

    fields.forEach((field) => {
      const value = data[field.key];

      // Skip empty values
      if (value === undefined || value === null || value === '') {
        return;
      }

      // Validate if validator provided
      if (field.validate) {
        const error = field.validate(value);
        if (error) {
          validationErrors[field.key] = error;
          return;
        }
      }

      updates[field.key] = value;
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (Object.keys(updates).length === 0) {
      toast.error('Please provide at least one field to update');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(apiUrl('/api/bulk-actions/edit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          ids: selectedIds,
          updates,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Bulk edit failed');
      }

      const result = await response.json();
      
      // Show errors if any
      if (result.data?.errors && result.data.errors.length > 0) {
        result.data.errors.forEach((error: string) => {
          toast.error(error);
        });
      }
      
      toast.success(
        `Successfully updated ${result.data?.updatedCount || selectedIds.length} record(s)`
      );
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Bulk edit error:', error);
      toast.error(error.message || 'Failed to update records');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Edit {selectedIds.length} Record(s)</DialogTitle>
          <DialogDescription>
            Update multiple records at once. Leave fields empty to skip updating them.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map((field) => {
            const fieldError = errors[field.key] || formErrors[field.key]?.message;

            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>

                {field.type === 'text' && (
                  <Input
                    id={field.key}
                    {...register(field.key)}
                    placeholder={field.placeholder}
                    disabled={isSubmitting}
                  />
                )}

                {field.type === 'number' && (
                  <Input
                    id={field.key}
                    type="number"
                    {...register(field.key, { valueAsNumber: true })}
                    placeholder={field.placeholder}
                    disabled={isSubmitting}
                  />
                )}

                {field.type === 'boolean' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.key}
                      checked={Boolean(watch(field.key))}
                      onCheckedChange={(checked) => setValue(field.key, checked as boolean)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor={field.key} className="font-normal">
                      {field.helpText || 'Enable'}
                    </Label>
                  </div>
                )}

                {field.type === 'date' && (
                  <Input
                    id={field.key}
                    type="date"
                    {...register(field.key)}
                    disabled={isSubmitting}
                  />
                )}

                {(field.type === 'select' || field.type === 'multiselect') && (
                  <Select
                    value={String(watch(field.key) || '')}
                    onValueChange={(value) => setValue(field.key, value)}
                    disabled={isSubmitting || (field.key === MC_NUMBER_FIELD_KEY && isLoadingMcNumbers)}
                  >
                    <SelectTrigger id={field.key}>
                      <SelectValue 
                        placeholder={
                          field.key === MC_NUMBER_FIELD_KEY && isLoadingMcNumbers
                            ? 'Loading MC numbers...'
                            : field.placeholder || 'Select...'
                        } 
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.key === MC_NUMBER_FIELD_KEY ? mcNumberOptions : field.options)?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}

                {fieldError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{fieldError}</span>
                  </div>
                )}
              </div>
            );
          })}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                `Update ${selectedIds.length} Record(s)`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

