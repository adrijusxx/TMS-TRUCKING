'use client';

import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'code', label: 'Code', type: 'text' as const },
  { name: 'type', label: 'Type', type: 'select' as const, required: true, options: [
    { value: 'RATE_PER_MILE', label: 'Rate Per Mile' },
    { value: 'RATE_PER_LOAD', label: 'Rate Per Load' },
    { value: 'RATE_PER_POUND', label: 'Rate Per Pound' },
    { value: 'FLAT_RATE', label: 'Flat Rate' },
    { value: 'PERCENTAGE', label: 'Percentage' },
    { value: 'FUEL_SURCHARGE', label: 'Fuel Surcharge' },
  ]},
  { name: 'rate', label: 'Rate', type: 'number' as const, required: true },
  { name: 'minimumRate', label: 'Minimum Rate', type: 'number' as const },
  { name: 'description', label: 'Description', type: 'textarea' as const },
];

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'type', label: 'Type' },
  { 
    key: 'rate', 
    label: 'Rate', 
    render: (val: any) => val ? `$${Number(val).toFixed(2)}` : '-' 
  },
  { 
    key: 'isDefault', 
    label: 'Status',
    render: (val: any) => val ? <Badge>Default</Badge> : <Badge variant="secondary">Active</Badge>
  },
];

export default function TariffsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Settings', href: '/dashboard/settings' },
        { label: 'Customizations', href: '/dashboard/settings' },
        { label: 'Tariffs' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tariff Configuration</h1>
        </div>
      <GenericCRUDManager
        endpoint="/api/tariffs"
        queryKey="tariffs"
        title="Tariffs"
        description="Manage tariffs and payment configurations"
        searchable={true}
        fields={fields}
        columns={columns}
      />
      </div>
    </>
  );
}
