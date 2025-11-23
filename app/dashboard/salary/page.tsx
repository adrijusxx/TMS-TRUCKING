import { Breadcrumb } from '@/components/ui/breadcrumb';
import SettlementList from '@/components/settlements/SettlementList';

export default function SalaryPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Salary', href: '/dashboard/salary' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Salary</h1>
        </div>
        <SettlementList />
      </div>
    </>
  );
}
