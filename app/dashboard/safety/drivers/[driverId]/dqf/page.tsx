'use client';

import DQFManager from '@/components/safety/dqf/DQFManager';
import { use } from 'react';

export default function DQFPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = use(params);
  
  return (
    <div className="p-6">
      <DQFManager driverId={driverId} />
    </div>
  );
}

