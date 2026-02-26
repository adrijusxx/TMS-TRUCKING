import GenerateInvoiceForm from '@/components/invoices/GenerateInvoiceForm';
import { PageShell } from '@/components/layout/PageShell';

export default function GenerateInvoicePage() {
  return (
    <PageShell title="Generate Invoice" description="Create invoices from delivered loads">
      <GenerateInvoiceForm />
    </PageShell>
  );
}
