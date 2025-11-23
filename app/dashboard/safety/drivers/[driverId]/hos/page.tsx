'use client';

import HOSDashboard from '@/components/safety/drivers/HOSDashboard';
import { use } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function HOSPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = use(params);
  
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'HOS Monitoring', href: '/dashboard/safety/hos' },
        { label: `Driver ${driverId}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Driver Hours of Service</h1>
        </div>
        <HOSDashboard driverId={driverId} />
      </div>
    </>
  );
}

