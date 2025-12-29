import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

// Invoices layout - uses AccountingNav sidebar component
// This prevents duplication with the AccountingNav sidebar
export default function InvoicesLayout({
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
