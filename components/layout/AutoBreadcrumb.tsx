'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';

/**
 * Route segment labels for human-readable breadcrumbs.
 * Dynamic segments (e.g., [id]) are omitted and resolved at render time.
 */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  loads: 'Loads',
  board: 'Week Board',
  drivers: 'Drivers',
  trucks: 'Trucks',
  trailers: 'Trailers',
  fleet: 'Fleet',
  safety: 'Safety',
  accounting: 'Accounting',
  invoices: 'Invoices',
  settlements: 'Settlements',
  batches: 'Batches',
  customers: 'Customers',
  vendors: 'Vendors',
  locations: 'Locations',
  maintenance: 'Maintenance',
  reports: 'Reports',
  analytics: 'Analytics',
  settings: 'Settings',
  customizations: 'Customizations',
  integrations: 'Integrations',
  crm: 'CRM',
  documents: 'Documents',
  dispatch: 'Dispatch',
  operations: 'Operations',
  map: 'Map',
  calendar: 'Calendar',
  inventory: 'Inventory',
  salary: 'Salary',
  bills: 'Bills',
  inspections: 'Inspections',
  incidents: 'Incidents',
  compliance: 'Compliance',
  insurance: 'Insurance',
  programs: 'Programs',
  training: 'Training',
  'drug-tests': 'Drug Tests',
  'medical-cards': 'Medical Cards',
  dvir: 'DVIR',
  hos: 'HOS',
  mvr: 'MVR',
  dqf: 'DQF',
  cdl: 'CDL',
  alerts: 'Alerts',
  'annual-reviews': 'Annual Reviews',
  defects: 'Defects',
  'out-of-service': 'Out of Service',
  'dot-inspections': 'DOT Inspections',
  'roadside-inspections': 'Roadside Inspections',
  'work-orders': 'Work Orders',
  'driver-compliance': 'Driver Compliance',
  'csa-scores': 'CSA Scores',
  dataq: 'DataQ',
  fmcsa: 'FMCSA',
  claims: 'Claims',
  policies: 'Policies',
  meetings: 'Meetings',
  recognition: 'Recognition',
  'deep-insights': 'Deep Insights',
  profitability: 'Profitability',
  lanes: 'Lane Analysis',
  fuel: 'Fuel',
  'revenue-forecast': 'Revenue Forecast',
  'empty-miles': 'Empty Miles',
  'fleet-utilization': 'Fleet Utilization',
  'billing-exceptions': 'Billing Exceptions',
  'deduction-rules': 'Deduction Rules',
  expenses: 'Expenses',
  factoring: 'Factoring',
  ifta: 'IFTA',
  classifications: 'Classifications',
  defaults: 'Defaults',
  'net-profit': 'Net Profit',
  'order-payment-types': 'Order Payment Types',
  'report-constructor': 'Report Constructor',
  statuses: 'Statuses',
  tags: 'Tags',
  tariffs: 'Tariffs',
  tasks: 'Tasks',
  templates: 'Templates',
  'work-order-safety': 'Work Order Safety',
  'google-maps': 'Google Maps',
  'google-sheets': 'Google Sheets',
  netsapiens: 'NetSapiens',
  quickbooks: 'QuickBooks',
  samsara: 'Samsara',
  telegram: 'Telegram',
  mattermost: 'Mattermost',
  messaging: 'Messaging',
  admin: 'Admin',
  employee: 'Employee',
  'import-audit': 'Import Audit',
  constructor: 'Constructor',
  'settlement-reconciliation': 'Settlement Reconciliation',
  generate: 'Generate',
  'bulk-generate': 'Bulk Generate',
  new: 'New',
  edit: 'Edit',
  aging: 'Aging',
  reconciliation: 'Reconciliation',
  campaigns: 'Campaigns',
  automations: 'Automations',
  kanban: 'Kanban',
  leads: 'Leads',
  onboarding: 'Onboarding',
  edi: 'EDI',
  testing: 'Testing',
  diagnostics: 'Diagnostics',
  communications: 'Communications',
  'knowledge-base': 'Knowledge Base',
  costs: 'Costs',
  hotspots: 'Hotspots',
  'on-call': 'On Call',
  breakdowns: 'Breakdowns',
  history: 'History',
  devices: 'Devices',
  'mc-numbers': 'MC Numbers',
  marketplace: 'Marketplace',
  automation: 'Automation',
  'dispatch-view': 'My Dispatch',
  loadboard: 'Loadboard',
  'fleet-board': 'Fleet Board',
  'fleet-map': 'Fleet Map',
  monitoring: 'Monitoring',
  'super-admin': 'Super Admin',
  companies: 'Companies',
  features: 'Features',
  users: 'Users',
  'api-keys': 'API Keys',
  audit: 'Audit',
  'data-cleanup': 'Data Cleanup',
  apps: 'Apps',
  billing: 'Billing',
};

/** Returns true if a path segment looks like a dynamic ID */
function isDynamicSegment(segment: string): boolean {
  // UUIDs, MongoDB ObjectIDs, numeric IDs
  return /^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment);
}

interface AutoBreadcrumbProps {
  /** Override the label for the current (last) segment */
  currentLabel?: string;
  className?: string;
}

/**
 * Auto-generates breadcrumbs from the current URL path.
 * Only renders when depth > 1 (i.e., deeper than /dashboard/section).
 */
export function AutoBreadcrumb({ currentLabel, className }: AutoBreadcrumbProps) {
  const pathname = usePathname();
  if (!pathname) return null;

  const segments = pathname.split('/').filter(Boolean);

  // Don't render breadcrumbs for shallow pages (dashboard + 1 segment = just a section)
  // /dashboard/loads → 2 segments → no breadcrumb
  // /dashboard/loads/123 → 3 segments → show breadcrumb
  if (segments.length <= 2) return null;

  // Build breadcrumb items, skipping "dashboard" as that's represented by the Home icon
  const items = segments.slice(1).map((segment, index) => {
    const isLast = index === segments.slice(1).length - 1;
    const href = '/' + segments.slice(0, index + 2).join('/');

    let label: string;
    if (isLast && currentLabel) {
      label = currentLabel;
    } else if (isDynamicSegment(segment)) {
      label = 'Details';
    } else {
      label = SEGMENT_LABELS[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }

    return {
      label,
      href: isLast ? undefined : href,
    };
  });

  return <Breadcrumb items={items} className={className} />;
}
