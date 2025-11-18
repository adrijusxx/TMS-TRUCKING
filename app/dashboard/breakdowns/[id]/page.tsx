import DashboardLayout from '@/components/layout/DashboardLayout';
import BreakdownDetail from '@/components/breakdowns/BreakdownDetail';

export default async function BreakdownDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <BreakdownDetail breakdownId={id} />
    </DashboardLayout>
  );
}
