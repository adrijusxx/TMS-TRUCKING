'use client';

import { AlertCircle, ArrowRight, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DataAlignmentConsole } from '../DataAlignmentConsole';
import { getSystemFieldsForEntity } from '@/lib/import-export/field-utils';
import type { UseImportWizardReturn } from '@/lib/hooks/useImportWizard';

interface ImportMappingStepProps {
  wizard: UseImportWizardReturn;
}

export function ImportMappingStep({ wizard }: ImportMappingStepProps) {
  if (!wizard.importResult?.data?.[0]) return null;

  const csvHeaders = Object.keys(wizard.importResult.data[0]);

  return (
    <div className="space-y-4">
      {/* Saved Mappings Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Select onValueChange={wizard.handleLoadMapping}>
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue placeholder="Load Saved Mapping..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled className="text-muted-foreground text-xs">select a profile...</SelectItem>
              {wizard.savedMappings?.map(m => (
                <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
              ))}
              {(!wizard.savedMappings || wizard.savedMappings.length === 0) && (
                <div className="p-2 text-xs text-muted-foreground text-center">No saved profiles</div>
              )}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={wizard.isSaveDialogOpen} onOpenChange={wizard.setIsSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs gap-1" disabled={Object.keys(wizard.columnMapping).length === 0}>
              <Save className="w-3 h-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Save Mapping Profile</DialogTitle>
              <DialogDescription>Save your current column configuration to reuse later.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mapping-name" className="text-right">Name</Label>
                <Input
                  id="mapping-name"
                  value={wizard.mappingName}
                  onChange={(e) => wizard.setMappingName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., TQL Load Sheet"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => wizard.saveMappingMutation.mutate(wizard.mappingName)} disabled={!wizard.mappingName}>
                Save Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Alignment Console */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Data Alignment Console</Label>
        <DataAlignmentConsole
          columnMapping={wizard.columnMapping}
          isMapping={wizard.isAiMapping}
          systemFields={getSystemFieldsForEntity(wizard.entityType)}
          excelColumns={csvHeaders}
        />
      </div>

      {/* Missing Required Fields Alert */}
      {wizard.unmappedRequired.length > 0 && (
        <MissingFieldsAlert wizard={wizard} />
      )}

      {/* Inline Mapping Dropdowns */}
      <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
        {csvHeaders.map((header) => (
          <MappingRow
            key={header}
            header={header}
            wizard={wizard}
          />
        ))}
      </div>

      {/* Preview Button */}
      <Button
        className="w-full"
        onClick={() => wizard.previewMutation.mutate()}
        disabled={wizard.unmappedRequired.length > 0 || wizard.previewMutation.isPending}
      >
        {wizard.previewMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          `Preview Import (${wizard.importResult?.data.length ?? 0} rows)`
        )}
      </Button>
    </div>
  );
}

function MissingFieldsAlert({ wizard }: { wizard: UseImportWizardReturn }) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800 space-y-3">
      <div className="flex gap-2">
        <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Missing Required Fields</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Map them to a column below or set a default value.
          </p>
        </div>
      </div>
      <div className="grid gap-2 pl-6">
        {wizard.unmappedRequired.map(f => {
          const formattedName = f.fieldName.replace(/([A-Z])/g, ' $1').trim();
          let defaultValue = 'N/A';
          let label = 'Use "N/A"';
          if (f.fieldType === 'Int' || f.fieldType === 'Float') { defaultValue = '0'; label = 'Use 0'; }
          else if (f.fieldType === 'Boolean') { defaultValue = 'false'; label = 'Use False'; }
          else if (f.fieldType === 'DateTime') { defaultValue = new Date().toISOString(); label = 'Use Current Time'; }

          return (
            <div key={f.fieldName} className="flex items-center justify-between bg-yellow-100/50 dark:bg-yellow-900/30 p-2 rounded border border-yellow-200/50 dark:border-yellow-700/30">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-yellow-900 dark:text-yellow-100">{formattedName}</span>
                <span className="text-[10px] text-yellow-700 dark:text-yellow-300">Type: {f.fieldType}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs bg-background hover:bg-muted border-yellow-300 dark:border-yellow-700"
                onClick={() => wizard.setFixedValues(prev => ({ ...prev, [f.fieldName]: defaultValue }))}
              >
                {label}
              </Button>
            </div>
          );
        })}
        {wizard.unmappedRequired.length > 1 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs w-full mt-1 hover:bg-yellow-200/50 dark:hover:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200"
            onClick={() => {
              const updates: Record<string, string> = {};
              wizard.unmappedRequired.forEach(f => {
                if (f.fieldType === 'Int' || f.fieldType === 'Float') updates[f.fieldName] = '0';
                else if (f.fieldType === 'Boolean') updates[f.fieldName] = 'false';
                else if (f.fieldType === 'DateTime') updates[f.fieldName] = new Date().toISOString();
                else updates[f.fieldName] = 'N/A';
              });
              wizard.setFixedValues(prev => ({ ...prev, ...updates }));
            }}
          >
            Set Defaults for All Missing Fields
          </Button>
        )}
      </div>
    </div>
  );
}

function MappingRow({ header, wizard }: { header: string; wizard: UseImportWizardReturn }) {
  const mappedKey = wizard.columnMapping[header];
  const isMapped = !!mappedKey;
  const sampleValue = wizard.importResult?.data?.[0]?.[header];

  // Suggest mapping for unmapped headers
  const normalizeSimple = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const suggestion = !isMapped
    ? wizard.unmappedRequired.find(f => {
      const normHeader = normalizeSimple(header);
      const normField = normalizeSimple(f.fieldName);
      if (normHeader === normField) return true;
      const suggestions = f.suggestedCsvHeaders || [];
      return suggestions.some(s => {
        const ns = normalizeSimple(s);
        return normHeader.includes(ns) || ns.includes(normHeader);
      });
    })
    : undefined;

  const rowStyle = suggestion
    ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-500'
    : 'hover:bg-muted/50';

  return (
    <div className={`p-3 flex items-center justify-between gap-4 ${rowStyle}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate" title={header}>
            {header}
            {wizard.systemFields.find(f => f.key === mappedKey)?.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </p>
          {suggestion && (
            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">
              Recommended: {suggestion.fieldName.replace(/([A-Z])/g, ' $1').trim()}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          Sample: {String(sampleValue || '').slice(0, 30)}
        </p>
      </div>
      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
      <div className="w-[180px] shrink-0">
        <Select
          value={mappedKey || 'ignore'}
          onValueChange={(val) => {
            wizard.setColumnMapping(prev => {
              const next = { ...prev };
              if (val === 'ignore') delete next[header];
              else next[header] = val;
              return next;
            });
          }}
        >
          <SelectTrigger className={`h-8 text-xs ${suggestion ? 'border-yellow-400 dark:border-yellow-600 ring-1 ring-yellow-400/20' : ''}`}>
            <SelectValue placeholder={suggestion ? `Suggest: ${suggestion.fieldName.replace(/([A-Z])/g, ' $1').trim()}` : 'Ignore Column'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ignore" className="text-muted-foreground italic">Ignore Column</SelectItem>
            {wizard.systemFields.map(field => {
              const isMissingRequired = wizard.unmappedRequired.some(f => f.fieldName === field.key);
              return (
                <SelectItem key={field.key} value={field.key}>
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className={isMissingRequired ? 'font-medium text-destructive' : ''}>
                      {field.label}
                    </span>
                    {field.required && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-4 px-1 ${isMissingRequired ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-destructive/10 text-destructive border-destructive/20'}`}
                      >
                        {isMissingRequired ? 'MISSING' : 'Required'}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
