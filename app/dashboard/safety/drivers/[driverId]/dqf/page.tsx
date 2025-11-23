'use client';

import DQFManager from '@/components/safety/dqf/DQFManager';
import { use } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function DQFPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = use(params);
  
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'DQF Management', href: '/dashboard/safety/dqf' },
        { label: `Driver ${driverId}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Driver Qualification File</h1>
        </div>
        <DQFManager driverId={driverId} />
      </div>
    </>
  );
}

