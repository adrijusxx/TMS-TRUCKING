import IFTAReport from '@/components/accounting/IFTAReport';
import { PageShell } from '@/components/layout/PageShell';

export default function IFTAReportPage() {
  return (
    <PageShell title="IFTA Report" description="International Fuel Tax Agreement reporting and compliance">
      <IFTAReport />
    </PageShell>
  );
}
