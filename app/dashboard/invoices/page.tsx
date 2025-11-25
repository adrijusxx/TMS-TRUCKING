'use client';

import InvoiceListNew from '@/components/invoices/InvoiceListNew';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function InvoicesPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Invoices', href: '/dashboard/invoices' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
        </div>
        <InvoiceListNew />
      </div>
    </>
  );
}

