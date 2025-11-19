import EmptyMilesAnalysis from '@/components/analytics/EmptyMilesAnalysis';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function EmptyMilesPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' },
        { label: 'Empty Miles Analysis' }
      ]} />
      <EmptyMilesAnalysis />
    </>
  );
}

