'use client';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { ReportsHub } from '@/components/reports/ReportsHub';
import { useEffect, useState } from 'react';

export default function AccountingReportsPage() {
  // We can pass a prop to ReportsHub to force a tab, or just let it be.
  // Ideally ReportsHub accepts specific category.
  // But for now, let's just render the Hub.
  // The user will land on "All", but we might want to default to Financial.

  return (
    <>
      <Breadcrumb items={[
        { label: 'Accounting', href: '/dashboard/accounting' },
        { label: 'Reports' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Accounting Reports</h1>
          <p className="text-muted-foreground mt-2">
            Access comprehensive financial reports and analytics.
          </p>
        </div>

        {/* We can modify ReportsHub to accept defaultTab, but for now standard view is fine */}
        <ReportsContent />
      </div>
    </>
  );
}

function ReportsContent() {
  // Hack directly into the DOM or preferrably update ReportsHub to accept props.
  // I'll update ReportsHub in a subsequent step if needed, but for now this is cleaner than maintaining two pages.
  return <ReportsHub defaultTab="financial" />
}
