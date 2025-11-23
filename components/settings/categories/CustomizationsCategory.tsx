'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import TagManagement from '@/components/settings/customizations/TagManagement';
import ExpenseCategories from '@/components/settings/customizations/ExpenseCategories';
import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';

// Statuses component
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

export default function CustomizationsCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Customizations</h2>
        <p className="text-muted-foreground">
          Customize statuses, tags, templates, and other system configurations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              <CardTitle>Dynamic Statuses</CardTitle>
            </div>
            <CardDescription>
              Configure dynamic status types and workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GenericCRUDManager
              endpoint="/api/dynamic-statuses"
              queryKey="dynamic-statuses"
              title="Dynamic Statuses"
              description="Manage status types for loads, drivers, trucks, and more"
              searchable={true}
              fields={statusFields}
              columns={statusColumns}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              <CardTitle>Tag Management</CardTitle>
            </div>
            <CardDescription>
              Manage tags for loads, drivers, and vehicles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TagManagement />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              <CardTitle>Classifications</CardTitle>
            </div>
            <CardDescription>
              Manage classification categories and hierarchies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Configure equipment, commodity, and service type classifications
              </p>
              <Link href="/dashboard/settings/customizations/classifications">
                <Button variant="outline">
                  Manage Classifications
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Templates</CardTitle>
            </div>
            <CardDescription>
              Manage document and form templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Create and manage templates for invoices, BOLs, and other documents
              </p>
              <Link href="/dashboard/settings/customizations/templates">
                <Button variant="outline">
                  Manage Templates
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Default Configurations</CardTitle>
            </div>
            <CardDescription>
              Set default values and configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Configure default settings for new records
              </p>
              <Link href="/dashboard/settings/customizations/defaults">
                <Button variant="outline">
                  Configure Defaults
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              <CardTitle>Task Management Projects</CardTitle>
            </div>
            <CardDescription>
              Manage projects and tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Configure task management projects and workflows
              </p>
              <Link href="/dashboard/settings/customizations/tasks">
                <Button variant="outline">
                  Manage Projects
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <CardTitle>Expense Categories</CardTitle>
            </div>
            <CardDescription>
              Manage expense categories and types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseCategories />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              <CardTitle>Net Profit Settings</CardTitle>
            </div>
            <CardDescription>
              Configure net profit calculation settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Set up net profit calculation parameters
              </p>
              <Link href="/dashboard/settings/customizations/net-profit">
                <Button variant="outline">
                  Configure Net Profit
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              <CardTitle>Order Payment Types</CardTitle>
            </div>
            <CardDescription>
              Manage order payment types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Configure payment types for orders
              </p>
              <Link href="/dashboard/settings/customizations/order-payment-types">
                <Button variant="outline">
                  Manage Payment Types
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              <CardTitle>Report Constructor</CardTitle>
            </div>
            <CardDescription>
              Build custom reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Create and customize report templates
              </p>
              <Link href="/dashboard/settings/customizations/report-constructor">
                <Button variant="outline">
                  Open Report Constructor
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ChartBar className="h-5 w-5" />
              <CardTitle>Reports Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure report settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Manage report configurations and settings
              </p>
              <Link href="/dashboard/settings/customizations/reports">
                <Button variant="outline">
                  Configure Reports
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Tariffs</CardTitle>
            </div>
            <CardDescription>
              Manage tariff configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Configure tariff rates and settings
              </p>
              <Link href="/dashboard/settings/customizations/tariffs">
                <Button variant="outline">
                  Manage Tariffs
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Work Order Safety</CardTitle>
            </div>
            <CardDescription>
              Configure work order safety settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Manage safety settings for work orders
              </p>
              <Link href="/dashboard/settings/customizations/work-order-safety">
                <Button variant="outline">
                  Configure Safety
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



