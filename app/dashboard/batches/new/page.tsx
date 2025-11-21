'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateBatchForm from '@/components/batches/CreateBatchForm';

export default function NewBatchPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Batch</h1>
        <p className="text-muted-foreground">
          Select invoices to group into a batch
        </p>
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
  );
}

