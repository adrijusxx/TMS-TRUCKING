import InvoiceList from '@/components/invoices/InvoiceList';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function InvoicesPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Invoices', href: '/dashboard/invoices' }]} />
      <InvoiceList />
    </>
  );
}

