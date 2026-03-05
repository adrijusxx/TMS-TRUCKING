'use client';

import { useState } from 'react';
import {
  Tag,
  Layers,
  FileText,
  FolderTree,
  Settings,
  DollarSign,
  Calculator,
  FileCheck,
  ChartBar,
  Receipt,
  AlertTriangle,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import TagManagement from '@/components/settings/customizations/TagManagement';
import ExpenseCategories from '@/components/settings/customizations/ExpenseCategories';
import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';
import {
  classificationsConfig,
  templatesConfig,
  defaultsConfig,
  tasksConfig,
  netProfitConfig,
  orderPaymentTypesConfig,
  tariffsConfig,
  reportConstructorConfig,
  reportsConfig,
  workOrderTypesConfig,
  safetyConfigurationsConfig,
} from '@/lib/config/customization-crud-configs';

// Statuses config (kept inline since it was already here)
const statusFields = [
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

const statusColumns = [
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

/** Collapsible section — only renders children when expanded (lazy) */
function Section({
  id,
  title,
  description,
  icon: Icon,
  openId,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  openId: string | null;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  const isOpen = openId === id;
  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={() => onToggle(id)}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{title}</CardTitle>
              </div>
              <ChevronDown className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )} />
            </div>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>{isOpen && children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function GroupHeader({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-2 pt-4 first:pt-0">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

export default function CustomizationsCategory() {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId(prev => prev === id ? null : id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Customizations</h2>
        <p className="text-muted-foreground">
          Customize your system&apos;s dropdown options, categories, templates, and calculation rules.
          These settings control what appears in forms and how data is organized across the application.
          Click any section to expand it.
        </p>
      </div>

      <div className="space-y-3">
        {/* Financial */}
        <GroupHeader title="Financial" icon={DollarSign} />

        <Section id="tariffs" title="Tariffs" description="Set up rate tables for common lanes, customers, or service types. Tariffs can auto-populate pricing when creating loads, reducing manual rate entry." icon={FileText} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...tariffsConfig} searchable />
        </Section>

        <Section id="expenses" title="Expense Categories" description="Define the categories used when recording expenses on loads (fuel, tolls, detention, etc.). These categories appear in expense forms and are used in settlement calculations and profitability reports." icon={DollarSign} openId={openId} onToggle={toggle}>
          <ExpenseCategories />
        </Section>

        <Section id="net-profit" title="Net Profit Settings" description="Define how net profit is calculated for loads and reports. Use formula variables like {revenue}, {expenses}, {fuel_cost} to create custom profit calculations that match your business model." icon={Calculator} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...netProfitConfig} searchable />
          <div className="mt-3 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Formula syntax supports variables like {'{revenue}'}, {'{expenses}'}, {'{fuel_cost}'}, etc.
            </p>
          </div>
        </Section>

        <Section id="payment-types" title="Order Payment Types" description="Configure payment terms offered to customers (Net 30, Net 60, COD, etc.). These appear when creating orders and invoices, and affect accounts receivable aging reports." icon={Receipt} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...orderPaymentTypesConfig} searchable />
        </Section>

        {/* Operational */}
        <GroupHeader title="Operational" icon={Settings} />

        <Section id="statuses" title="Dynamic Statuses" description="Create custom statuses for loads, drivers, trucks, and other entities. These appear in dropdown menus throughout the app. Example: add 'Awaiting POD' as a load status or 'On Vacation' for drivers." icon={Layers} openId={openId} onToggle={toggle}>
          <GenericCRUDManager endpoint="/api/dynamic-statuses" queryKey="dynamic-statuses" title="Dynamic Statuses" description="Manage status types" searchable fields={statusFields} columns={statusColumns} />
        </Section>

        <Section id="classifications" title="Classifications" description="Classifications organize your equipment types, commodities, and service categories. These are used in load creation, reporting, and filtering. Example: equipment types like 'Dry Van', 'Reefer', 'Flatbed'." icon={FolderTree} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...classificationsConfig} searchable />
        </Section>

        <Section id="defaults" title="Default Configurations" description="Set default values that auto-fill when creating new loads, drivers, or other records. Saves time by pre-populating common fields like equipment type, payment terms, or load status." icon={Settings} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...defaultsConfig} searchable />
        </Section>

        <Section id="tasks" title="Task Management Projects" description="Create projects to organize internal tasks and track work items. Use for maintenance scheduling, compliance tasks, or operational projects across your team." icon={Layers} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...tasksConfig} searchable />
        </Section>

        {/* Documents & Reports */}
        <GroupHeader title="Documents & Reports" icon={FileText} />

        <Section id="templates" title="Templates" description="Define templates for invoices, BOLs, settlements, and other documents. Templates control the layout and content of generated PDFs and emails sent to customers and drivers." icon={FileText} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...templatesConfig} searchable />
        </Section>

        <Section id="reports" title="Reports Configuration" description="Define report templates that can be reused across the organization. Set default formats, filters, and scheduling for automated report generation." icon={ChartBar} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...reportsConfig} searchable />
        </Section>

        <Section id="report-constructor" title="Report Constructor" description="Create custom report definitions by selecting entity types, fields, and formats. Reports can be generated as PDF, Excel, or CSV from the Reports section." icon={FileCheck} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...reportConstructorConfig} searchable />
        </Section>

        {/* Tags & Safety */}
        <GroupHeader title="Tags & Safety" icon={Tag} />

        <Section id="tags" title="Tag Management" description="Tags let you categorize and filter loads, drivers, and vehicles with color-coded labels. Use them for quick visual identification — e.g., 'High Priority', 'Hazmat', 'New Customer'." icon={Tag} openId={openId} onToggle={toggle}>
          <TagManagement />
        </Section>

        <Section id="work-order-safety" title="Work Order & Safety" description="Manage work order types for fleet maintenance (PM Service, Brake Repair, etc.) and safety configurations (training requirements, compliance rules, inspection checklists)." icon={AlertTriangle} openId={openId} onToggle={toggle}>
          <div className="space-y-6">
            <GenericCRUDManager {...workOrderTypesConfig} searchable />
            <GenericCRUDManager {...safetyConfigurationsConfig} searchable />
          </div>
        </Section>
      </div>
    </div>
  );
}
