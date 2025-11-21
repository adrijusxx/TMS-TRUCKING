'use client';

import HOSDashboard from '@/components/safety/drivers/HOSDashboard';
import { use } from 'react';

export default function HOSPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = use(params);
  
  return (
    <div className="p-6">
      <HOSDashboard driverId={driverId} />
    </div>
  );
}

