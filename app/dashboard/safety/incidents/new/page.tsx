'use client';

import IncidentForm from '@/components/safety/incidents/IncidentForm';
import { useRouter } from 'next/navigation';

export default function NewIncidentPage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <IncidentForm
        onSuccess={() => router.push('/dashboard/safety/incidents')}
        onCancel={() => router.push('/dashboard/safety/incidents')}
      />
    </div>
  );
}

