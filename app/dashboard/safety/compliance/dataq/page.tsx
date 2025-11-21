'use client';

import DataQSubmissionForm from '@/components/safety/compliance/DataQSubmissionForm';
import { useRouter } from 'next/navigation';

export default function DataQPage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <DataQSubmissionForm
        onSuccess={() => router.push('/dashboard/safety/compliance/dataq')}
        onCancel={() => router.push('/dashboard/safety')}
      />
    </div>
  );
}

