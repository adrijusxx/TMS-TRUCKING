'use client';

import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'type', label: 'Report Type', type: 'select' as const, required: true, options: [
    { value: 'LOADS', label: 'Loads' },
    { value: 'DRIVERS', label: 'Drivers' },
    { value: 'FINANCIAL', label: 'Financial' },
    { value: 'SAFETY', label: 'Safety' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'CUSTOM', label: 'Custom' },
  ]},
  { name: 'format', label: 'Format', type: 'select' as const, options: [
    { value: 'PDF', label: 'PDF' },
    { value: 'EXCEL', label: 'Excel' },
    { value: 'CSV', label: 'CSV' },
    { value: 'HTML', label: 'HTML' },
  ]},
  { name: 'description', label: 'Description', type: 'textarea' as const },
];

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'format', label: 'Format' },
  { 
    key: 'isDefault', 
    label: 'Status',
    render: (val: any) => val ? <Badge>Default</Badge> : <Badge variant="secondary">Active</Badge>
  },
];

export default function ReportTemplatesPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Reports', href: '/dashboard/reports' },
        { label: 'Templates' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Report Templates</h1>
        </div>
      <GenericCRUDManager
        endpoint="/api/report-templates"
        queryKey="report-templates"
        title="Report Templates"
        description="Manage report templates and formats"
        searchable={true}
        fields={fields}
        columns={columns}
      />
      </div>
    </>
  );
}

