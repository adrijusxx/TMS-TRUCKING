'use client';

import MVRManager from '@/components/safety/drivers/MVRManager';
import { use } from 'react';

export default function MVRPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = use(params);
  
  return (
    <div className="p-6">
      <MVRManager driverId={driverId} />
    </div>
  );
}

