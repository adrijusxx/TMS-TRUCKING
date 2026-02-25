import SalaryModuleLayout from '@/components/salary/SalaryModuleLayout';
import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

export default async function SettlementsPage() {
  return (
    <SubscriptionGate module="ACCOUNTING">
      <SalaryModuleLayout />
    </SubscriptionGate>
  );
}
