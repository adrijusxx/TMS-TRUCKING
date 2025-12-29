import {
  Truck,
  Container,
  AlertTriangle,
  Wrench,
  ClipboardCheck,
  MessageCircle,
  BarChart3,
  Building2,
  Calendar,
  Wifi,
  Gauge,
  LayoutDashboard,
  BookOpen,
} from 'lucide-react';

// Quick access link to main dashboard
export const fleetDashboardLink = {
  name: 'Fleet Dashboard',
  href: '/dashboard/fleet',
  icon: LayoutDashboard,
  description: 'Main Fleet Department dashboard with active cases, communications, team assignments, and analytics overview.',
};

// Navigation sections configuration
export const fleetNavigationSections = [
  {
    title: 'Fleet Assets',
    icon: Truck,
    colorScheme: 'blue' as const,
    items: [
      {
        name: 'Trucks',
        href: '/dashboard/trucks',
        icon: Truck,
        description: 'Manage your truck fleet including vehicle information, specifications, status, and assignments. Track truck numbers, VINs, license plates, equipment types, and current status.',
      },
      {
        name: 'Trailers',
        href: '/dashboard/trailers',
        icon: Container,
        description: 'Manage your trailer fleet including trailer numbers, types, specifications, and status. Track trailer assignments to trucks, ownership information, and current location.',
      },
      {
        name: 'Samsara Devices',
        href: '/dashboard/fleet/devices',
        icon: Wifi,
        description: 'Sync and manage Samsara-connected trucks and trailers. Review pending devices, approve new units, and link to existing TMS records. Track fault codes and odometer readings.',
      },
    ],
  },
  {
    title: 'Breakdowns & Maintenance',
    icon: AlertTriangle,
    colorScheme: 'red' as const,
    items: [
      {
        name: 'Active Dashboard',
        href: '/dashboard/fleet',
        icon: LayoutDashboard,
        description: 'Main Fleet Department dashboard with active cases, communications, team assignments, and analytics overview.',
      },
      {
        name: 'Diagnostics',
        href: '/dashboard/fleet/diagnostics',
        icon: Gauge,
        description: 'View and analyze vehicle fault codes from Samsara. Track diagnostic trends, get troubleshooting steps, monitor fleet health, and resolve issues proactively.',
      },
      {
        name: 'Maintenance',
        href: '/dashboard/fleet/maintenance',
        icon: Wrench,
        description: 'Schedule and track preventive maintenance (PM) for all vehicles to prevent breakdowns and ensure reliability. Create PM schedules based on mileage or time intervals.',
      },
      {
        name: 'Inspections',
        href: '/dashboard/fleet/inspections',
        icon: ClipboardCheck,
        description: 'Manage vehicle inspections including pre-trip inspections, post-trip inspections, and periodic safety inspections. Record inspection results, identify defects, and track inspection completion.',
      },
      {
        name: 'Knowledge Base',
        href: '/dashboard/fleet/knowledge-base',
        icon: BookOpen,
        description: 'Manage manuals, policies, and documents for AI Assistant contextual help.',
      },
    ],
  },
  {
    title: 'Operations',
    icon: MessageCircle,
    colorScheme: 'purple' as const,
    items: [
      {
        name: 'On-Call Schedule',
        href: '/dashboard/fleet/on-call',
        icon: Calendar,
        description: 'Manage 24/7 on-call staffing schedule for breakdown response and emergency support. Schedule on-call shifts, assign staff members, and track on-call coverage.',
      },
    ],
  },
  {
    title: 'Vendors & Reports',
    icon: Building2,
    colorScheme: 'yellow' as const,
    items: [
      {
        name: 'Vendors',
        href: '/dashboard/fleet/vendors',
        icon: Building2,
        description: 'Manage your network of service vendors including repair shops, towing companies, parts suppliers, and maintenance providers. Store vendor contact information, service areas, specialties, and pricing.',
      },
      {
        name: 'Reports',
        href: '/dashboard/fleet/reports',
        icon: BarChart3,
        description: 'Generate comprehensive fleet reports and analytics including breakdown reports, maintenance reports, cost analysis, and performance metrics. Create custom reports and export data for analysis.',
      },
    ],
  },
];

