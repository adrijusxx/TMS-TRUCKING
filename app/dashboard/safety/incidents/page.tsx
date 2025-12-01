import { Breadcrumb } from '@/components/ui/breadcrumb';
import { IncidentsTableClient } from './IncidentsTableClient';

export default function IncidentsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Incidents' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Safety Incidents</h1>
        </div>
        <IncidentsTableClient />
      </div>
    </>
  );
}

