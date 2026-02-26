'use client';

import React from 'react';
import SalaryBatchDetail from '@/components/salary/SalaryBatchDetail';

export default function SalaryBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <SalaryBatchDetail batchId={id} />;
}
