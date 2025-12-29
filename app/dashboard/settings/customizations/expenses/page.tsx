import ExpenseCategories from '@/components/settings/customizations/ExpenseCategories';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function ExpensesPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Settings', href: '/dashboard/settings' },
        { label: 'Customizations', href: '/dashboard/settings' },
        { label: 'Expenses' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Expense Categories</h1>
        </div>
        <ExpenseCategories />
      </div>
    </>
  );
}
