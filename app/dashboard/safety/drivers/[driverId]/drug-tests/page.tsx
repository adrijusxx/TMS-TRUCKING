'use client';

import DrugTestManager from '@/components/safety/drivers/DrugTestManager';
import { use } from 'react';

export default function DrugTestsPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = use(params);
  
  return (
    <div className="p-6">
      <DrugTestManager driverId={driverId} />
    </div>
  );
}

