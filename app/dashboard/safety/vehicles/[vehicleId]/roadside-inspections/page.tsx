'use client';

import RoadsideInspectionForm from '@/components/safety/vehicles/RoadsideInspectionForm';
import { use } from 'react';
import { useRouter } from 'next/navigation';
export default function RoadsideInspectionsPage({
  params
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = use(params);
  const router = useRouter();

  return (
    <RoadsideInspectionForm
          vehicleId={vehicleId}
          onSuccess={() => router.push(`/dashboard/trucks/${vehicleId}`)}
          onCancel={() => router.push(`/dashboard/trucks/${vehicleId}`)}
        />
  );
}

