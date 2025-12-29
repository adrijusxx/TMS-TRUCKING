'use client';

import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'entityType', label: 'Entity Type', type: 'select' as const, required: true, options: [
    { value: 'LOAD', label: 'Load' },
    { value: 'DRIVER', label: 'Driver' },
    { value: 'TRUCK', label: 'Truck' },
    { value: 'TRAILER', label: 'Trailer' },
    { value: 'INVOICE', label: 'Invoice' },
    { value: 'CUSTOMER', label: 'Customer' },
    { value: 'VENDOR', label: 'Vendor' },
    { value: 'SETTLEMENT', label: 'Settlement' },
    { value: 'BREAKDOWN', label: 'Breakdown' },
    { value: 'INSPECTION', label: 'Inspection' },
    { value: 'SAFETY_INCIDENT', label: 'Safety Incident' },
  ]},
  { name: 'code', label: 'Code', type: 'text' as const },
  { name: 'color', label: 'Color', type: 'text' as const },
  { name: 'order', label: 'Order', type: 'number' as const },
  { name: 'description', label: 'Description', type: 'textarea' as const },
];

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'entityType', label: 'Entity Type' },
  { key: 'code', label: 'Code' },
  { 
    key: 'color', 
    label: 'Color',
    render: (val: any) => val ? (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: val }} />
        <span className="text-sm">{val}</span>
      </div>
    ) : '-'
  },
  { key: 'order', label: 'Order' },
  { 
    key: 'isDefault', 
    label: 'Status',
    render: (val: any) => val ? <Badge>Default</Badge> : <Badge variant="secondary">Active</Badge>
  },
];

export default function StatusesPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Settings', href: '/dashboard/settings' },
        { label: 'Customizations', href: '/dashboard/settings' },
        { label: 'Statuses' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dynamic Statuses</h1>
        </div>
      <GenericCRUDManager
        endpoint="/api/dynamic-statuses"
        queryKey="dynamic-statuses"
        title="Dynamic Statuses"
        description="Manage status types for loads, drivers, trucks, and more"
        searchable={true}
        fields={fields}
        columns={columns}
      />
      </div>
    </>
  );
}
