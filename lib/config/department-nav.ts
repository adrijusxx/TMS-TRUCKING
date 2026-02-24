import {
  Package,
  LayoutGrid,
  Navigation,
  UserCircle,
  LayoutDashboard,
  Truck,
  Container,
  Wrench,
  AlertTriangle,
  ClipboardCheck,
  Wifi,
  Gauge,
  Calendar,
  Building2,
  BarChart3,
  BookOpen,
  FileCheck,
  Car,
  AlertCircle,
  GraduationCap,
  FileText,
  Users,
  CreditCard,
  Receipt,
  Fuel,
  Sliders,
  UserCheck,
  Settings,
  Megaphone,
  TrendingUp,
  Map,
  TrendingDown,
  LineChart,
  Target,
  MessageSquare,
  Activity,
} from 'lucide-react';
import type { DepartmentNavItem } from '@/components/layout/DepartmentNav';

// Load Management
export const loadNavItems: DepartmentNavItem[] = [
  { name: 'All Loads', href: '/dashboard/loads', icon: Package },
  { name: 'My Dispatch', href: '/dashboard/dispatch-view', icon: UserCircle },
  { name: 'Driver Week Board', href: '/dashboard/loads/board', icon: LayoutGrid },
  { name: 'Operations Center', href: '/dashboard/operations', icon: Navigation },
];

// Fleet Department
export const fleetNavItems: DepartmentNavItem[] = [
  { name: 'Dashboard', href: '/dashboard/fleet', icon: LayoutDashboard },
  {
    name: 'Vehicles', href: '/dashboard/trucks', icon: Truck,
    children: [
      { name: 'Trucks', href: '/dashboard/trucks' },
      { name: 'Trailers', href: '/dashboard/trailers' },
      { name: 'Devices', href: '/dashboard/fleet/devices' },
      { name: 'Diagnostics', href: '/dashboard/fleet/diagnostics' },
    ],
  },
  {
    name: 'Maintenance', href: '/dashboard/fleet/maintenance', icon: Wrench,
    children: [
      { name: 'Work Orders', href: '/dashboard/fleet/maintenance' },
      { name: 'Inspections', href: '/dashboard/fleet/inspections' },
      { name: 'Vendors', href: '/dashboard/fleet/vendors' },
    ],
  },
  { name: 'Communications', href: '/dashboard/fleet/communications', icon: MessageSquare },
  { name: 'Knowledge Base', href: '/dashboard/fleet/knowledge-base', icon: BookOpen },
  { name: 'Reports', href: '/dashboard/fleet/reports', icon: BarChart3 },
];

// Safety Department
export const safetyNavItems: DepartmentNavItem[] = [
  { name: 'Safety Tasks', href: '/dashboard/safety', icon: ClipboardCheck },
  { name: 'Safety Board', href: '/dashboard/safety?tab=board', icon: LayoutGrid },
  { name: 'Calendar', href: '/dashboard/safety?tab=calendar', icon: Calendar },
  { name: 'Inspections', href: '/dashboard/safety?tab=inspections', icon: FileCheck },
  { name: 'Claims', href: '/dashboard/safety?tab=claims', icon: AlertCircle },
  { name: 'Overview', href: '/dashboard/safety?tab=overview', icon: LayoutDashboard },
];

// Accounting Department
export const accountingNavItems: DepartmentNavItem[] = [
  {
    name: 'Invoices', href: '/dashboard/invoices', icon: FileText,
    children: [
      { name: 'All Invoices', href: '/dashboard/invoices' },
      { name: 'Batches', href: '/dashboard/batches' },
      { name: 'Aging', href: '/dashboard/invoices?tab=aging' },
      { name: 'Reconciliation', href: '/dashboard/invoices?tab=reconciliation' },
      { name: 'Generate', href: '/dashboard/invoices/generate' },
      { name: 'Reports', href: '/dashboard/invoices?tab=reports' },
    ],
  },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  {
    name: 'Settlements', href: '/dashboard/settlements', icon: CreditCard,
    children: [
      { name: 'Pending', href: '/dashboard/settlements?tab=pending' },
      { name: 'Batches', href: '/dashboard/settlements?tab=batches' },
      { name: 'All Settlements', href: '/dashboard/settlements?tab=statements' },
      { name: 'Dispatcher Salary', href: '/dashboard/settlements?tab=dispatcher' },
      { name: 'Reports', href: '/dashboard/settlements?tab=report' },
      { name: 'Balances', href: '/dashboard/settlements?tab=balances' },
    ],
  },
  {
    name: 'Bills', href: '/dashboard/bills', icon: Receipt,
    children: [
      { name: 'Bills Batch', href: '/dashboard/bills?tab=batches' },
      { name: 'Bills', href: '/dashboard/bills?tab=bills' },
      { name: 'Statements', href: '/dashboard/bills?tab=statements' },
      { name: 'Vendor Balances', href: '/dashboard/bills?tab=balances' },
      { name: 'One Time Charges', href: '/dashboard/bills?tab=charges' },
      { name: 'Scheduled Payments', href: '/dashboard/bills?tab=scheduled' },
    ],
  },
  { name: 'IFTA', href: '/dashboard/accounting/ifta', icon: Fuel },
  {
    name: 'Factoring', href: '/dashboard/accounting/factoring', icon: Building2,
    children: [
      { name: 'Dashboard', href: '/dashboard/accounting/factoring' },
      { name: 'Companies', href: '/dashboard/accounting/factoring?tab=companies' },
    ],
  },
  { name: 'Settings', href: '/dashboard/accounting/settings', icon: Sliders },
];

// HR Department
export const hrNavItems: DepartmentNavItem[] = [
  { name: 'Dashboard', href: '/dashboard/hr', icon: LayoutDashboard },
  {
    name: 'Workforce', href: '/dashboard/drivers', icon: Users,
    children: [
      { name: 'All Drivers', href: '/dashboard/drivers' },
      { name: 'Performance', href: '/dashboard/hr?tab=performance' },
      { name: 'Retention', href: '/dashboard/hr?tab=retention' },
    ],
  },
  {
    name: 'Compensation', href: '/dashboard/hr?tab=settlements', icon: CreditCard,
    children: [
      { name: 'Settlements', href: '/dashboard/hr?tab=settlements' },
      { name: 'Bonuses', href: '/dashboard/hr?tab=bonuses' },
    ],
  },
  { name: 'Monitoring', href: '/dashboard/hr?tab=monitoring', icon: Activity },
];

// CRM / Recruiting Department
export const crmNavItems: DepartmentNavItem[] = [
  { name: 'Dashboard', href: '/dashboard/crm', icon: LayoutDashboard },
  {
    name: 'Leads', href: '/dashboard/crm/leads', icon: Users,
    children: [
      { name: 'All Leads', href: '/dashboard/crm/leads' },
      { name: 'Kanban', href: '/dashboard/crm/kanban' },
      { name: 'Onboarding', href: '/dashboard/crm/onboarding' },
      { name: 'Campaigns', href: '/dashboard/crm/campaigns' },
    ],
  },
  { name: 'Reports', href: '/dashboard/crm/reports', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/crm/settings', icon: Settings },
];

// Analytics
export const analyticsNavItems: DepartmentNavItem[] = [
  { name: 'Overview', href: '/dashboard/analytics', icon: BarChart3 },
  {
    name: 'Analysis', href: '/dashboard/analytics/profitability', icon: TrendingUp,
    children: [
      { name: 'Profitability', href: '/dashboard/analytics/profitability' },
      { name: 'Lane Analysis', href: '/dashboard/analytics/lanes' },
      { name: 'Drivers', href: '/dashboard/analytics/drivers' },
      { name: 'Fuel', href: '/dashboard/analytics/fuel' },
    ],
  },
  {
    name: 'Forecasting', href: '/dashboard/analytics/revenue-forecast', icon: LineChart,
    children: [
      { name: 'Revenue Forecast', href: '/dashboard/analytics/revenue-forecast' },
      { name: 'Empty Miles', href: '/dashboard/analytics/empty-miles' },
      { name: 'Fleet Utilization', href: '/dashboard/analytics/fleet-utilization' },
    ],
  },
  { name: 'Deep Insights', href: '/dashboard/analytics/deep-insights', icon: Target, badge: 'NEW' },
];
