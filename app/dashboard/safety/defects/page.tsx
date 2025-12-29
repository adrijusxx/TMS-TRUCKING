import { Breadcrumb } from '@/components/ui/breadcrumb';
import DefectDashboard from '@/components/safety/defects/DefectDashboard';

export default function DefectsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Defects' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Defects</h1>
        </div>
        <DefectDashboard />
      </div>
    </>
  );
}

