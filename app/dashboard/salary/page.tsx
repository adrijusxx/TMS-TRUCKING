import { Breadcrumb } from '@/components/ui/breadcrumb';
import SalaryModuleLayout from '@/components/salary/SalaryModuleLayout';
import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

export default function SalaryPage() {
  return (
    <SubscriptionGate module="ACCOUNTING">
      <Breadcrumb items={[
        { label: 'Accounting', href: '/dashboard/accounting' },
        { label: 'Salary', href: '/dashboard/salary' }
      ]} />
      <SalaryModuleLayout />
    </SubscriptionGate>
  );
}
