import { Breadcrumb } from '@/components/ui/breadcrumb';
import { RoadsideInspectionsTableClient } from './RoadsideInspectionsTableClient';

export default function RoadsideInspectionsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Roadside Inspections' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Roadside Inspections</h1>
        </div>
        <RoadsideInspectionsTableClient />
      </div>
    </>
  );
}

