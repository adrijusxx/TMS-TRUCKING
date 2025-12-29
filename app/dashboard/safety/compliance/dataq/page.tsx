'use client';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import DataQSubmissionForm from '@/components/safety/compliance/DataQSubmissionForm';
import { useRouter } from 'next/navigation';

export default function DataQPage() {
  const router = useRouter();

  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Compliance', href: '/dashboard/safety/compliance' },
        { label: 'DataQ' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">DataQ Submissions</h1>
        </div>
        <DataQSubmissionForm
          onSuccess={() => router.push('/dashboard/safety/compliance/dataq')}
          onCancel={() => router.push('/dashboard/safety')}
        />
      </div>
    </>
  );
}

