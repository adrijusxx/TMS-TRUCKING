import DashboardLayout from '@/components/layout/DashboardLayout';
import BreakdownDetailEnhanced from '@/components/fleet/BreakdownDetailEnhanced';

export default async function BreakdownDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <BreakdownDetailEnhanced breakdownId={id} />
    </DashboardLayout>
  );
}
