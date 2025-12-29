'use client';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';

export default function WorkOrdersPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Work Orders' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Work Orders & Safety</h1>
        </div>
      <div className="space-y-8">
        <GenericCRUDManager
          endpoint="/api/work-order-types"
          queryKey="work-order-types"
          title="Work Order Types"
          description="Manage work order types and categories"
          searchable={true}
          fields={[
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'code', label: 'Code', type: 'text' },
            { name: 'category', label: 'Category', type: 'select', options: [
              { value: 'MAINTENANCE', label: 'Maintenance' },
              { value: 'REPAIR', label: 'Repair' },
              { value: 'INSPECTION', label: 'Inspection' },
              { value: 'OTHER', label: 'Other' },
            ]},
            { name: 'defaultPriority', label: 'Default Priority', type: 'select', options: [
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'CRITICAL', label: 'Critical' },
            ]},
            { name: 'estimatedHours', label: 'Estimated Hours', type: 'number' },
            { name: 'description', label: 'Description', type: 'textarea' },
          ]}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            { key: 'defaultPriority', label: 'Priority' },
            { key: 'estimatedHours', label: 'Est. Hours' },
          ]}
        />
        <GenericCRUDManager
          endpoint="/api/safety-configurations"
          queryKey="safety-configurations"
          title="Safety Configurations"
          description="Manage safety configurations"
          searchable={true}
          fields={[
            { name: 'category', label: 'Category', type: 'select', required: true, options: [
              { value: 'TRAINING', label: 'Training' },
              { value: 'COMPLIANCE', label: 'Compliance' },
              { value: 'INCIDENT', label: 'Incident' },
              { value: 'INSPECTION', label: 'Inspection' },
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
      </div>
    </>
  );
}

