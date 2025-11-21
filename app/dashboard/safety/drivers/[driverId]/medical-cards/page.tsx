'use client';

import MedicalCardManager from '@/components/safety/drivers/MedicalCardManager';
import { use } from 'react';

export default function MedicalCardsPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = use(params);
  
  return (
    <div className="p-6">
      <MedicalCardManager driverId={driverId} />
    </div>
  );
}

