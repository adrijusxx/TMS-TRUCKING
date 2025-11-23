import GenerateInvoiceForm from '@/components/invoices/GenerateInvoiceForm';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function GenerateInvoicePage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Invoices', href: '/dashboard/invoices' },
        { label: 'Generate Invoice' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Generate Invoice</h1>
        </div>
        <GenerateInvoiceForm />
      </div>
    </>
  );
}

