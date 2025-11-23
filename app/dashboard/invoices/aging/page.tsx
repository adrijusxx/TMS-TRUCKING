import AgingReport from '@/components/invoices/AgingReport';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function AgingReportPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Invoices', href: '/dashboard/invoices' },
        { label: 'Aging Report' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Invoice Aging Report</h1>
        </div>
        <AgingReport />
      </div>
    </>
  );
}

