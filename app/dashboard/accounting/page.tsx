import { AccountingDashboard } from '@/components/accounting/AccountingDashboard';
import { PageShell } from '@/components/layout/PageShell';

export default function AccountingDashboardPage() {
  return (
    <PageShell title="Accounting" description="Financial overview and key metrics">
      <AccountingDashboard />
    </PageShell>
  );
}
