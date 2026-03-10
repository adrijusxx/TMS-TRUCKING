'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn, formatCurrency, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

const BUILT_IN_DEDUCTIONS: Record<string, string> = {
  FUEL_ADVANCE: 'Fuel Advance', CASH_ADVANCE: 'Cash Advance', INSURANCE: 'Insurance',
  OCCUPATIONAL_ACCIDENT: 'Occupational Accident', TRUCK_PAYMENT: 'Truck Payment',
  TRUCK_LEASE: 'Truck Lease', ESCROW: 'Escrow', EQUIPMENT_RENTAL: 'Equipment Rental',
  MAINTENANCE: 'Maintenance', TOLLS: 'Tolls', PERMITS: 'Permits',
  FUEL_CARD: 'Fuel Card', FUEL_CARD_FEE: 'Fuel Card Fee',
  TRAILER_RENTAL: 'Trailer Rental', OTHER: 'Other',
};

const BUILT_IN_ADDITIONS: Record<string, string> = {
  BONUS: 'Bonus', OVERTIME: 'Overtime', INCENTIVE: 'Incentive', REIMBURSEMENT: 'Reimbursement',
};

interface CustomType { id: string; name: string; category: string; }

interface DeductionRuleFormProps {
  isAddition: boolean;
  onSubmit: (data: any) => void;
  isPending: boolean;
  /** Existing rule data for edit mode */
  editRule?: any;
}

export default function DeductionRuleForm({ isAddition, onSubmit, isPending, editRule }: DeductionRuleFormProps) {
  const builtInTypes = isAddition ? BUILT_IN_ADDITIONS : BUILT_IN_DEDUCTIONS;
  const [typeOpen, setTypeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customTypes, setCustomTypes] = useState<CustomType[]>([]);

  const initialType = editRule?.deductionType || Object.keys(builtInTypes)[0];
  const initialLabel = editRule
    ? (builtInTypes[editRule.deductionType] || editRule.name || editRule.deductionType)
    : Object.values(builtInTypes)[0];

  const [form, setForm] = useState({
    name: editRule?.name || '',
    deductionType: initialType,
    typeLabel: initialLabel,
    isAddition,
    calculationType: editRule?.calculationType || 'FIXED',
    amount: editRule?.amount?.toString() || '',
    percentage: editRule?.percentage?.toString() || '',
    perMileRate: editRule?.perMileRate?.toString() || '',
    frequency: editRule?.deductionFrequency || editRule?.frequency || 'PER_SETTLEMENT',
    goalAmount: editRule?.goalAmount?.toString() || '',
    maxAmount: editRule?.maxAmount?.toString() || '',
    minGrossPay: editRule?.minGrossPay?.toString() || '',
  });

  // Fetch recent rules as presets (only in create mode)
  const { data: recentData } = useQuery({
    queryKey: ['deduction-rules-recent', isAddition ? 'addition' : 'deduction'],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/deduction-rules?isAddition=${isAddition}`));
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !editRule,
  });

  // Get last 3 unique presets by deductionType+calculationType+amount
  const recentPresets = !editRule ? getUniquePresets(recentData?.data || [], 3) : [];

  useEffect(() => {
    const fetchCustomTypes = async () => {
      try {
        const res = await fetch(apiUrl('/api/deduction-type-templates?isActive=true'));
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) setCustomTypes(data.data);
        }
      } catch { /* ignore */ }
    };
    fetchCustomTypes();
  }, []);

  const category = isAddition ? 'addition' : 'deduction';
  const filteredCustom = customTypes.filter(t => t.category === category);

  const handleTypeSelect = (key: string, label: string, isCustom: boolean) => {
    setForm(p => ({ ...p, deductionType: isCustom ? 'OTHER' : key, typeLabel: label, name: p.name || label }));
    setTypeOpen(false);
    setSearchTerm('');
  };

  const createCustomType = async (name: string) => {
    try {
      const res = await fetch(apiUrl('/api/deduction-type-templates'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setCustomTypes(prev => [...prev, data.data]);
          toast.success(`Custom type "${name}" created`);
          handleTypeSelect('OTHER', name, true);
          return;
        }
      }
      const err = await res.json().catch(() => null);
      toast.error(err?.error?.message || 'Failed to create type');
    } catch {
      toast.error('Failed to create custom type');
    }
  };

  const applyPreset = (preset: any) => {
    setForm(p => ({
      ...p,
      name: preset.name,
      deductionType: preset.deductionType,
      typeLabel: builtInTypes[preset.deductionType] || preset.name,
      calculationType: preset.calculationType,
      amount: preset.amount?.toString() || '',
      percentage: preset.percentage?.toString() || '',
      perMileRate: preset.perMileRate?.toString() || '',
      frequency: preset.deductionFrequency || preset.frequency || 'PER_SETTLEMENT',
      goalAmount: preset.goalAmount?.toString() || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      deductionType: form.deductionType,
      isAddition: form.isAddition,
      calculationType: form.calculationType,
      amount: form.calculationType === 'FIXED' && form.amount ? parseFloat(form.amount) : undefined,
      percentage: form.calculationType === 'PERCENTAGE' && form.percentage ? parseFloat(form.percentage) : undefined,
      perMileRate: form.calculationType === 'PER_MILE' && form.perMileRate ? parseFloat(form.perMileRate) : undefined,
      frequency: form.frequency,
      goalAmount: form.goalAmount ? parseFloat(form.goalAmount) : undefined,
      maxAmount: form.maxAmount ? parseFloat(form.maxAmount) : undefined,
      minGrossPay: form.minGrossPay ? parseFloat(form.minGrossPay) : undefined,
    });
  };

  const calcLabel = form.calculationType === 'PERCENTAGE' ? 'Percentage (%)' : form.calculationType === 'PER_MILE' ? 'Rate per Mile ($)' : 'Amount ($)';
  const calcField = form.calculationType === 'PERCENTAGE' ? 'percentage' : form.calculationType === 'PER_MILE' ? 'perMileRate' : 'amount';
  const calcStep = form.calculationType === 'PER_MILE' ? '0.001' : '0.01';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Recent presets (create mode only) */}
      {recentPresets.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Recent {isAddition ? 'Additions' : 'Deductions'}</Label>
          <div className="flex flex-wrap gap-2">
            {recentPresets.map((preset: any, i: number) => (
              <Button
                key={i}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => applyPreset(preset)}
              >
                {preset.name} — {formatRuleAmount(preset)}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Type</Label>
          <Popover open={typeOpen} onOpenChange={setTypeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                {form.typeLabel || 'Select type...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search or create..." value={searchTerm} onValueChange={setSearchTerm} />
                <CommandList>
                  {searchTerm && (
                    <CommandEmpty>
                      <Button
                        variant="ghost"
                        className="w-full text-sm justify-start h-auto py-1.5 px-2 font-normal"
                        onClick={() => createCustomType(searchTerm)}
                      >
                        Create &quot;{searchTerm}&quot;
                      </Button>
                    </CommandEmpty>
                  )}
                  <CommandGroup heading={isAddition ? 'Built-in Additions' : 'Built-in Deductions'}>
                    {Object.entries(builtInTypes).map(([key, label]) => (
                      <CommandItem key={key} value={label} onSelect={() => handleTypeSelect(key, label, false)}>
                        <Check className={cn('mr-2 h-4 w-4', form.deductionType === key && form.typeLabel === label ? 'opacity-100' : 'opacity-0')} />
                        {label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {filteredCustom.length > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Custom Types">
                        {filteredCustom.map((ct) => (
                          <CommandItem key={ct.id} value={ct.name} onSelect={() => handleTypeSelect('OTHER', ct.name, true)}>
                            <Check className={cn('mr-2 h-4 w-4', form.typeLabel === ct.name ? 'opacity-100' : 'opacity-0')} />
                            {ct.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>Calculation</Label>
          <Select value={form.calculationType} onValueChange={(v) => setForm(p => ({ ...p, calculationType: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="FIXED">Fixed Amount</SelectItem>
              <SelectItem value="PERCENTAGE">Percentage</SelectItem>
              <SelectItem value="PER_MILE">Per Mile</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{calcLabel}</Label>
          <Input
            type="number"
            step={calcStep}
            max={form.calculationType === 'PERCENTAGE' ? '100' : undefined}
            value={form[calcField as keyof typeof form]}
            onChange={(e) => setForm(p => ({ ...p, [calcField]: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select value={form.frequency} onValueChange={(v) => setForm(p => ({ ...p, frequency: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PER_SETTLEMENT">Per Settlement</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="BIWEEKLY">Bi-Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="ONE_TIME">One Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Goal Amount</Label>
          <Input type="number" step="0.01" placeholder="Optional" value={form.goalAmount} onChange={(e) => setForm(p => ({ ...p, goalAmount: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Max Amount</Label>
          <Input type="number" step="0.01" placeholder="Optional" value={form.maxAmount} onChange={(e) => setForm(p => ({ ...p, maxAmount: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Min Gross Pay</Label>
          <Input type="number" step="0.01" placeholder="Optional" value={form.minGrossPay} onChange={(e) => setForm(p => ({ ...p, minGrossPay: e.target.value }))} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {editRule ? 'Save Changes' : 'Create Rule'}
      </Button>
    </form>
  );
}

function formatRuleAmount(rule: any): string {
  if (rule.calculationType === 'FIXED') return formatCurrency(rule.amount || 0);
  if (rule.calculationType === 'PERCENTAGE') return `${rule.percentage || 0}%`;
  if (rule.calculationType === 'PER_MILE') return `${formatCurrency(rule.perMileRate || 0)}/mi`;
  return '-';
}

/** Get last N unique presets by deductionType+calculationType+amount combo */
function getUniquePresets(rules: any[], count: number): any[] {
  const seen = new Set<string>();
  const presets: any[] = [];
  for (const rule of rules) {
    const key = `${rule.deductionType}|${rule.calculationType}|${rule.amount ?? ''}|${rule.percentage ?? ''}|${rule.perMileRate ?? ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      presets.push(rule);
      if (presets.length >= count) break;
    }
  }
  return presets;
}
