'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  History,
  Building2,
  Calendar,
  Wrench,
  DollarSign,
  MapPin,
  BarChart3,
  Plus,
  ClipboardCheck,
  Truck,
  Container,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import SafetyNavSection from '@/components/safety/SafetyNavSection';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  SIDEBAR_WIDTHS,
  NAV_PADDING,
  NAV_SPACING,
  NAV_ICON_SIZES,
  NAV_TYPOGRAPHY,
  NAV_STATES,
  NAV_ROUNDED,
  NAV_CLASSES,
  NAV_BORDERS,
  NAV_TOGGLE_BUTTONS,
  NAV_BACKGROUNDS,
} from '@/lib/navigation-constants';

// Navigation sections configuration
const navigationSections = [
  {
    title: 'Fleet Assets',
    icon: Truck,
    colorScheme: 'blue' as const,
    items: [
      {
        name: 'Trucks',
        href: '/dashboard/trucks',
        icon: Truck,
        description: 'Manage your truck fleet including vehicle information, specifications, status, and assignments. Track truck numbers, VINs, license plates, equipment types, and current status (available, in-use, maintenance, out-of-service). View truck history, maintenance records, and performance metrics. Add new trucks, update truck information, and manage truck assignments to drivers.',
      },
      {
        name: 'Trailers',
        href: '/dashboard/trailers',
        icon: Container,
        description: 'Manage your trailer fleet including trailer numbers, types, specifications, and status. Track trailer assignments to trucks, ownership information, and current location. Monitor trailer condition, maintenance history, and availability. Add new trailers, update trailer information, and manage trailer assignments for load planning.',
      },
    ],
  },
  {
    title: 'Breakdown Management',
    icon: AlertTriangle,
    colorScheme: 'red' as const,
    items: [
      {
        name: 'Active Breakdowns',
        href: '/dashboard/fleet/breakdowns',
        icon: AlertTriangle,
        description: 'Real-time dashboard showing all active vehicle breakdowns requiring immediate attention. View breakdown details including vehicle, driver, location, issue description, and status. Track breakdown resolution progress, assign service providers, and monitor repair timelines. Receive alerts for new breakdowns and track breakdown response times.',
      },
      {
        name: 'Breakdown History',
        href: '/dashboard/fleet/breakdowns/history',
        icon: History,
        description: 'Complete historical record of all vehicle breakdowns and repairs. Analyze breakdown patterns, identify recurring issues, and track breakdown frequency by vehicle, driver, or location. View breakdown costs, downtime, and resolution times. Generate breakdown reports for analysis and identify vehicles or components requiring attention.',
      },
      {
        name: 'Breakdown Hotspots',
        href: '/dashboard/fleet/hotspots',
        icon: MapPin,
        description: 'Geographic analysis of breakdown locations to identify problem areas and patterns. View breakdown hotspots on a map, analyze location-based breakdown trends, and identify routes or areas with high breakdown frequency. Use hotspot data to plan routes, select service providers, and improve fleet reliability.',
      },
      {
        name: 'Cost Tracking',
        href: '/dashboard/fleet/costs',
        icon: DollarSign,
        description: 'Track and analyze breakdown costs including repair costs, towing fees, parts, labor, and downtime costs. Monitor cost trends, identify high-cost breakdowns, and analyze cost by vehicle, component, or breakdown type. Generate cost reports, track cost per mile, and use cost data for budgeting and fleet management decisions.',
      },
    ],
  },
  {
    title: 'Maintenance & Inspections',
    icon: Wrench,
    colorScheme: 'green' as const,
    items: [
      {
        name: 'Preventive Maintenance',
        href: '/dashboard/fleet/maintenance',
        icon: Wrench,
        description: 'Schedule and track preventive maintenance (PM) for all vehicles to prevent breakdowns and ensure reliability. Create PM schedules based on mileage or time intervals, track PM completion, and receive alerts for upcoming PM services. Monitor PM history, track maintenance costs, and ensure vehicles receive timely maintenance to extend vehicle life and reduce breakdowns.',
      },
      {
        name: 'Inspections',
        href: '/dashboard/fleet/inspections',
        icon: ClipboardCheck,
        description: 'Manage vehicle inspections including pre-trip inspections, post-trip inspections, and periodic safety inspections. Record inspection results, identify defects, and track inspection completion. Monitor inspection schedules, ensure compliance with inspection requirements, and maintain inspection history. Generate inspection reports and track inspection trends.',
      },
    ],
  },
  {
    title: 'Operations & Communication',
    icon: MessageCircle,
    colorScheme: 'purple' as const,
    items: [
      {
        name: 'Fleet Board',
        href: '/dashboard/fleet-board',
        icon: BarChart3,
        description: 'Comprehensive fleet overview dashboard showing real-time status of all vehicles and drivers. View vehicle locations, status, assignments, and key metrics. Monitor fleet utilization, identify available resources, and make quick dispatch decisions. Track fleet performance, view alerts, and access quick actions for fleet management.',
      },
      {
        name: 'Communication Hub',
        href: '/dashboard/fleet/communications',
        icon: MessageCircle,
        description: 'Centralized communication hub for all driver communications including messages, alerts, and notifications. Send messages to drivers, receive driver updates, and track communication history. Monitor driver responses, send broadcast messages, and maintain communication logs. Ensure effective communication between dispatch and drivers.',
      },
      {
        name: 'On-Call Schedule',
        href: '/dashboard/fleet/on-call',
        icon: Calendar,
        description: 'Manage 24/7 on-call staffing schedule for breakdown response and emergency support. Schedule on-call shifts, assign staff members, and track on-call coverage. Receive alerts for on-call assignments, view on-call history, and ensure continuous coverage. Manage shift rotations and track on-call response times.',
      },
    ],
  },
  {
    title: 'Vendors & Reports',
    icon: Building2,
    colorScheme: 'yellow' as const,
    items: [
      {
        name: 'Vendor Directory',
        href: '/dashboard/fleet/vendors',
        icon: Building2,
        description: 'Manage your network of service vendors including repair shops, towing companies, parts suppliers, and maintenance providers. Store vendor contact information, service areas, specialties, and pricing. Track vendor performance, ratings, and response times. Assign vendors to breakdowns, track vendor costs, and maintain vendor relationships for efficient breakdown resolution.',
      },
      {
        name: 'Reports & Analytics',
        href: '/dashboard/fleet/reports',
        icon: BarChart3,
        description: 'Generate comprehensive fleet reports and analytics including breakdown reports, maintenance reports, cost analysis, and performance metrics. Create custom reports, export data for analysis, and track fleet trends over time. Analyze vehicle reliability, maintenance costs, breakdown patterns, and fleet utilization. Use reports for management reviews and fleet optimization decisions.',
      },
    ],
  },
];

export default function FleetManagementSidebar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load sidebar preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fleetSidebarOpen');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }
  }, []);

  // Save sidebar preference to localStorage
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('fleetSidebarOpen', String(newState));
  };

  if (!sidebarOpen) {
    return (
      <div className={cn(SIDEBAR_WIDTHS.collapsed, 'border-r', NAV_BACKGROUNDS.sidebar, 'p-2 flex flex-col items-center')}>
        <Button
          variant="ghost"
          size="icon"
          className={NAV_TOGGLE_BUTTONS.collapsed}
          onClick={toggleSidebar}
          title="Show sidebar"
        >
          <ChevronRight className={NAV_ICON_SIZES.chevron} />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(SIDEBAR_WIDTHS.expanded, 'h-full border-r', NAV_BACKGROUNDS.sidebar, 'overflow-y-auto p-4', NAV_SPACING.sections)}>
      <div className={cn(NAV_BORDERS.header, 'pb-3 mb-3')}>
        <div className="flex items-center justify-between mb-1">
          <div className={cn('flex items-center', NAV_SPACING.iconText)}>
            <Truck className={cn(NAV_ICON_SIZES.section, 'text-primary')} />
            <h2 className={cn(NAV_TYPOGRAPHY.sectionHeader, NAV_TYPOGRAPHY.truncate)}>
              Fleet Department
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={NAV_TOGGLE_BUTTONS.expanded}
            onClick={toggleSidebar}
            title="Hide sidebar"
          >
            <ChevronLeft className={NAV_ICON_SIZES.chevron} />
          </Button>
        </div>
        <p className={cn(NAV_TYPOGRAPHY.description, NAV_TYPOGRAPHY.truncate)}>
          Breakdown & maintenance
        </p>
      </div>

      {/* Quick Entry */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard/fleet/breakdowns"
              className={cn(
                'flex items-center',
                NAV_SPACING.iconText,
                NAV_PADDING.trigger,
                NAV_ROUNDED.item,
                NAV_TYPOGRAPHY.item,
                NAV_STATES.transition,
                'mb-2',
                pathname === '/dashboard/fleet/breakdowns'
                  ? NAV_STATES.active
                  : 'bg-background hover:bg-muted'
              )}
            >
              <Plus className={cn(NAV_ICON_SIZES.item, 'flex-shrink-0')} />
              <span className={NAV_TYPOGRAPHY.truncate}>Quick Entry</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className={cn('font-medium mb-1', NAV_TYPOGRAPHY.truncate)}>Quick Entry</p>
            <p className={NAV_TYPOGRAPHY.description}>
              Quick entry form to rapidly record new vehicle breakdowns. Enter breakdown details including vehicle, driver, location, and issue description. Quickly assign service providers and create breakdown records for immediate tracking and resolution.
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Collapsible sections */}
        {navigationSections.map((section) => (
          <SafetyNavSection
            key={section.title}
            title={section.title}
            items={section.items}
            icon={section.icon}
            colorScheme={section.colorScheme}
          />
        ))}
      </TooltipProvider>
    </div>
  );
}
