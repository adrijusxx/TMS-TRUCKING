'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { apiUrl, formatDate, formatCurrency } from '@/lib/utils';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface InsurancePolicyData {
  id: string;
  policyType: string;
  policyNumber: string;
  insuranceCompany: string;
  agentName?: string | null;
  agentPhone?: string | null;
  agentEmail?: string | null;
  coverageLimit?: number | null;
  deductible?: number | null;
  effectiveDate: string | Date;
  renewalDate: string | Date;
  isActive: boolean;
  claims: Array<{ id: string; claimNumber: string; status: string }>;
}

const policyTypeLabels: Record<string, string> = {
  LIABILITY: 'Liability',
  PHYSICAL_DAMAGE: 'Physical Damage',
  CARGO: 'Cargo',
  GENERAL_LIABILITY: 'General Liability',
};

function getExpirationStatus(renewalDate: string | Date) {
  const renewal = new Date(renewalDate);
  const now = new Date();
  const days = Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: 'Expired', className: 'bg-red-100 text-red-800 border-red-200' };
  if (days <= 30) return { label: `${days}d left`, className: 'bg-orange-100 text-orange-800 border-orange-200' };
  if (days <= 90) return { label: `${days}d left`, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  return { label: 'Active', className: 'bg-green-100 text-green-800 border-green-200' };
}

function createColumns(actions?: { onEdit?: (p: InsurancePolicyData) => void; onDelete?: (p: InsurancePolicyData) => void }): ExtendedColumnDef<InsurancePolicyData>[] {
  return [
    { id: 'policyNumber', accessorKey: 'policyNumber', header: 'Policy #', cell: ({ row }) => <span className="font-medium">{row.original.policyNumber}</span>, defaultVisible: true, required: true },
    { id: 'policyType', accessorKey: 'policyType', header: 'Type', cell: ({ row }) => <Badge variant="outline">{policyTypeLabels[row.original.policyType] ?? row.original.policyType}</Badge>, defaultVisible: true, filterType: 'select', filterOptions: Object.entries(policyTypeLabels).map(([value, label]) => ({ value, label })) },
    { id: 'insuranceCompany', accessorKey: 'insuranceCompany', header: 'Company', cell: ({ row }) => row.original.insuranceCompany, defaultVisible: true },
    { id: 'agentName', accessorKey: 'agentName', header: 'Agent', cell: ({ row }) => row.original.agentName ?? <span className="text-muted-foreground">-</span>, defaultVisible: true },
    { id: 'coverageLimit', header: 'Coverage Limit', cell: ({ row }) => row.original.coverageLimit ? formatCurrency(row.original.coverageLimit) : <span className="text-muted-foreground">-</span>, defaultVisible: true },
    { id: 'deductible', header: 'Deductible', cell: ({ row }) => row.original.deductible ? formatCurrency(row.original.deductible) : <span className="text-muted-foreground">-</span>, defaultVisible: true },
    { id: 'effectiveDate', accessorKey: 'effectiveDate', header: 'Effective', cell: ({ row }) => formatDate(row.original.effectiveDate), defaultVisible: true },
    { id: 'renewalDate', accessorKey: 'renewalDate', header: 'Renewal', cell: ({ row }) => formatDate(row.original.renewalDate), defaultVisible: true },
    {
      id: 'status', header: 'Status',
      cell: ({ row }) => {
        const status = getExpirationStatus(row.original.renewalDate);
        return <Badge variant="outline" className={status.className}>{status.label}</Badge>;
      },
      defaultVisible: true,
    },
    { id: 'claims', header: 'Claims', cell: ({ row }) => <Badge variant="outline">{row.original.claims.length}</Badge>, defaultVisible: true },
    ...(actions ? [{
      id: 'actions', header: '',
      cell: ({ row }: { row: { original: InsurancePolicyData } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.onEdit && <DropdownMenuItem onClick={() => actions.onEdit!(row.original)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>}
            {actions.onDelete && <DropdownMenuItem onClick={() => actions.onDelete!(row.original)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      defaultVisible: true,
    } as ExtendedColumnDef<InsurancePolicyData>] : []),
  ];
}

export default function InsurancePoliciesTable() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<InsurancePolicyData | null>(null);
  const [deletePolicy, setDeletePolicy] = useState<InsurancePolicyData | null>(null);
  const canManage = can('safety.insurance.manage');

  const refresh = useCallback(() => { queryClient.invalidateQueries({ queryKey: ['safety-insurance-policies'] }); }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/safety/insurance/policies/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete policy');
    },
    onSuccess: () => { toast.success('Policy deleted'); setDeletePolicy(null); refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns = useMemo(() => createColumns({
    onEdit: canManage ? (p) => setEditPolicy(p) : undefined,
    onDelete: canManage ? (p) => setDeletePolicy(p) : undefined,
  }), [canManage]);

  const fetchPolicies = useCallback(async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState }) => {
    const qp = new URLSearchParams();
    if (params.page) qp.set('page', String(params.page));
    if (params.pageSize) qp.set('limit', String(params.pageSize));
    const res = await fetch(apiUrl(`/api/safety/insurance/policies?${qp.toString()}`));
    if (!res.ok) throw new Error('Failed to fetch policies');
    const json = await res.json();
    return { data: json.data as InsurancePolicyData[], meta: json.meta };
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const data = {
        policyType: formData.get('policyType'), policyNumber: formData.get('policyNumber'),
        insuranceCompany: formData.get('insuranceCompany'), agentName: formData.get('agentName') || null,
        agentPhone: formData.get('agentPhone') || null, agentEmail: formData.get('agentEmail') || null,
        coverageLimit: formData.get('coverageLimit') ? Number(formData.get('coverageLimit')) : null,
        deductible: formData.get('deductible') ? Number(formData.get('deductible')) : null,
        effectiveDate: formData.get('effectiveDate'), renewalDate: formData.get('renewalDate'),
      };
      const url = editPolicy ? apiUrl(`/api/safety/insurance/policies/${editPolicy.id}`) : apiUrl('/api/safety/insurance/policies');
      const res = await fetch(url, { method: editPolicy ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error('Failed to save policy');
    },
    onSuccess: () => { toast.success(editPolicy ? 'Policy updated' : 'Policy created'); setCreateOpen(false); setEditPolicy(null); refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {canManage && <Button onClick={() => { setEditPolicy(null); setCreateOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Policy</Button>}
      </div>

      <DataTableWrapper<InsurancePolicyData>
        config={{ entityType: 'safety-insurance-policies', columns, defaultSort: [{ id: 'renewalDate', desc: false }], defaultPageSize: 20, enableColumnVisibility: true }}
        fetchData={fetchPolicies}
        emptyMessage="No insurance policies found"
      />

      <Dialog open={createOpen || !!editPolicy} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditPolicy(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editPolicy ? 'Edit Policy' : 'Add Insurance Policy'}</DialogTitle></DialogHeader>
          <form action={(formData) => saveMutation.mutate(formData)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="policyType">Type *</Label>
                <Select name="policyType" defaultValue={editPolicy?.policyType ?? 'LIABILITY'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(policyTypeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="policyNumber">Policy # *</Label><Input name="policyNumber" required defaultValue={editPolicy?.policyNumber ?? ''} /></div>
            </div>
            <div><Label htmlFor="insuranceCompany">Insurance Company *</Label><Input name="insuranceCompany" required defaultValue={editPolicy?.insuranceCompany ?? ''} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label htmlFor="agentName">Agent</Label><Input name="agentName" defaultValue={editPolicy?.agentName ?? ''} /></div>
              <div><Label htmlFor="agentPhone">Phone</Label><Input name="agentPhone" defaultValue={editPolicy?.agentPhone ?? ''} /></div>
              <div><Label htmlFor="agentEmail">Email</Label><Input name="agentEmail" type="email" defaultValue={editPolicy?.agentEmail ?? ''} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="coverageLimit">Coverage Limit</Label><Input name="coverageLimit" type="number" step="0.01" defaultValue={editPolicy?.coverageLimit ?? ''} /></div>
              <div><Label htmlFor="deductible">Deductible</Label><Input name="deductible" type="number" step="0.01" defaultValue={editPolicy?.deductible ?? ''} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="effectiveDate">Effective Date *</Label><Input name="effectiveDate" type="date" required defaultValue={editPolicy ? new Date(editPolicy.effectiveDate).toISOString().split('T')[0] : ''} /></div>
              <div><Label htmlFor="renewalDate">Renewal Date *</Label><Input name="renewalDate" type="date" required defaultValue={editPolicy ? new Date(editPolicy.renewalDate).toISOString().split('T')[0] : ''} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); setEditPolicy(null); }}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : editPolicy ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePolicy} onOpenChange={(open) => { if (!open) setDeletePolicy(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Policy</AlertDialogTitle><AlertDialogDescription>Delete policy {deletePolicy?.policyNumber}?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletePolicy && deleteMutation.mutate(deletePolicy.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
