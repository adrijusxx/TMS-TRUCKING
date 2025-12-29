'use client';

import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'type', label: 'Type', type: 'select' as const, required: true, options: [
    { value: 'EQUIPMENT', label: 'Equipment' },
    { value: 'COMMODITY', label: 'Commodity' },
    { value: 'SERVICE_TYPE', label: 'Service Type' },
    { value: 'CUSTOMER_SEGMENT', label: 'Customer Segment' },
    { value: 'COST_CENTER', label: 'Cost Center' },
    { value: 'CUSTOM', label: 'Custom' },
  ]},
  { name: 'code', label: 'Code', type: 'text' as const },
  { name: 'order', label: 'Order', type: 'number' as const },
  { name: 'description', label: 'Description', type: 'textarea' as const },
];

const columns = [
  { key: 'name', label: 'Name' },
  { 
    key: 'type', 
    label: 'Type',
    render: (val: any) => <Badge variant="outline">{val}</Badge>
  },
  { key: 'code', label: 'Code' },
  { key: 'order', label: 'Order' },
  { key: 'description', label: 'Description' },
];

export default function ClassificationsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Settings', href: '/dashboard/settings' },
        { label: 'Customizations', href: '/dashboard/settings' },
        { label: 'Classifications' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Classifications</h1>
        </div>
      <GenericCRUDManager
        endpoint="/api/classifications"
        queryKey="classifications"
        title="Classifications"
        description="Manage classification categories and hierarchies"
        searchable={true}
        fields={fields}
        columns={columns}
      />
      </div>
    </>
  );
}
