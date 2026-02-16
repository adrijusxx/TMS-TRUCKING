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
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
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

  /* -------------------------------------------------------------------------- */
  /*                            AI & SMART MAPPING                              */
  /* -------------------------------------------------------------------------- */

  const [isMapping, setIsMapping] = useState(false);

  // Levenshtein distance for fuzzy matching (Local fallback)
  const levenshtein = (a: string, b: string) => {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  };

  const runSmartMapping = async () => {
    setIsMapping(true);
    const newMapping: Record<string, string> = { ...mapping };
    const newAutoMapped = new Set<string>(autoMapped);

    // 1. Prepare unmapped columns for AI
    const unmappedColumns = excelColumns.filter(col => !newMapping[col]);

    if (unmappedColumns.length === 0) {
      setIsMapping(false);
      return; // Nothing to do
    }

    try {
      // 2. Try AI Mapping First (Server-Side)
      const response = await fetch('/api/import-export/smart-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvHeaders: unmappedColumns,
          systemFields: deduplicatedFields.map(f => f.key)
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMapping = data.mapping || {};

        Object.entries(aiMapping).forEach(([excelCol, systemField]) => {
          if (typeof systemField === 'string' && unmappedColumns.includes(excelCol) && deduplicatedFields.some(f => f.key === systemField)) {
            newMapping[excelCol] = systemField;
            newAutoMapped.add(excelCol);
          }
        });
      }
    } catch (error) {
      console.error("AI Mapping failed, falling back to local fuzzy match", error);
    }

    // 3. Run Local Fuzzy Match (Cleanup / Fallback)
    excelColumns.forEach((excelCol) => {
      if (newMapping[excelCol]) return; // Already mapped (by AI or manually)

      const normalizedExcel = excelCol.toLowerCase().trim().replace(/[_\s-.]/g, '');

      // Direct match
      for (const field of deduplicatedFields) {
        const normalizedField = field.key.toLowerCase().replace(/[_\s-.]/g, '');
        if (
          normalizedExcel === normalizedField ||
          normalizedExcel.includes(normalizedField) ||
          normalizedField.includes(normalizedExcel)
        ) {
          newMapping[excelCol] = field.key;
          newAutoMapped.add(excelCol);
          return;
        }
      }

      // Fuzzy match
      let bestMatch = null;
      let minDistance = Infinity;

      for (const field of deduplicatedFields) {
        const normalizedField = field.key.toLowerCase().replace(/[_\s-.]/g, '');
        const distance = levenshtein(normalizedExcel, normalizedField);
        const threshold = Math.max(4, Math.floor(normalizedField.length * 0.4));

        if (distance <= threshold && distance < minDistance) {
          minDistance = distance;
          bestMatch = field.key;
        }
      }

      if (bestMatch) {
        newMapping[excelCol] = bestMatch;
        newAutoMapped.add(excelCol);
      }
    });

    setMapping(newMapping);
    setAutoMapped(newAutoMapped);
    setIsMapping(false);
  };

  // Auto-map columns on open using standard logic (trigger smart map)
  useEffect(() => {
    if (open && excelColumns.length > 0) {
      // Small timeout to allow render
      const timeout = setTimeout(() => {
        runSmartMapping();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [open, excelColumns, deduplicatedFields]);

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
            <div className="flex gap-2 items-center">
              {isMapping && <span className="text-xs text-purple-600 animate-pulse">AI Mapping...</span>}
              <Badge variant="outline">
                {Object.keys(mapping).length} of {excelColumns.length} columns mapped
              </Badge>
            </div>
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
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3 text-purple-500" />
                        Smart Mapped
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
          <div className="flex justify-between items-center pt-4 border-t gap-2">
            <Button
              variant="outline"
              onClick={runSmartMapping}
              type="button"
              className="gap-2"
              disabled={isMapping}
            >
              <Sparkles className={isMapping ? "h-4 w-4 text-purple-500 animate-spin" : "h-4 w-4 text-purple-500"} />
              {isMapping ? 'Analyzing...' : 'Smart Map (AI)'}
            </Button>

            <div className="flex gap-2">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
