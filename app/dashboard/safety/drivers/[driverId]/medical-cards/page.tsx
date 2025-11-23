'use client';

import MedicalCardManager from '@/components/safety/drivers/MedicalCardManager';
import { use } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function MedicalCardsPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = use(params);
  
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Medical Cards', href: '/dashboard/safety/medical-cards' },
        { label: `Driver ${driverId}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Driver Medical Cards</h1>
        </div>
        <MedicalCardManager driverId={driverId} />
      </div>
    </>
  );
}

