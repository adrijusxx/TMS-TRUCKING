'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface UnresolvedValue {
  row: number;
  field: string;
  value: string;
  error: string;
}

interface ValueResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unresolvedValues: UnresolvedValue[];
  entityType: string;
  onResolutionsComplete: (resolutions: Record<string, Record<string, string>>) => void; // { field: { value: resolvedId } }
}

interface McNumber {
  id: string;
  number: string;
  companyName: string;
  isDefault: boolean;
}

async function fetchMcNumbers(): Promise<McNumber[]> {
  const response = await fetch(apiUrl('/api/mc-numbers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch MC numbers');
  const result = await response.json();
  return result.data || [];
}

export default function ValueResolutionDialog({
  open,
  onOpenChange,
  unresolvedValues,
  entityType,
  onResolutionsComplete,
}: ValueResolutionDialogProps) {
  const [resolutions, setResolutions] = useState<Record<string, Record<string, string>>>({});
  const [groupedByField, setGroupedByField] = useState<Record<string, UnresolvedValue[]>>({});

  // Group unresolved values by field
  useEffect(() => {
    if (unresolvedValues.length > 0) {
      const grouped: Record<string, UnresolvedValue[]> = {};
      unresolvedValues.forEach((item) => {
        if (!grouped[item.field]) {
          grouped[item.field] = [];
        }
        grouped[item.field].push(item);
      });
      setGroupedByField(grouped);
    }
  }, [unresolvedValues]);

  // Fetch MC numbers if MC number field needs resolution
  const needsMcNumberResolution = Object.keys(groupedByField).some(
    (field) => field.toLowerCase().includes('mc') || field.toLowerCase().includes('mcnumber')
  );

  const { data: mcNumbers = [], isLoading: isLoadingMcNumbers } = useQuery({
    queryKey: ['mc-numbers-for-resolution'],
    queryFn: fetchMcNumbers,
    enabled: open && needsMcNumberResolution,
  });

  const handleResolution = (field: string, originalValue: string, resolvedId: string) => {
    setResolutions((prev) => ({
      ...prev,
      [field]: {
        ...(prev[field] || {}),
        [originalValue]: resolvedId,
      },
    }));
  };

  const handleComplete = () => {
    onResolutionsComplete(resolutions);
    onOpenChange(false);
  };

  const getResolvedCount = (field: string) => {
    const uniqueValues = new Set(groupedByField[field]?.map((v) => v.value) || []);
    const resolvedCount = Object.keys(resolutions[field] || {}).length;
    return { total: uniqueValues.size, resolved: resolvedCount };
  };

  const isFieldComplete = (field: string) => {
    const { total, resolved } = getResolvedCount(field);
    return total > 0 && resolved === total;
  };

  const allFieldsResolved = Object.keys(groupedByField).every((field) => isFieldComplete(field));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resolve Unmapped Values</DialogTitle>
          <DialogDescription>
            Some values in your import file could not be automatically resolved. Please select the
            correct values from the dropdowns below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {allFieldsResolved ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    All values resolved
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">
                    {Object.keys(groupedByField).length} field(s) need resolution
                  </span>
                </>
              )}
            </div>
            <Badge variant="outline">
              {unresolvedValues.length} unresolved value(s)
            </Badge>
          </div>

          {/* Field Groups */}
          {Object.entries(groupedByField).map(([field, values]) => {
            const uniqueValues = Array.from(new Set(values.map((v) => v.value)));
            const { total, resolved } = getResolvedCount(field);
            const isComplete = isFieldComplete(field);

            return (
              <div key={field} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">{field}</Label>
                    {isComplete && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {resolved} of {total} resolved
                  </Badge>
                </div>

                {field.toLowerCase().includes('mc') || field.toLowerCase().includes('mcnumber') ? (
                  // MC Number Resolution
                  <div className="space-y-2">
                    {isLoadingMcNumbers ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          Loading MC numbers...
                        </span>
                      </div>
                    ) : (
                      uniqueValues.map((value) => {
                        const currentResolution = resolutions[field]?.[value];
                        const affectedRows = values.filter((v) => v.value === value).map((v) => v.row);

                        return (
                          <div key={value} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{value}</div>
                              <div className="text-xs text-muted-foreground">
                                Row(s): {affectedRows.join(', ')}
                              </div>
                            </div>
                            <Select
                              value={currentResolution || '__none__'}
                              onValueChange={(selectedId) =>
                                handleResolution(field, value, selectedId === '__none__' ? '' : selectedId)
                              }
                            >
                              <SelectTrigger className="w-[300px]">
                                <SelectValue placeholder="Select MC number..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">-- Skip this value --</SelectItem>
                                {mcNumbers.map((mc) => (
                                  <SelectItem key={mc.id} value={mc.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{mc.companyName}</span>
                                      <span className="text-muted-foreground ml-2">
                                        {mc.number}
                                        {mc.isDefault && (
                                          <span className="ml-1 text-xs">(Default)</span>
                                        )}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  // Generic field resolution (can be extended for other field types)
                  <div className="space-y-2">
                    {uniqueValues.map((value) => {
                      const currentResolution = resolutions[field]?.[value];
                      const affectedRows = values.filter((v) => v.value === value).map((v) => v.row);

                      return (
                        <div key={value} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{value}</div>
                            <div className="text-xs text-muted-foreground">
                              Row(s): {affectedRows.join(', ')}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Manual resolution not yet implemented for this field type
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={!allFieldsResolved}>
              Apply Resolutions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

