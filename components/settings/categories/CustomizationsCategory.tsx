'use client';

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
} from 'lucide-react';
import TagManagement from '@/components/settings/customizations/TagManagement';
import ExpenseCategories from '@/components/settings/customizations/ExpenseCategories';
import GenericCRUDManager from '@/lib/components/GenericCRUDManager';
import { Badge } from '@/components/ui/badge';
import SettingsCard from '@/components/settings/SettingsCard';

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
        <SettingsCard
          title="Dynamic Statuses"
          description="Configure dynamic status types and workflows"
          icon={Layers}
          usageInfo="Dynamic Statuses allow you to create custom status types for different entities (loads, drivers, trucks, etc.). Use this to track the lifecycle of your business objects with custom statuses that match your workflow.\n\n• Create statuses for each entity type (Load, Driver, Truck, etc.)\n• Assign colors and codes for visual identification\n• Set display order to control how statuses appear in dropdowns\n• Mark one status as default for each entity type\n\nExample: Create statuses like 'Pending Dispatch', 'In Transit', 'Delivered' for loads to track their progress."
        >
          <GenericCRUDManager
            endpoint="/api/dynamic-statuses"
            queryKey="dynamic-statuses"
            title="Dynamic Statuses"
            description="Manage status types for loads, drivers, trucks, and more"
            searchable={true}
            fields={statusFields}
            columns={statusColumns}
          />
        </SettingsCard>

        <SettingsCard
          title="Tag Management"
          description="Manage tags for loads, drivers, and vehicles"
          icon={Tag}
          usageInfo="Tags are flexible labels you can assign to loads, drivers, and vehicles for quick filtering and organization. Unlike statuses, tags can be applied multiple times and don't represent a workflow state.\n\n• Create tags to categorize items (e.g., 'Hot Load', 'Refrigerated', 'Owner Operator')\n• Assign multiple tags to a single item\n• Use tags to filter and search across your system\n• Tags help organize and find related items quickly\n\nExample: Tag loads with 'Express', 'Hazmat', or 'Weekend Delivery' to quickly filter and find them."
        >
          <TagManagement />
        </SettingsCard>

        <SettingsCard
          title="Classifications"
          description="Manage classification categories and hierarchies"
          icon={FolderTree}
          href="/dashboard/settings/customizations/classifications"
          buttonText="Manage Classifications"
          usageInfo="Classifications organize your equipment, commodities, and service types into structured categories. This helps standardize how you categorize your business operations.\n\n• Create hierarchical categories for equipment types (Dry Van, Reefer, Flatbed, etc.)\n• Organize commodities by type (Food, Electronics, Construction Materials)\n• Define service types (FTL, LTL, Intermodal, etc.)\n• Use classifications to filter and report on specific categories\n\nExample: Create equipment classifications like 'Dry Van > 53ft' or 'Reefer > 48ft' to standardize your fleet categorization."
        />

        <SettingsCard
          title="Templates"
          description="Manage document and form templates"
          icon={FileText}
          href="/dashboard/settings/customizations/templates"
          buttonText="Manage Templates"
          usageInfo="Templates allow you to save and reuse common document formats and form configurations. This saves time when creating similar documents repeatedly.\n\n• Create templates for invoices, BOLs, rate confirmations, and other documents\n• Save form configurations with pre-filled values\n• Use templates to ensure consistency across your documents\n• Quickly generate new documents from saved templates\n\nExample: Create an invoice template with your company logo, terms, and standard line items to quickly generate new invoices."
        />

        <SettingsCard
          title="Default Configurations"
          description="Set default values and configurations for new records"
          icon={Settings}
          href="/dashboard/settings/customizations/defaults"
          buttonText="Configure Defaults"
          usageInfo="Default Configurations set the initial values that appear when creating new records. This speeds up data entry and ensures consistency.\n\n• Set default payment terms (e.g., Net 30)\n• Configure default load types and equipment types\n• Set default values for invoices, settlements, and other records\n• Reduce manual data entry by pre-filling common values\n\nExample: Set default payment terms to 'Net 30' so all new invoices automatically use this term unless changed."
        />

        <SettingsCard
          title="Task Management Projects"
          description="Manage projects and tasks"
          icon={Layers}
          href="/dashboard/settings/customizations/tasks"
          buttonText="Manage Projects"
          usageInfo="Task Management Projects help you organize and track work across your organization. Create projects to group related tasks and monitor progress.\n\n• Create projects for major initiatives or ongoing work\n• Assign tasks to team members with due dates\n• Track project progress and completion\n• Use projects to organize work by department or initiative\n\nExample: Create a 'Fleet Maintenance' project to track all maintenance-related tasks, or a 'Q4 Expansion' project for strategic initiatives."
        />

        <SettingsCard
          title="Expense Categories"
          description="Manage expense categories and types"
          icon={DollarSign}
          usageInfo="Expense Categories organize your business expenses for better tracking and reporting. Categorize expenses to understand where your money is being spent.\n\n• Create categories like 'Fuel', 'Maintenance', 'Tolls', 'Meals', etc.\n• Assign expenses to categories when recording them\n• Use categories for expense reporting and analysis\n• Track spending patterns by category over time\n\nExample: Create categories such as 'Fuel', 'Repairs', 'Insurance', 'Permits' to track different types of operational expenses."
        >
          <ExpenseCategories />
        </SettingsCard>

        <SettingsCard
          title="Net Profit Settings"
          description="Configure net profit calculation settings"
          icon={Calculator}
          href="/dashboard/settings/customizations/net-profit"
          buttonText="Configure Net Profit"
          usageInfo="Net Profit Settings control how your system calculates profit margins and financial performance. Configure what costs are included in profit calculations.\n\n• Define which expenses are included in cost calculations\n• Set up profit margin formulas and thresholds\n• Configure how revenue and costs are calculated\n• Set up alerts for low-profit loads or routes\n\nExample: Configure the system to include fuel, driver pay, and maintenance in cost calculations to get accurate net profit per load."
        />

        <SettingsCard
          title="Order Payment Types"
          description="Manage order payment types"
          icon={Receipt}
          href="/dashboard/settings/customizations/order-payment-types"
          buttonText="Manage Payment Types"
          usageInfo="Order Payment Types define how customers pay for your services. Set up different payment methods and terms to match your business model.\n\n• Create payment types like 'Cash', 'Check', 'ACH', 'Credit Card', 'Factoring'\n• Configure payment terms (Net 15, Net 30, COD, etc.)\n• Set up automatic payment processing rules\n• Track payment methods for reporting and analysis\n\nExample: Create payment types such as 'COD', 'Net 30', 'Factored', and 'Prepaid' to track different payment arrangements."
        />

        <SettingsCard
          title="Report Constructor"
          description="Build custom reports"
          icon={FileCheck}
          href="/dashboard/settings/customizations/report-constructor"
          buttonText="Open Report Constructor"
          usageInfo="Report Constructor is a powerful tool to create custom reports tailored to your specific needs. Build reports with the exact data and format you require.\n\n• Select data fields to include in your report\n• Apply filters to show only relevant records\n• Choose grouping and sorting options\n• Export reports in various formats (PDF, Excel, CSV)\n• Save report templates for future use\n\nExample: Create a 'Weekly Driver Performance' report showing miles driven, loads completed, and revenue per driver, grouped by MC number."
        />

        <SettingsCard
          title="Reports Configuration"
          description="Configure report settings"
          icon={ChartBar}
          href="/dashboard/settings/customizations/reports"
          buttonText="Configure Reports"
          usageInfo="Reports Configuration allows you to customize default report settings, schedules, and delivery options. Set up automated reporting workflows.\n\n• Configure default report formats and layouts\n• Set up scheduled report generation (daily, weekly, monthly)\n• Configure email delivery for automated reports\n• Set report retention policies\n• Customize report branding and headers\n\nExample: Set up a weekly 'Revenue Summary' report to automatically generate every Monday and email it to management."
        />

        <SettingsCard
          title="Tariffs"
          description="Manage tariff configurations"
          icon={FileText}
          href="/dashboard/settings/customizations/tariffs"
          buttonText="Manage Tariffs"
          usageInfo="Tariffs define your pricing structure for different routes, lanes, and services. Set up rate tables to quickly price loads and maintain consistent pricing.\n\n• Create tariff tables for different routes or lanes\n• Set base rates and mileage rates\n• Configure fuel surcharges and accessorial charges\n• Apply tariffs automatically when creating loads\n• Track rate changes over time\n\nExample: Create a tariff for 'Chicago to Los Angeles' with base rate $2,500 plus $2.50 per mile, including fuel surcharge calculations."
        />

        <SettingsCard
          title="Work Order Safety"
          description="Configure work order safety settings"
          icon={AlertTriangle}
          href="/dashboard/settings/customizations/work-order-safety"
          buttonText="Configure Safety"
          usageInfo="Work Order Safety settings configure safety requirements and compliance checks for work orders. Ensure all safety protocols are followed before work begins.\n\n• Set required safety certifications for different work types\n• Configure pre-work safety checklists\n• Set up safety training requirements\n• Track safety incidents and violations\n• Ensure compliance with DOT and OSHA regulations\n\nExample: Configure work orders to require CDL verification, drug test confirmation, and hours-of-service compliance before assigning drivers to loads."
        />
      </div>
    </div>
  );
}





