'use client';

import CDLManager from '@/components/safety/drivers/CDLManager';
import { use } from 'react';

export default function CDLPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = use(params);
  
  return (
    <div className="p-6">
      <CDLManager driverId={driverId} />
    </div>
  );
}

