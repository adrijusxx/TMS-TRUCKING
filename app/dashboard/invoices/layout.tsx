import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

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
