import { Breadcrumb } from '@/components/ui/breadcrumb';
import { AccountingDashboard } from '@/components/accounting/AccountingDashboard';

export default function AccountingDashboardPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Accounting' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Accounting</h1>
        <p className="text-muted-foreground">
          Financial overview, receivables, payables, and action items.
        </p>
      </div>
      <AccountingDashboard />
    </div>
  );
}
