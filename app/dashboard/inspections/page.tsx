import { Breadcrumb } from '@/components/ui/breadcrumb';
import InspectionList from '@/components/inspections/InspectionList';

export default function InspectionsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Inspections', href: '/dashboard/inspections' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Inspections</h1>
        </div>
        <InspectionList />
      </div>
    </>
  );
}
