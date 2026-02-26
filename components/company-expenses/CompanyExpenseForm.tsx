'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { PaymentInstrumentPicker } from './PaymentInstrumentPicker';
import { format } from 'date-fns';

const DEPARTMENTS = [
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'FLEET', label: 'Fleet' },
  { value: 'RECRUITING', label: 'Recruiting' },
  { value: 'DISPATCH', label: 'Dispatch' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'ACCOUNTING', label: 'Accounting' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'OTHER', label: 'Other' },
];

const RECURRING_FREQUENCIES = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUAL', label: 'Annual' },
];

interface ExpenseType {
  id: string;
  name: string;
  color: string | null;
}

interface FormData {
  amount: string;
  date: string;
  description: string;
  expenseTypeId: string;
  department: string;
  paymentInstrumentId: string | null;
  vendorName: string;
  notes: string;
  isRecurring: boolean;
  recurringFrequency: string;
}

const defaultForm: FormData = {
  amount: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  description: '',
  expenseTypeId: '',
  department: 'OTHER',
  paymentInstrumentId: null,
  vendorName: '',
  notes: '',
  isRecurring: false,
  recurringFrequency: 'MONTHLY',
};

interface CompanyExpenseFormProps {
  onSuccess?: () => void;
  /** When provided the form opens in edit mode */
  expenseId?: string | null;
  /** Controlled open state — when provided the trigger button is hidden */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CompanyExpenseForm({
  onSuccess,
  expenseId,
  open: controlledOpen,
  onOpenChange,
}: CompanyExpenseFormProps) {
  const isEditMode = !!expenseId;
  const isControlled = controlledOpen !== undefined;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen! : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };

  const [form, setForm] = useState<FormData>(defaultForm);
  const qc = useQueryClient();

  // Fetch full expense record in edit mode
  const { data: expenseData, isLoading: loadingExpense } = useQuery({
    queryKey: ['company-expense-detail', expenseId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/company-expenses/${expenseId}`));
      if (!res.ok) throw new Error('Failed to load expense');
      const json = await res.json();
      return json.data;
    },
    enabled: isEditMode && open,
    staleTime: 30_000,
  });

  // Pre-fill form when expense data arrives
  useEffect(() => {
    if (expenseData && isEditMode) {
      setForm({
        amount: String(expenseData.amount),
        date: format(new Date(expenseData.date), 'yyyy-MM-dd'),
        description: expenseData.description,
        expenseTypeId: expenseData.expenseType.id,
        department: expenseData.department ?? 'OTHER',
        paymentInstrumentId: expenseData.paymentInstrument?.id ?? null,
        vendorName: expenseData.vendorName ?? expenseData.vendor?.name ?? '',
        notes: expenseData.notes ?? '',
        isRecurring: expenseData.isRecurring,
        recurringFrequency: expenseData.recurringFrequency ?? 'MONTHLY',
      });
    }
  }, [expenseData, isEditMode]);

  // Reset form when create dialog closes
  useEffect(() => {
    if (!open && !isEditMode) setForm(defaultForm);
  }, [open, isEditMode]);

  const { data: expenseTypes = [] } = useQuery({
    queryKey: ['company-expense-types'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/company-expense-types'));
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      return json.data as ExpenseType[];
    },
    enabled: open,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = isEditMode
        ? apiUrl(`/api/company-expenses/${expenseId}`)
        : apiUrl('/api/company-expenses');
      const res = await fetch(url, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(data.amount),
          date: new Date(data.date).toISOString(),
          description: data.description,
          expenseTypeId: data.expenseTypeId,
          department: data.department,
          paymentInstrumentId: data.paymentInstrumentId || null,
          vendorName: data.vendorName || null,
          notes: data.notes || null,
          isRecurring: data.isRecurring,
          recurringFrequency: data.isRecurring ? data.recurringFrequency : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `Failed to ${isEditMode ? 'update' : 'create'} expense`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-expenses'] });
      qc.invalidateQueries({ queryKey: ['company-expenses-feed'] });
      qc.invalidateQueries({ queryKey: ['company-expenses-summary'] });
      if (isEditMode) qc.invalidateQueries({ queryKey: ['company-expense-detail', expenseId] });
      setOpen(false);
      if (!isEditMode) setForm(defaultForm);
      toast.success(isEditMode ? 'Expense updated' : 'Expense recorded');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!form.description) {
      toast.error('Description is required');
      return;
    }
    if (!form.expenseTypeId) {
      toast.error('Select an expense type');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Expense
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Expense' : 'Record Company Expense'}</DialogTitle>
        </DialogHeader>

        {loadingExpense ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Amount + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What was this expense for?"
              />
            </div>

            {/* Type + Department */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Expense Type *</Label>
                <Select
                  value={form.expenseTypeId}
                  onValueChange={(v) => setForm((f) => ({ ...f, expenseTypeId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          {t.color && (
                            <div
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: t.color }}
                            />
                          )}
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) => setForm((f) => ({ ...f, department: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Instrument */}
            <div className="space-y-1.5">
              <Label>Card / Payment Account</Label>
              <PaymentInstrumentPicker
                value={form.paymentInstrumentId}
                onChange={(v) => setForm((f) => ({ ...f, paymentInstrumentId: v }))}
                placeholder="Select card or account..."
              />
            </div>

            {/* Vendor */}
            <div className="space-y-1.5">
              <Label>Vendor / Payee</Label>
              <Input
                value={form.vendorName}
                onChange={(e) => setForm((f) => ({ ...f, vendorName: e.target.value }))}
                placeholder="Who was paid?"
              />
            </div>

            {/* Recurring toggle */}
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Switch
                checked={form.isRecurring}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isRecurring: v }))}
                id="recurring"
              />
              <Label htmlFor="recurring" className="cursor-pointer">
                Recurring expense
              </Label>
              {form.isRecurring && (
                <Select
                  value={form.recurringFrequency}
                  onValueChange={(v) => setForm((f) => ({ ...f, recurringFrequency: v }))}
                >
                  <SelectTrigger className="w-36 h-7 text-xs ml-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRING_FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending || loadingExpense}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Record Expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
