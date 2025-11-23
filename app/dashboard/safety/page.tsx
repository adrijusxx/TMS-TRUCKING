import { Breadcrumb } from '@/components/ui/breadcrumb';
import SafetyDashboard from '@/components/safety/dashboard/SafetyDashboard';

export default function SafetyPageRoute() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Safety Department', href: '/dashboard/safety' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Safety Department</h1>
        </div>
        <SafetyDashboard />
      </div>
    </>
  );
}
