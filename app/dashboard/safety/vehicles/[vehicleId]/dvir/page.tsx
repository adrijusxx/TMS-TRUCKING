'use client';

import DVIRForm from '@/components/safety/dvir/DVIRForm';
import { use } from 'react';
import { useRouter } from 'next/navigation';

export default function DVIRPage({ params }: { params: Promise<{ vehicleId: string }> }) {
  const { vehicleId } = use(params);
  const router = useRouter();

  return (
    <div className="p-6">
      <DVIRForm
        vehicleId={vehicleId}
        driverId="" // Would come from context or props
        onSuccess={() => router.push(`/dashboard/trucks/${vehicleId}`)}
      />
    </div>
  );
}

