import ExpenseCategories from '@/components/settings/customizations/ExpenseCategories';
import ExpensesWorkflowInfo from '@/components/accounting/ExpensesWorkflowInfo';
import { PageShell } from '@/components/layout/PageShell';

export default function ExpensesPage() {
  return (
    <PageShell title="Expense Categories" description="Manage expense types and categories for load costing">
      <ExpensesWorkflowInfo />
      <ExpenseCategories />
    </PageShell>
  );
}
