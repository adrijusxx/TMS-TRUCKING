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
} from 'lucide-react';

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
        name: 'Active Breakdowns',
        href: '/dashboard/fleet/breakdowns',
        icon: AlertTriangle,
        description: 'Real-time dashboard showing all active vehicle breakdowns requiring immediate attention. Includes Quick Entry button and tabs for History, Hotspots, and Cost Tracking.',
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
    ],
  },
  {
    title: 'Operations',
    icon: MessageCircle,
    colorScheme: 'purple' as const,
    items: [
      {
        name: 'Fleet Board',
        href: '/dashboard/fleet-board',
        icon: BarChart3,
        description: 'Comprehensive fleet overview dashboard showing real-time status of all vehicles and drivers. View vehicle locations, status, assignments, and key metrics.',
      },
      {
        name: 'Communication Hub',
        href: '/dashboard/fleet/communications',
        icon: MessageCircle,
        description: 'Centralized communication hub for all driver communications including messages, alerts, and notifications. Send messages to drivers, receive driver updates, and track communication history.',
      },
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

