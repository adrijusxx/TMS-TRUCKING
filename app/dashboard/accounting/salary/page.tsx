import SalaryModuleLayout from '@/components/salary/SalaryModuleLayout';
import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

export default async function SalaryPage() {
  return (
    <SubscriptionGate module="ACCOUNTING">
      <SalaryModuleLayout />
    </SubscriptionGate>
  );
}
