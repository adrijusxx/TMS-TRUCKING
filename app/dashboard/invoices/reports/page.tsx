import InvoiceReports from '@/components/invoices/InvoiceReports';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function InvoiceReportsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Invoices', href: '/dashboard/invoices' },
        { label: 'Reports' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Invoice Reports</h1>
        </div>
        <InvoiceReports />
      </div>
    </>
  );
}

