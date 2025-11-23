'use client';

import AnnualReviewForm from '@/components/safety/drivers/AnnualReviewForm';
import { use } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function AnnualReviewPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = use(params);
  
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Annual Reviews', href: '/dashboard/safety/annual-reviews' },
        { label: `Driver ${driverId}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Driver Annual Review</h1>
        </div>
        <AnnualReviewForm driverId={driverId} />
      </div>
    </>
  );
}

