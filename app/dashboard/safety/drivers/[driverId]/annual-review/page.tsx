'use client';

import AnnualReviewForm from '@/components/safety/drivers/AnnualReviewForm';
import { use } from 'react';

export default function AnnualReviewPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = use(params);
  
  return (
    <div className="p-6">
      <AnnualReviewForm driverId={driverId} />
    </div>
  );
}

