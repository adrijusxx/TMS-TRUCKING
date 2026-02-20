import IFTAReport from '@/components/accounting/IFTAReport';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function IFTAReportPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Accounting', href: '/dashboard/accounting' },
        { label: 'IFTA' }
      ]} />
      <IFTAReport />
    </>
  );
}



