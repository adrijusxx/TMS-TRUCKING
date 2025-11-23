'use client';

import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Wrench } from 'lucide-react';

export default function ReportsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Reports', href: '/dashboard/reports' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
        </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Templates
            </CardTitle>
            <CardDescription>
              Customize report templates and formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/reports/templates">
              <Button>Manage Templates</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Report Constructor
            </CardTitle>
            <CardDescription>
              Build custom reports with drag-and-drop interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/reports/constructor">
              <Button>Open Constructor</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}

