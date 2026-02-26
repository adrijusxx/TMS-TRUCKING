'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, CreditCard, MoreHorizontal, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

const INSTRUMENT_TYPES = [
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'DEBIT_CARD', label: 'Debit Card' },
  { value: 'BANK_ACCOUNT', label: 'Bank Account' },
  { value: 'ZELLE', label: 'Zelle' },
  { value: 'CASHAPP', label: 'Cash App' },
  { value: 'VENMO', label: 'Venmo' },
  { value: 'EFS', label: 'EFS' },
  { value: 'COMDATA', label: 'Comdata' },
  { value: 'CASH', label: 'Cash' },
  { value: 'OTHER', label: 'Other' },
];

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6B7280',
];

interface Instrument {
  id: string;
  name: string;
  institutionName: string;
  type: string;
  lastFour: string | null;
  cardholderName: string | null;
  color: string | null;
  isActive: boolean;
  monthlyLimit: number | null;
  alertThreshold: number | null;
  notes: string | null;
}

interface InstrumentFormData {
  name: string;
  institutionName: string;
  type: string;
  lastFour: string;
  cardholderName: string;
  color: string;
  monthlyLimit: string;
  alertThreshold: string;
  notes: string;
}

const defaultForm: InstrumentFormData = {
  name: '',
  institutionName: '',
  type: 'CREDIT_CARD',
  lastFour: '',
  cardholderName: '',
  color: PRESET_COLORS[0],
  monthlyLimit: '',
  alertThreshold: '',
  notes: '',
};

export function PaymentInstrumentManager() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Instrument | null>(null);
  const [form, setForm] = useState<InstrumentFormData>(defaultForm);

  const qc = useQueryClient();

  const { data: instruments = [], isLoading } = useQuery({
    queryKey: ['payment-instruments', 'all'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/payment-instruments?includeInactive=true'));
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      return json.data as Instrument[];
    },
    enabled: sheetOpen,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<InstrumentFormData> & { id?: string }) => {
      const { id, ...rest } = data;
      const body = {
        name: rest.name,
        institutionName: rest.institutionName,
        type: rest.type,
        lastFour: rest.lastFour || null,
        cardholderName: rest.cardholderName || null,
        color: rest.color || null,
        monthlyLimit: rest.monthlyLimit ? parseFloat(rest.monthlyLimit) : null,
        alertThreshold: rest.alertThreshold ? parseFloat(rest.alertThreshold) : null,
        notes: rest.notes || null,
      };
      const url = id ? apiUrl(`/api/payment-instruments/${id}`) : apiUrl('/api/payment-instruments');
      const res = await fetch(url, {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-instruments'] });
      setFormOpen(false);
      setEditing(null);
      setForm(defaultForm);
      toast.success(editing ? 'Card updated' : 'Card added');
    },
    onError: () => toast.error('Failed to save payment instrument'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(apiUrl(`/api/payment-instruments/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-instruments'] }),
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/payment-instruments/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-instruments'] });
      toast.success('Card deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(defaultForm);
    setFormOpen(true);
  };

  const openEdit = (i: Instrument) => {
    setEditing(i);
    setForm({
      name: i.name,
      institutionName: i.institutionName,
      type: i.type,
      lastFour: i.lastFour ?? '',
      cardholderName: i.cardholderName ?? '',
      color: i.color ?? PRESET_COLORS[0],
      monthlyLimit: i.monthlyLimit != null ? String(i.monthlyLimit) : '',
      alertThreshold: i.alertThreshold != null ? String(i.alertThreshold) : '',
      notes: i.notes ?? '',
    });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.institutionName || !form.type) {
      toast.error('Name, institution, and type are required');
      return;
    }
    saveMutation.mutate({ ...form, id: editing?.id });
  };

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Manage Cards
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[500px] sm:w-[580px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Payment Instruments</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <Button onClick={openAdd} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Card / Account
            </Button>

            {isLoading && (
              <div className="text-sm text-muted-foreground py-4 text-center">Loading...</div>
            )}

            <div className="space-y-2">
              {instruments.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center justify-between rounded-lg border p-3 gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${inst.color ?? '#6b7280'}22` }}
                    >
                      <CreditCard
                        className="h-4 w-4"
                        style={{ color: inst.color ?? '#6b7280' }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{inst.name}</span>
                        {!inst.isActive && (
                          <Badge variant="neutral" size="xs">Inactive</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {inst.institutionName}
                        {inst.lastFour && ` · ···${inst.lastFour}`}
                        {inst.monthlyLimit && ` · Limit: $${inst.monthlyLimit.toLocaleString()}`}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(inst)}>
                        <Edit className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleMutation.mutate({ id: inst.id, isActive: !inst.isActive })}
                      >
                        {inst.isActive ? (
                          <>
                            <PowerOff className="mr-2 h-3.5 w-3.5" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 h-3.5 w-3.5" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteMutation.mutate(inst.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {!isLoading && instruments.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                  No payment instruments yet. Add your first card or account.
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Payment Instrument</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nickname *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Chase Sapphire - John"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Institution *</Label>
                <Input
                  value={form.institutionName}
                  onChange={(e) => setForm((f) => ({ ...f, institutionName: e.target.value }))}
                  placeholder="Chase Bank"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTRUMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Last 4 Digits</Label>
                <Input
                  value={form.lastFour}
                  onChange={(e) => setForm((f) => ({ ...f, lastFour: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="4521"
                  maxLength={4}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Cardholder Name</Label>
              <Input
                value={form.cardholderName}
                onChange={(e) => setForm((f) => ({ ...f, cardholderName: e.target.value }))}
                placeholder="John Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monthly Limit ($)</Label>
                <Input
                  type="number"
                  value={form.monthlyLimit}
                  onChange={(e) => setForm((f) => ({ ...f, monthlyLimit: e.target.value }))}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Alert Threshold ($)</Label>
                <Input
                  type="number"
                  value={form.alertThreshold}
                  onChange={(e) => setForm((f) => ({ ...f, alertThreshold: e.target.value }))}
                  placeholder="4000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: form.color === c ? 'white' : 'transparent',
                      outline: form.color === c ? `2px solid ${c}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
