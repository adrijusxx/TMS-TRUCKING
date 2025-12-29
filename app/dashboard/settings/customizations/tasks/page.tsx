'use client';

import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const fields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'status', label: 'Status', type: 'select' as const, options: [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ]},
  { name: 'priority', label: 'Priority', type: 'select' as const, options: [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' },
  ]},
  { name: 'description', label: 'Description', type: 'textarea' as const },
];

const columns = [
  { key: 'name', label: 'Name' },
  { 
    key: 'status', 
    label: 'Status',
    render: (val: any) => <Badge>{val || 'Active'}</Badge>
  },
  { 
    key: 'priority', 
    label: 'Priority',
    render: (val: any) => <Badge variant="outline">{val || 'Medium'}</Badge>
  },
];

export default function TasksPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Settings', href: '/dashboard/settings' },
        { label: 'Customizations', href: '/dashboard/settings' },
        { label: 'Tasks' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Task Management Projects</h1>
        </div>
      <div className="space-y-8">
        <GenericCRUDManager
          endpoint="/api/projects"
          queryKey="projects"
          title="Projects"
          description="Manage projects"
          searchable={true}
          fields={fields}
          columns={columns}
        />
      </div>
      </div>
    </>
  );
}
