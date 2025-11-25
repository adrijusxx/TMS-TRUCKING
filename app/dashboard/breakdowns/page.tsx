import { Breadcrumb } from '@/components/ui/breadcrumb';
import BreakdownListNew from '@/components/breakdowns/BreakdownListNew';

export default function BreakdownsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Breakdowns', href: '/dashboard/breakdowns' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Breakdowns</h1>
        </div>
        <BreakdownListNew />
      </div>
    </>
  );
}
