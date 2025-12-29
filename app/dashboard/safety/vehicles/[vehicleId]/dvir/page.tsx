'use client';

import DVIRForm from '@/components/safety/dvir/DVIRForm';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function DVIRPage({ params }: { params: Promise<{ vehicleId: string }> }) {
  const { vehicleId } = use(params);
  const router = useRouter();

  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'DVIR', href: '/dashboard/safety/dvir' },
        { label: `Vehicle ${vehicleId}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Vehicle DVIR</h1>
        </div>
        <DVIRForm
          vehicleId={vehicleId}
          driverId="" // Would come from context or props
          onSuccess={() => router.push(`/dashboard/trucks/${vehicleId}`)}
        />
      </div>
    </>
  );
}

