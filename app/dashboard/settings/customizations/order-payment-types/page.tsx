'use client';

import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'code', label: 'Code', type: 'text' as const },
  { name: 'terms', label: 'Payment Terms (days)', type: 'number' as const },
  { name: 'description', label: 'Description', type: 'textarea' as const },
];

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { 
    key: 'terms', 
    label: 'Terms (days)', 
    render: (val: any) => val ? `${val} days` : '-' 
  },
  { 
    key: 'requiresPO', 
    label: 'Requires PO',
    render: (val: any) => val ? <Badge>Yes</Badge> : <Badge variant="secondary">No</Badge>
  },
  { 
    key: 'isDefault', 
    label: 'Status',
    render: (val: any) => val ? <Badge>Default</Badge> : <Badge variant="secondary">Active</Badge>
  },
];

export default function OrderPaymentTypesPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Settings', href: '/dashboard/settings' },
        { label: 'Customizations', href: '/dashboard/settings' },
        { label: 'Order Payment Types' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Type Configuration</h1>
        </div>
      <GenericCRUDManager
        endpoint="/api/order-payment-types"
        queryKey="order-payment-types"
        title="Order Payment Types"
        description="Manage payment types for orders"
        searchable={true}
        fields={fields}
        columns={columns}
      />
      </div>
    </>
  );
}
