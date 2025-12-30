'use client';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { ReportsHub } from '@/components/reports/ReportsHub';

export default function ReportsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Reports', href: '/dashboard/reports' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report Center</h1>
          <p className="text-muted-foreground mt-2">
            Access financial, operational, and safety reports across your organization.
          </p>
        </div>

        <ReportsHub />
      </div>
    </>
  );
}
