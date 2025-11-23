import BreakdownDetailEnhanced from '@/components/fleet/BreakdownDetailEnhanced';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default async function BreakdownDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Breadcrumb items={[
        { label: 'Breakdowns', href: '/dashboard/breakdowns' },
        { label: `Breakdown #${id.slice(0, 8)}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Breakdown Details</h1>
        </div>
        <BreakdownDetailEnhanced breakdownId={id} />
      </div>
    </>
  );
}
