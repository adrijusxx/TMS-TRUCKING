'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateBatchForm from '@/components/batches/CreateBatchForm';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function NewBatchPage() {
  const router = useRouter();

  return (
    <>
      <Breadcrumb items={[
        { label: 'Accounting', href: '/dashboard/accounting' },
        { label: 'Batches', href: '/dashboard/accounting/batches' },
        { label: 'New Batch' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Accounting Batch</h1>
        </div>
      <CreateBatchForm
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            // Navigate back to batches list when dialog closes
            router.push('/dashboard/accounting/batches');
          }
        }}
      />
      </div>
    </>
  );
}

