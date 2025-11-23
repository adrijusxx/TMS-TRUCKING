import { Breadcrumb } from '@/components/ui/breadcrumb';
import SettlementList from '@/components/settlements/SettlementList';

export default function SettlementsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Settlements', href: '/dashboard/settlements' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settlements</h1>
        </div>
        <SettlementList />
      </div>
    </>
  );
}

