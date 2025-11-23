import EmptyMilesAnalysis from '@/components/analytics/EmptyMilesAnalysis';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function EmptyMilesPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' },
        { label: 'Empty Miles Analysis' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Empty Miles Analysis</h1>
        </div>
        <EmptyMilesAnalysis />
      </div>
    </>
  );
}

