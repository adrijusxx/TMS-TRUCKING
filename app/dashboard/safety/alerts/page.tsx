import { Breadcrumb } from '@/components/ui/breadcrumb';
import AlertCenter from '@/components/safety/alerts/AlertCenter';

export default function AlertsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Alerts' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Safety Alerts</h1>
        </div>
        <AlertCenter />
      </div>
    </>
  );
}

