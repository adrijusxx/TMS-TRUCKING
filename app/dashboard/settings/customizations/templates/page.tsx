'use client';

import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'type', label: 'Type', type: 'select' as const, required: true, options: [
    { value: 'INVOICE', label: 'Invoice' },
    { value: 'BOL', label: 'Bill of Lading' },
    { value: 'SETTLEMENT', label: 'Settlement' },
    { value: 'QUOTE', label: 'Quote' },
    { value: 'LOAD_CONFIRMATION', label: 'Load Confirmation' },
    { value: 'OTHER', label: 'Other' },
  ]},
  { name: 'description', label: 'Description', type: 'textarea' as const },
  { name: 'content', label: 'Template Content', type: 'textarea' as const, required: true },
];

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { 
    key: 'isDefault', 
    label: 'Status',
    render: (val: any) => val ? <Badge>Default</Badge> : <Badge variant="secondary">Active</Badge>
  },
];

export default function TemplatesPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Settings', href: '/dashboard/settings' },
        { label: 'Customizations', href: '/dashboard/settings' },
        { label: 'Templates' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
        </div>
      <GenericCRUDManager
        endpoint="/api/document-templates"
        queryKey="document-templates"
        title="Document Templates"
        description="Manage document and form templates"
        searchable={true}
        fields={fields}
        columns={columns}
      />
      </div>
    </>
  );
}
