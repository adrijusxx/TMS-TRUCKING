import { Breadcrumb } from '@/components/ui/breadcrumb';
import InvoiceListNew from '@/components/invoices/InvoiceListNew';

export default function BillsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Bills', href: '/dashboard/bills' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bills</h1>
        </div>
        <InvoiceListNew />
      </div>
    </>
  );
}
