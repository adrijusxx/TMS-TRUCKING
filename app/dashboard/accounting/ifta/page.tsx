import IFTAReport from '@/components/accounting/IFTAReport';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function IFTAReportPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Accounting', href: '/dashboard/accounting' },
        { label: 'IFTA' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">IFTA Report</h1>
        </div>
        <IFTAReport />
      </div>
    </>
  );
}



