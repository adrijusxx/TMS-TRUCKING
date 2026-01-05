import { Breadcrumb } from '@/components/ui/breadcrumb';
import SettlementListNew from '@/components/settlements/SettlementListNew';
import SettlementWorkflowInfo from '@/components/settlements/SettlementWorkflowInfo';

import { SubscriptionGate } from '@/components/saas/SubscriptionGate';

interface SettlementsPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function SettlementsPage({ searchParams }: SettlementsPageProps) {
  const showWorkflow = searchParams.view === 'workflow' || searchParams.guide === 'true';

  return (
    <SubscriptionGate module="ACCOUNTING">
      <Breadcrumb items={[{ label: 'Settlements', href: '/dashboard/settlements' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settlements</h1>
        </div>

        <SettlementWorkflowInfo defaultOpen={showWorkflow} />

        <SettlementListNew />
      </div>
    </SubscriptionGate>
  );
}

