import ExpenseCategories from '@/components/settings/customizations/ExpenseCategories';

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Expenses</h1>
        <p className="text-muted-foreground">
          Manage expense categories and types
        </p>
      </div>
      <ExpenseCategories />
    </div>
  );
}
