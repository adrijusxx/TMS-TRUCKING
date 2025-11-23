'use client';

import CDLManager from '@/components/safety/drivers/CDLManager';
import { use } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function CDLPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = use(params);
  
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'CDL Records', href: '/dashboard/safety/cdl' },
        { label: `Driver ${driverId}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Driver CDL Records</h1>
        </div>
        <CDLManager driverId={driverId} />
      </div>
    </>
  );
}

