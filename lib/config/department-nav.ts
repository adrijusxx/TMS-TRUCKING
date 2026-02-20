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
  { name: 'Trucks', href: '/dashboard/trucks', icon: Truck },
  { name: 'Trailers', href: '/dashboard/trailers', icon: Container },
  { name: 'Devices', href: '/dashboard/fleet/devices', icon: Wifi },
  { name: 'Diagnostics', href: '/dashboard/fleet/diagnostics', icon: Gauge },
  { name: 'Maintenance', href: '/dashboard/fleet/maintenance', icon: Wrench },
  { name: 'Inspections', href: '/dashboard/fleet/inspections', icon: ClipboardCheck },
  { name: 'Vendors', href: '/dashboard/fleet/vendors', icon: Building2 },
  { name: 'Reports', href: '/dashboard/fleet/reports', icon: BarChart3 },
];

// Safety Department
export const safetyNavItems: DepartmentNavItem[] = [
  { name: 'Dashboard', href: '/dashboard/safety', icon: LayoutDashboard },
  { name: 'Compliance', href: '/dashboard/safety/compliance', icon: FileCheck },
  { name: 'Fleet Safety', href: '/dashboard/safety/fleet', icon: Car },
  { name: 'Incidents', href: '/dashboard/safety/incidents', icon: AlertCircle },
  { name: 'Training', href: '/dashboard/safety/training', icon: GraduationCap },
];

// Accounting Department
export const accountingNavItems: DepartmentNavItem[] = [
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Settlements', href: '/dashboard/batches', icon: CreditCard },
  { name: 'Expenses', href: '/dashboard/accounting/expenses', icon: Receipt },
  { name: 'IFTA', href: '/dashboard/accounting/ifta', icon: Fuel },
  { name: 'Factoring', href: '/dashboard/accounting/factoring', icon: Building2 },
  { name: 'Settings', href: '/dashboard/accounting/settings', icon: Sliders },
];

// HR Department
export const hrNavItems: DepartmentNavItem[] = [
  { name: 'HR Management', href: '/dashboard/hr', icon: Users },
  { name: 'Drivers', href: '/dashboard/drivers', icon: UserCheck },
];

// CRM / Recruiting Department
export const crmNavItems: DepartmentNavItem[] = [
  { name: 'Dashboard', href: '/dashboard/crm', icon: LayoutDashboard },
  { name: 'Leads', href: '/dashboard/crm/leads', icon: Users },
  { name: 'Kanban', href: '/dashboard/crm/kanban', icon: LayoutGrid },
  { name: 'Onboarding', href: '/dashboard/crm/onboarding', icon: ClipboardCheck },
  { name: 'Reports', href: '/dashboard/crm/reports', icon: BarChart3 },
  { name: 'Campaigns', href: '/dashboard/crm/campaigns', icon: Megaphone },
  { name: 'Settings', href: '/dashboard/crm/settings', icon: Settings },
];

// Analytics
export const analyticsNavItems: DepartmentNavItem[] = [
  { name: 'Overview', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Profitability', href: '/dashboard/analytics/profitability', icon: TrendingUp },
  { name: 'Lane Analysis', href: '/dashboard/analytics/lanes', icon: Map },
  { name: 'Drivers', href: '/dashboard/analytics/drivers', icon: Users },
  { name: 'Fuel', href: '/dashboard/analytics/fuel', icon: Fuel },
  { name: 'Revenue Forecast', href: '/dashboard/analytics/revenue-forecast', icon: LineChart },
  { name: 'Empty Miles', href: '/dashboard/analytics/empty-miles', icon: TrendingDown },
  { name: 'Deep Insights', href: '/dashboard/analytics/deep-insights', icon: Target, badge: 'NEW' },
];
