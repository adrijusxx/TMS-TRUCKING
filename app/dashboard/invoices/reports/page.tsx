import InvoiceReports from '@/components/invoices/InvoiceReports';
import { PageShell } from '@/components/layout/PageShell';

export default function InvoiceReportsPage() {
  return (
    <PageShell title="Invoice Reports" description="Customer summary and invoice analytics">
      <InvoiceReports />
    </PageShell>
  );
}
