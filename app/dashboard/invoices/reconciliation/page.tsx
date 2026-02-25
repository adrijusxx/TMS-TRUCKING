import ReconciliationTab from '@/components/invoices/ReconciliationTab';
import { PageShell } from '@/components/layout/PageShell';

export default function ReconciliationPage() {
  return (
    <PageShell title="Reconciliation" description="Match invoice payments with bank records">
      <ReconciliationTab />
    </PageShell>
  );
}
