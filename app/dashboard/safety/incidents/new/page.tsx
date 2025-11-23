'use client';

import IncidentForm from '@/components/safety/incidents/IncidentForm';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function NewIncidentPage() {
  const router = useRouter();

  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Incidents', href: '/dashboard/safety/incidents' },
        { label: 'New Incident' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">New Incident Report</h1>
        </div>
        <IncidentForm
          onSuccess={() => router.push('/dashboard/safety/incidents')}
          onCancel={() => router.push('/dashboard/safety/incidents')}
        />
      </div>
    </>
  );
}

