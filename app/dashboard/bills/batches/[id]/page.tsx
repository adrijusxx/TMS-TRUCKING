'use client';

import React from 'react';
import VendorBillBatchDetail from '@/components/bills/VendorBillBatchDetail';

export default function VendorBillBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <VendorBillBatchDetail batchId={id} />;
}
