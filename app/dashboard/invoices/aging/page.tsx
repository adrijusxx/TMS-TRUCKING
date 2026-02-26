import AgingReport from '@/components/invoices/AgingReport';
import { PageShell } from '@/components/layout/PageShell';

export default function AgingReportPage() {
  return (
    <PageShell title="Aging Report" description="Track outstanding invoices by age">
      <AgingReport />
    </PageShell>
  );
}
