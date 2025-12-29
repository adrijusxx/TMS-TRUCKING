'use client';

import RoadsideInspectionForm from '@/components/safety/vehicles/RoadsideInspectionForm';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function RoadsideInspectionsPage({
  params
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = use(params);
  const router = useRouter();

  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Roadside Inspections', href: '/dashboard/safety/roadside-inspections' },
        { label: `Vehicle ${vehicleId}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Roadside Inspection</h1>
        </div>
        <RoadsideInspectionForm
          vehicleId={vehicleId}
          onSuccess={() => router.push(`/dashboard/trucks/${vehicleId}`)}
          onCancel={() => router.push(`/dashboard/trucks/${vehicleId}`)}
        />
      </div>
    </>
  );
}

