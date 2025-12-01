import { Breadcrumb } from '@/components/ui/breadcrumb';
import BreakdownList from '@/components/breakdowns/BreakdownList';

export default function BreakdownsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Breakdowns', href: '/dashboard/breakdowns' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Breakdowns</h1>
        </div>
        <BreakdownList />
      </div>
    </>
  );
}
