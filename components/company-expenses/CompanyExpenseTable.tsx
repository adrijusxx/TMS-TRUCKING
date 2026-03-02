'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CompanyExpenseForm } from './CompanyExpenseForm';
import { ExpenseApprovalActions } from './ExpenseApprovalActions';
import { usePermissions } from '@/hooks/usePermissions';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import {
  createCompanyExpenseColumns,
  companyExpenseFilterDefinitions,
} from '@/lib/config/entities/company-expenses';
import type { EntityTableConfig } from '@/components/data-table/types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

const PAGE_SIZE = 50;

const companyExpenseConfig: EntityTableConfig<any> = {
  entityType: 'company-expenses',
  columns: createCompanyExpenseColumns(),
  defaultSort: [{ id: 'date', desc: true }],
  defaultPageSize: PAGE_SIZE,
  enableRowSelection: false,
  enableExport: true,
  enableImport: false,
  filterDefinitions: companyExpenseFilterDefinitions,
};

async function fetchCompanyExpenses(params: {
  page?: number;
  pageSize?: number;
  sorting?: SortingState;
  filters?: ColumnFiltersState;
  search?: string;
  [key: string]: any;
}) {
  const urlParams = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(params.pageSize || PAGE_SIZE),
  });

  // Map sorting
  if (params.sorting?.length) {
    urlParams.set('sortBy', params.sorting[0].id);
    urlParams.set('sortOrder', params.sorting[0].desc ? 'desc' : 'asc');
  } else {
    urlParams.set('sortBy', 'date');
    urlParams.set('sortOrder', 'desc');
  }

  // Map search
  if (params.search) urlParams.set('search', params.search);

  // Map column filters
  if (params.filters) {
    for (const filter of params.filters) {
      if (filter.id === 'date' && typeof filter.value === 'string' && filter.value.includes(':')) {
        const [from, to] = filter.value.split(':');
        if (from) urlParams.set('dateFrom', from);
        if (to) urlParams.set('dateTo', to);
      } else if (filter.value) {
        urlParams.set(filter.id, String(filter.value));
      }
    }
  }

  const res = await fetch(apiUrl(`/api/company-expenses/feed?${urlParams}`));
  if (!res.ok) throw new Error('Failed to fetch expenses');
  const json = await res.json();

  return {
    data: json.data || [],
    meta: {
      totalCount: json.meta?.total,
      totalPages: json.meta?.totalPages,
      page: params.page,
      pageSize: params.pageSize,
    },
  };
}

export function CompanyExpenseTable() {
  const qc = useQueryClient();
  const { can } = usePermissions();
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/company-expenses/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-expenses'] });
      qc.invalidateQueries({ queryKey: ['company-expenses-summary'] });
      setDeleteTargetId(null);
      toast.success('Expense deleted');
    },
    onError: () => toast.error('Failed to delete expense'),
  });

  const rowActions = useCallback((row: any) => {
    if (row.source !== 'COMPANY_EXPENSE') return null;
    return (
      <div className="flex items-center gap-0.5 flex-wrap">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditExpenseId(row.id)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={() => setDeleteTargetId(row.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        <ExpenseApprovalActions
          id={row.id}
          source={row.source}
          approvalStatus={row.approvalStatus}
          canApprove={can('company_expenses.approve')}
        />
      </div>
    );
  }, [can]);

  return (
    <>
      <DataTableWrapper
        config={companyExpenseConfig}
        fetchData={fetchCompanyExpenses}
        rowActions={rowActions}
        emptyMessage="No expenses found"
        enableColumnVisibility={false}
        enableRowSelection={false}
        enableSearch={true}
        searchPlaceholder="Search expenses..."
      />

      {/* Edit dialog */}
      <CompanyExpenseForm
        expenseId={editExpenseId}
        open={!!editExpenseId}
        onOpenChange={(v) => { if (!v) setEditExpenseId(null); }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(v) => { if (!v) setDeleteTargetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The expense record will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
