import ExpenseCategories from '@/components/settings/customizations/ExpenseCategories';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function ExpensesPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Accounting', href: '/dashboard/accounting' },
        { label: 'Expenses' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Accounting Expenses</h1>
        </div>
        <ExpenseCategories />
      </div>
    </>
  );
}

