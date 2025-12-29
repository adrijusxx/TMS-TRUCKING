'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { deduplicateSystemFields, type SystemField } from '@/lib/import-export/field-utils';

interface ColumnMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excelColumns: string[];
  systemFields: Array<{ key: string; label: string; required?: boolean }>;
  initialMapping?: Record<string, string>;
  onMappingComplete: (mapping: Record<string, string>) => void;
}

export default function ColumnMappingDialog({
  open,
  onOpenChange,
  excelColumns,
  systemFields,
  initialMapping = {},
  onMappingComplete,
}: ColumnMappingDialogProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);
  const [autoMapped, setAutoMapped] = useState<Set<string>>(new Set());
  
  // Deduplicate system fields to prevent duplicate options in dropdowns
  const deduplicatedFields = useMemo(() => {
    return deduplicateSystemFields(systemFields);
  }, [systemFields]);

  // Auto-map columns on open
  useEffect(() => {
    if (open && excelColumns.length > 0) {
      const newMapping: Record<string, string> = { ...initialMapping };
      const newAutoMapped = new Set<string>();

      excelColumns.forEach((excelCol) => {
        if (newMapping[excelCol]) return; // Already mapped

        const normalizedExcel = excelCol.toLowerCase().trim().replace(/[_\s-]/g, '');
        
        // Try to find matching system field (using deduplicated fields)
        for (const field of deduplicatedFields) {
          const normalizedField = field.key.toLowerCase().replace(/[_\s-]/g, '');
          
          // Exact match or contains
          if (
            normalizedExcel === normalizedField ||
            normalizedExcel.includes(normalizedField) ||
            normalizedField.includes(normalizedExcel)
          ) {
            newMapping[excelCol] = field.key;
            newAutoMapped.add(excelCol);
            break;
          }
        }
      });

      setMapping(newMapping);
      setAutoMapped(newAutoMapped);
    }
  }, [open, excelColumns, deduplicatedFields, initialMapping]);

  const handleMappingChange = (excelColumn: string, systemField: string) => {
    setMapping((prev) => ({
      ...prev,
      [excelColumn]: systemField,
    }));
  };

  const handleComplete = () => {
    onMappingComplete(mapping);
    onOpenChange(false);
  };

  const mappedFields = new Set(Object.values(mapping));
  const requiredFields = deduplicatedFields.filter((f) => f.required);
  const unmappedRequired = requiredFields.filter((f) => !mappedFields.has(f.key));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map Excel Columns to System Fields</DialogTitle>
          <DialogDescription>
            Match your Excel column headers to the system fields. Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mapping Status */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {unmappedRequired.length === 0 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    All required fields mapped
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">
                    {unmappedRequired.length} required field(s) need mapping
                  </span>
                </>
              )}
            </div>
            <Badge variant="outline">
              {Object.keys(mapping).length} of {excelColumns.length} columns mapped
            </Badge>
          </div>

          {/* Column Mappings */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 font-medium text-sm border-b pb-2">
              <div>Excel Column</div>
              <div>System Field</div>
              <div>Status</div>
            </div>

            {excelColumns.map((excelCol) => {
              const systemField = mapping[excelCol];
              const fieldInfo = systemField
                ? deduplicatedFields.find((f) => f.key === systemField)
                : null;
              const isRequired = fieldInfo?.required;
              const isAutoMapped = autoMapped.has(excelCol);
              
              // Get available fields for this dropdown (exclude already mapped fields from other columns)
              const otherMappedFields = new Set(
                Object.entries(mapping)
                  .filter(([col]) => col !== excelCol)
                  .map(([, fieldKey]) => fieldKey)
              );
              const availableFields = deduplicatedFields.filter(
                (f) => !otherMappedFields.has(f.key) || f.key === systemField
              );

              return (
                <div key={excelCol} className="grid grid-cols-3 gap-4 items-center">
                  <div className="font-medium text-sm">{excelCol}</div>
                  <Select
                    value={systemField || '__none__'}
                    onValueChange={(value) => handleMappingChange(excelCol, value === '__none__' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None --</SelectItem>
                      {availableFields.map((field) => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                          {field.required && ' *'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    {isAutoMapped && (
                      <Badge variant="secondary" className="text-xs">
                        Auto
                      </Badge>
                    )}
                    {isRequired && (
                      <Badge variant={systemField ? 'default' : 'destructive'} className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unmapped Required Fields Warning */}
          {unmappedRequired.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="font-medium text-sm text-yellow-800 mb-1">
                Missing Required Fields:
              </div>
              <div className="text-xs text-yellow-700">
                {unmappedRequired.map((f) => f.label).join(', ')}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={unmappedRequired.length > 0}
            >
              Apply Mapping
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

