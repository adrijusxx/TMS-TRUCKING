'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DriverExpandedEdit from '@/components/drivers/DriverExpandedEdit';

const TAB_ALIASES: Record<string, string> = {
  deductions: 'payroll',
  financial: 'payroll',
};

export default function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab') || 'personal';
  const initialTab = TAB_ALIASES[rawTab] || rawTab;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <Link href="/dashboard/drivers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drivers
          </Button>
        </Link>
      </div>
      <DriverExpandedEdit driverId={id} initialTab={initialTab} />
    </div>
  );
}
