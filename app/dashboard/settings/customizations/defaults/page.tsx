'use client';

import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
export default function DefaultsPage() {
  return (
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
  );
}
