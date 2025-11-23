'use client';

import MVRManager from '@/components/safety/drivers/MVRManager';
import { use } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function MVRPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = use(params);
  
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'MVR Tracking', href: '/dashboard/safety/mvr' },
        { label: `Driver ${driverId}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Driver Motor Vehicle Record</h1>
        </div>
        <MVRManager driverId={driverId} />
      </div>
    </>
  );
}

