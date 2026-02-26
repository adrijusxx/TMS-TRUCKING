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
  { name: 'Dispatch Hub', href: '/dashboard/dispatch', icon: Navigation },
  { name: 'War Room', href: '/dashboard/war-room', icon: Map },
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
  { name: 'Safety Board', href: '/dashboard/safety/board', icon: LayoutGrid },
  { name: 'Calendar', href: '/dashboard/safety/calendar', icon: Calendar },
  { name: 'Inspections', href: '/dashboard/safety/inspections', icon: FileCheck },
  { name: 'Claims', href: '/dashboard/safety/claims', icon: AlertCircle },
  { name: 'Overview', href: '/dashboard/safety/overview', icon: LayoutDashboard },
  { name: 'Audit Prep', href: '/dashboard/safety/audit-prep', icon: FileCheck },
  { name: 'Analytics', href: '/dashboard/safety/analytics', icon: BarChart3 },
];

// Accounting Department
export const accountingNavItems: DepartmentNavItem[] = [
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { name: 'Settlements', href: '/dashboard/settlements', icon: CreditCard },
  { name: 'Bills', href: '/dashboard/bills', icon: Receipt },
  { name: 'IFTA', href: '/dashboard/accounting/ifta', icon: Fuel },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
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
  {
    name: 'Workforce', href: '/dashboard/drivers', icon: Users,
    children: [
      { name: 'All Drivers', href: '/dashboard/drivers' },
      { name: 'Driver Compliance', href: '/dashboard/safety/driver-compliance' },
      { name: 'DQF', href: '/dashboard/safety/dqf' },
    ],
  },
  { name: 'Monitoring', href: '/dashboard/drivers/monitoring', icon: Activity },
];

// CRM / Recruiting Department
export const crmNavItems: DepartmentNavItem[] = [
  { name: 'Dashboard', href: '/dashboard/crm', icon: LayoutDashboard },
  {
    name: 'Leads', href: '/dashboard/crm/leads', icon: Users,
    children: [
      { name: 'All Leads', href: '/dashboard/crm/leads' },
      { name: 'Kanban', href: '/dashboard/crm/kanban' },
      { name: 'Follow-Up Calendar', href: '/dashboard/crm/calendar' },
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
