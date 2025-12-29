'use client';

import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function DefaultsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Settings', href: '/dashboard/settings' },
        { label: 'Customizations', href: '/dashboard/settings' },
        { label: 'Defaults' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Default Configurations</h1>
        </div>
      <GenericCRUDManager
        endpoint="/api/default-configurations"
        queryKey="default-configurations"
        title="Default Configurations"
        description="Manage default system configurations"
        searchable={true}
        fields={[
          { name: 'category', label: 'Category', type: 'select', required: true, options: [
            { value: 'LOAD', label: 'Load' },
            { value: 'DRIVER', label: 'Driver' },
            { value: 'INVOICE', label: 'Invoice' },
            { value: 'CUSTOMER', label: 'Customer' },
            { value: 'TRUCK', label: 'Truck' },
            { value: 'TRAILER', label: 'Trailer' },
          ]},
          { name: 'key', label: 'Key', type: 'text', required: true },
          { name: 'value', label: 'Value', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea' },
        ]}
        columns={[
          { key: 'category', label: 'Category' },
          { key: 'key', label: 'Key' },
          { key: 'value', label: 'Value' },
          { key: 'description', label: 'Description' },
        ]}
      />
      </div>
    </>
  );
}
