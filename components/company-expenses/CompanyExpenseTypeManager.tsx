'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6B7280',
];

interface ExpenseType {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface TypeFormData {
  name: string;
  description: string;
  color: string;
}

const defaultForm: TypeFormData = { name: '', description: '', color: PRESET_COLORS[0] };

export function CompanyExpenseTypeManager() {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseType | null>(null);
  const [form, setForm] = useState<TypeFormData>(defaultForm);

  const qc = useQueryClient();

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['company-expense-types', 'manage'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/company-expense-types'));
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      return json.data as ExpenseType[];
    },
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: TypeFormData & { id?: string }) => {
      const { id, ...rest } = data;
      const url = id
        ? apiUrl(`/api/company-expense-types/${id}`)
        : apiUrl('/api/company-expense-types');
      const res = await fetch(url, {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest),
      });
      if (!res.ok) throw new Error('Failed to save');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-expense-types'] });
      setFormOpen(false);
      setEditing(null);
      setForm(defaultForm);
      toast.success(editing ? 'Type updated' : 'Type created');
    },
    onError: () => toast.error('Failed to save expense type'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/company-expense-types/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-expense-types'] });
      toast.success('Type deleted');
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to delete'),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(defaultForm);
    setFormOpen(true);
  };

  const openEdit = (t: ExpenseType) => {
    setEditing(t);
    setForm({ name: t.name, description: t.description ?? '', color: t.color ?? PRESET_COLORS[0] });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name) { toast.error('Name is required'); return; }
    saveMutation.mutate({ ...form, id: editing?.id });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            Expense Types
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Expense Types</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Button onClick={openAdd} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Type
            </Button>

            {isLoading && (
              <div className="text-sm text-muted-foreground py-4 text-center">Loading...</div>
            )}

            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
              {types.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: type.color ?? '#6b7280' }}
                    />
                    <span className="text-sm font-medium truncate">{type.name}</span>
                    {type.isDefault && (
                      <Badge variant="info" size="xs">Default</Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => openEdit(type)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    {!type.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => deleteMutation.mutate(type.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {!isLoading && types.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                  No expense types yet.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Create'} Expense Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Drug Tests, Recruiting, Hotels"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
              />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
