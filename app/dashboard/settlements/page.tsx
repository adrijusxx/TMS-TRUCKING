import { Breadcrumb } from '@/components/ui/breadcrumb';
import SettlementListNew from '@/components/settlements/SettlementListNew';


import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

export default function SettlementsPage() {
  return (
    <SubscriptionGate module="ACCOUNTING">
      <Breadcrumb items={[{ label: 'Settlements', href: '/dashboard/settlements' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settlements</h1>
        </div>
        <SettlementListNew />
      </div>
    </SubscriptionGate>
  );
}

