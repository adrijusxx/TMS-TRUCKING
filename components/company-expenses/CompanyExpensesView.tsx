'use client';

import { useQueryClient } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageShell';
import { CompanyExpenseSummaryCards } from './CompanyExpenseSummaryCards';
import { CompanyExpenseTable } from './CompanyExpenseTable';
import { CompanyExpenseForm } from './CompanyExpenseForm';
import { PaymentInstrumentManager } from './PaymentInstrumentManager';
import { CompanyExpenseTypeManager } from './CompanyExpenseTypeManager';
import { DepartmentBudgetManager } from './DepartmentBudgetManager';

export function CompanyExpensesView() {
  const queryClient = useQueryClient();

  const actions = (
    <>
      <DepartmentBudgetManager />
      <CompanyExpenseTypeManager />
      <PaymentInstrumentManager />
      <CompanyExpenseForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ['company-expenses-feed'] })} />
    </>
  );

  return (
    <PageShell
      title="Company Expenses"
      description="Track all outgoing company payments across cards, accounts, and departments"
      actions={actions}
    >
      <CompanyExpenseSummaryCards />
      <CompanyExpenseTable />
    </PageShell>
  );
}
