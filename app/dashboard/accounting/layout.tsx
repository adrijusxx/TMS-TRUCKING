
import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

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
