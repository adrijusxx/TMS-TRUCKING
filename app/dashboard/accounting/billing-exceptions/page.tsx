import { BillingExceptionsQueue } from '@/components/accounting/BillingExceptionsQueue';
import { PageShell } from '@/components/layout/PageShell';

export default function BillingExceptionsPage() {
  return (
    <PageShell title="Billing Exceptions" description="Review and resolve billing issues before invoicing">
      <BillingExceptionsQueue />
    </PageShell>
  );
}
