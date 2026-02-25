'use client';

import { Badge } from '@/components/ui/badge';

/** Shared field/column configs for customization CRUD managers */

export const classificationsConfig = {
  endpoint: '/api/classifications',
  queryKey: 'classifications',
  title: 'Classifications',
  description: 'Manage classification categories and hierarchies',
  fields: [
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
  ],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (val: any) => <Badge variant="outline">{val}</Badge> },
    { key: 'code', label: 'Code' },
    { key: 'order', label: 'Order' },
    { key: 'description', label: 'Description' },
  ],
};

export const templatesConfig = {
  endpoint: '/api/document-templates',
  queryKey: 'document-templates',
  title: 'Document Templates',
  description: 'Manage document and form templates',
  fields: [
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
  ],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'isDefault', label: 'Status', render: (val: any) => val ? <Badge>Default</Badge> : <Badge variant="secondary">Active</Badge> },
  ],
};

export const defaultsConfig = {
  endpoint: '/api/default-configurations',
  queryKey: 'default-configurations',
  title: 'Default Configurations',
  description: 'Manage default system configurations',
  fields: [
    { name: 'category', label: 'Category', type: 'select' as const, required: true, options: [
      { value: 'LOAD', label: 'Load' },
      { value: 'DRIVER', label: 'Driver' },
      { value: 'INVOICE', label: 'Invoice' },
      { value: 'CUSTOMER', label: 'Customer' },
      { value: 'TRUCK', label: 'Truck' },
      { value: 'TRAILER', label: 'Trailer' },
    ]},
    { name: 'key', label: 'Key', type: 'text' as const, required: true },
    { name: 'value', label: 'Value', type: 'text' as const, required: true },
    { name: 'description', label: 'Description', type: 'textarea' as const },
  ],
  columns: [
    { key: 'category', label: 'Category' },
    { key: 'key', label: 'Key' },
    { key: 'value', label: 'Value' },
    { key: 'description', label: 'Description' },
  ],
};

export const tasksConfig = {
  endpoint: '/api/projects',
  queryKey: 'projects',
  title: 'Projects',
  description: 'Manage projects',
  fields: [
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
  ],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', render: (val: any) => <Badge>{val || 'Active'}</Badge> },
    { key: 'priority', label: 'Priority', render: (val: any) => <Badge variant="outline">{val || 'Medium'}</Badge> },
  ],
};

export const netProfitConfig = {
  endpoint: '/api/net-profit-formulas',
  queryKey: 'net-profit-formulas',
  title: 'Net Profit Formulas',
  description: 'Manage net profit calculation formulas',
  fields: [
    { name: 'name', label: 'Name', type: 'text' as const, required: true },
    { name: 'formula', label: 'Formula', type: 'textarea' as const, required: true },
    { name: 'description', label: 'Description', type: 'textarea' as const },
  ],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'formula', label: 'Formula', render: (val: any) => (
      <code className="text-sm bg-muted p-1 rounded">{String(val).substring(0, 50)}...</code>
    )},
    { key: 'isDefault', label: 'Status', render: (val: any) => val ? <Badge>Default</Badge> : <Badge variant="secondary">Active</Badge> },
  ],
};

export const orderPaymentTypesConfig = {
  endpoint: '/api/order-payment-types',
  queryKey: 'order-payment-types',
  title: 'Order Payment Types',
  description: 'Manage payment types for orders',
  fields: [
    { name: 'name', label: 'Name', type: 'text' as const, required: true },
    { name: 'code', label: 'Code', type: 'text' as const },
    { name: 'terms', label: 'Payment Terms (days)', type: 'number' as const },
    { name: 'description', label: 'Description', type: 'textarea' as const },
  ],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    { key: 'terms', label: 'Terms (days)', render: (val: any) => val ? `${val} days` : '-' },
    { key: 'requiresPO', label: 'Requires PO', render: (val: any) => val ? <Badge>Yes</Badge> : <Badge variant="secondary">No</Badge> },
    { key: 'isDefault', label: 'Status', render: (val: any) => val ? <Badge>Default</Badge> : <Badge variant="secondary">Active</Badge> },
  ],
};

export const tariffsConfig = {
  endpoint: '/api/tariffs',
  queryKey: 'tariffs',
  title: 'Tariffs',
  description: 'Manage tariffs and payment configurations',
  fields: [
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
  ],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    { key: 'type', label: 'Type' },
    { key: 'rate', label: 'Rate', render: (val: any) => val ? `$${Number(val).toFixed(2)}` : '-' },
    { key: 'isDefault', label: 'Status', render: (val: any) => val ? <Badge>Default</Badge> : <Badge variant="secondary">Active</Badge> },
  ],
};

export const reportConstructorConfig = {
  endpoint: '/api/report-constructors',
  queryKey: 'report-constructors',
  title: 'Report Constructors',
  description: 'Build and manage custom reports',
  fields: [
    { name: 'name', label: 'Name', type: 'text' as const, required: true },
    { name: 'entityType', label: 'Entity Type', type: 'select' as const, required: true, options: [
      { value: 'LOAD', label: 'Load' },
      { value: 'DRIVER', label: 'Driver' },
      { value: 'TRUCK', label: 'Truck' },
      { value: 'INVOICE', label: 'Invoice' },
      { value: 'CUSTOMER', label: 'Customer' },
    ]},
    { name: 'format', label: 'Format', type: 'select' as const, options: [
      { value: 'PDF', label: 'PDF' },
      { value: 'EXCEL', label: 'Excel' },
      { value: 'CSV', label: 'CSV' },
      { value: 'HTML', label: 'HTML' },
    ]},
    { name: 'description', label: 'Description', type: 'textarea' as const },
  ],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'entityType', label: 'Entity Type' },
    { key: 'format', label: 'Format' },
    { key: 'description', label: 'Description' },
  ],
};

export const reportsConfig = {
  endpoint: '/api/report-templates',
  queryKey: 'report-templates',
  title: 'Report Templates',
  description: 'Manage report templates and formats',
  fields: [
    { name: 'name', label: 'Name', type: 'text' as const, required: true },
    { name: 'type', label: 'Report Type', type: 'select' as const, required: true, options: [
      { value: 'LOADS', label: 'Loads' },
      { value: 'DRIVERS', label: 'Drivers' },
      { value: 'FINANCIAL', label: 'Financial' },
      { value: 'SAFETY', label: 'Safety' },
      { value: 'MAINTENANCE', label: 'Maintenance' },
      { value: 'CUSTOM', label: 'Custom' },
    ]},
    { name: 'format', label: 'Format', type: 'select' as const, options: [
      { value: 'PDF', label: 'PDF' },
      { value: 'EXCEL', label: 'Excel' },
      { value: 'CSV', label: 'CSV' },
      { value: 'HTML', label: 'HTML' },
    ]},
    { name: 'description', label: 'Description', type: 'textarea' as const },
  ],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'format', label: 'Format' },
    { key: 'isDefault', label: 'Status', render: (val: any) => val ? <Badge>Default</Badge> : <Badge variant="secondary">Active</Badge> },
  ],
};

export const workOrderTypesConfig = {
  endpoint: '/api/work-order-types',
  queryKey: 'work-order-types',
  title: 'Work Order Types',
  description: 'Manage work order types and categories',
  fields: [
    { name: 'name', label: 'Name', type: 'text' as const, required: true },
    { name: 'code', label: 'Code', type: 'text' as const },
    { name: 'category', label: 'Category', type: 'select' as const, options: [
      { value: 'MAINTENANCE', label: 'Maintenance' },
      { value: 'REPAIR', label: 'Repair' },
      { value: 'INSPECTION', label: 'Inspection' },
      { value: 'OTHER', label: 'Other' },
    ]},
    { name: 'defaultPriority', label: 'Default Priority', type: 'select' as const, options: [
      { value: 'LOW', label: 'Low' },
      { value: 'MEDIUM', label: 'Medium' },
      { value: 'HIGH', label: 'High' },
      { value: 'CRITICAL', label: 'Critical' },
    ]},
    { name: 'estimatedHours', label: 'Estimated Hours', type: 'number' as const },
    { name: 'description', label: 'Description', type: 'textarea' as const },
  ],
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'defaultPriority', label: 'Priority' },
    { key: 'estimatedHours', label: 'Est. Hours' },
  ],
};

export const safetyConfigurationsConfig = {
  endpoint: '/api/safety-configurations',
  queryKey: 'safety-configurations',
  title: 'Safety Configurations',
  description: 'Manage safety configurations',
  fields: [
    { name: 'category', label: 'Category', type: 'select' as const, required: true, options: [
      { value: 'TRAINING', label: 'Training' },
      { value: 'COMPLIANCE', label: 'Compliance' },
      { value: 'INCIDENT', label: 'Incident' },
      { value: 'INSPECTION', label: 'Inspection' },
    ]},
    { name: 'key', label: 'Key', type: 'text' as const, required: true },
    { name: 'value', label: 'Value', type: 'text' as const, required: true },
    { name: 'description', label: 'Description', type: 'textarea' as const },
  ],
  columns: [
    { key: 'category', label: 'Category' },
    { key: 'key', label: 'Key' },
    { key: 'value', label: 'Value' },
    { key: 'description', label: 'Description' },
  ],
};
