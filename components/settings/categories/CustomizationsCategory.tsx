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

export default function CustomizationsCategory() {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId(prev => prev === id ? null : id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Customizations</h2>
        <p className="text-muted-foreground">
          Customize statuses, tags, templates, and other system configurations.
          Click any section to expand it.
        </p>
      </div>

      <div className="space-y-3">
        <Section id="statuses" title="Dynamic Statuses" description="Configure custom status types for loads, drivers, trucks, and more" icon={Layers} openId={openId} onToggle={toggle}>
          <GenericCRUDManager endpoint="/api/dynamic-statuses" queryKey="dynamic-statuses" title="Dynamic Statuses" description="Manage status types" searchable fields={statusFields} columns={statusColumns} />
        </Section>

        <Section id="tags" title="Tag Management" description="Manage tags for loads, drivers, and vehicles" icon={Tag} openId={openId} onToggle={toggle}>
          <TagManagement />
        </Section>

        <Section id="classifications" title="Classifications" description="Manage classification categories and hierarchies" icon={FolderTree} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...classificationsConfig} searchable />
        </Section>

        <Section id="templates" title="Templates" description="Manage document and form templates" icon={FileText} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...templatesConfig} searchable />
        </Section>

        <Section id="defaults" title="Default Configurations" description="Set default values for new records" icon={Settings} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...defaultsConfig} searchable />
        </Section>

        <Section id="tasks" title="Task Management Projects" description="Manage projects and tasks" icon={Layers} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...tasksConfig} searchable />
        </Section>

        <Section id="expenses" title="Expense Categories" description="Manage expense categories and types" icon={DollarSign} openId={openId} onToggle={toggle}>
          <ExpenseCategories />
        </Section>

        <Section id="net-profit" title="Net Profit Settings" description="Configure net profit calculation formulas" icon={Calculator} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...netProfitConfig} searchable />
          <div className="mt-3 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Formula syntax supports variables like {'{revenue}'}, {'{expenses}'}, {'{fuel_cost}'}, etc.
            </p>
          </div>
        </Section>

        <Section id="payment-types" title="Order Payment Types" description="Manage payment types for orders" icon={Receipt} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...orderPaymentTypesConfig} searchable />
        </Section>

        <Section id="tariffs" title="Tariffs" description="Manage tariff configurations and pricing" icon={FileText} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...tariffsConfig} searchable />
        </Section>

        <Section id="report-constructor" title="Report Constructor" description="Build custom reports" icon={FileCheck} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...reportConstructorConfig} searchable />
        </Section>

        <Section id="reports" title="Reports Configuration" description="Configure report settings and templates" icon={ChartBar} openId={openId} onToggle={toggle}>
          <GenericCRUDManager {...reportsConfig} searchable />
        </Section>

        <Section id="work-order-safety" title="Work Order & Safety" description="Configure work order types and safety settings" icon={AlertTriangle} openId={openId} onToggle={toggle}>
          <div className="space-y-6">
            <GenericCRUDManager {...workOrderTypesConfig} searchable />
            <GenericCRUDManager {...safetyConfigurationsConfig} searchable />
          </div>
        </Section>
      </div>
    </div>
  );
}
