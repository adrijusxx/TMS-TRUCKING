'use client';

import DrugTestManager from '@/components/safety/drivers/DrugTestManager';
import { use } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function DrugTestsPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = use(params);
  
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Drug & Alcohol Tests', href: '/dashboard/safety/drug-tests' },
        { label: `Driver ${driverId}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Driver Drug & Alcohol Tests</h1>
        </div>
        <DrugTestManager driverId={driverId} />
      </div>
    </>
  );
}

