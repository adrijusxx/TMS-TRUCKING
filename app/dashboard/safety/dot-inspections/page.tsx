import { Breadcrumb } from '@/components/ui/breadcrumb';
import { DOTInspectionsTableClient } from './DOTInspectionsTableClient';

export default function DOTInspectionsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'DOT Inspections' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">DOT Inspections</h1>
        </div>
        <DOTInspectionsTableClient />
      </div>
    </>
  );
}



