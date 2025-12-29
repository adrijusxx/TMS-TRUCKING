
import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

// Accounting layout - uses AccountingNav sidebar component
// This ensures all accounting pages (batches, invoices, etc.) show the sidebar navigation
export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionGate module="ACCOUNTING">
      {children}
    </SubscriptionGate>
  );
}
