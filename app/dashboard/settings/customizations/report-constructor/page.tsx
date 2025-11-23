'use client';

import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function ReportConstructorPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Settings', href: '/dashboard/settings' },
        { label: 'Customizations', href: '/dashboard/settings' },
        { label: 'Report Constructor' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Report Constructor Settings</h1>
        </div>
      <GenericCRUDManager
        endpoint="/api/report-constructors"
        queryKey="report-constructors"
        title="Report Constructors"
        description="Build and manage custom reports"
        searchable={true}
        fields={[
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'entityType', label: 'Entity Type', type: 'select', required: true, options: [
            { value: 'LOAD', label: 'Load' },
            { value: 'DRIVER', label: 'Driver' },
            { value: 'TRUCK', label: 'Truck' },
            { value: 'INVOICE', label: 'Invoice' },
            { value: 'CUSTOMER', label: 'Customer' },
          ]},
          { name: 'format', label: 'Format', type: 'select', options: [
            { value: 'PDF', label: 'PDF' },
            { value: 'EXCEL', label: 'Excel' },
            { value: 'CSV', label: 'CSV' },
            { value: 'HTML', label: 'HTML' },
          ]},
          { name: 'description', label: 'Description', type: 'textarea' },
        ]}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'entityType', label: 'Entity Type' },
          { key: 'format', label: 'Format' },
          { key: 'description', label: 'Description' },
        ]}
      />
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Full drag-and-drop report builder interface coming soon. 
          For now, you can create basic report configurations here.
        </p>
      </div>
      </div>
    </>
  );
}
