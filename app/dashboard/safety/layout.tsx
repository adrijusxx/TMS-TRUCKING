
import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

export default function SafetyLayout({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionGate module="SAFETY">
      {children}
    </SubscriptionGate>
  );
}
