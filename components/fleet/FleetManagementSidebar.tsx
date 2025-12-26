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
  ClipboardCheck,
  Truck,
  Container,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Wifi,
  LayoutDashboard,
  Gauge,
  BarChart3,
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
  NAV_BORDERS,
  NAV_TOGGLE_BUTTONS,
  NAV_BACKGROUNDS,
} from '@/lib/navigation-constants';

// Navigation sections configuration - streamlined to avoid duplicates
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
        description: 'Manage your truck fleet including vehicle information, specifications, status, and assignments.',
      },
      {
        name: 'Trailers',
        href: '/dashboard/trailers',
        icon: Container,
        description: 'Manage your trailer fleet including trailer numbers, types, specifications, and status.',
      },
      {
        name: 'Samsara Devices',
        href: '/dashboard/fleet/devices',
        icon: Wifi,
        description: 'Review and approve Samsara devices before adding to TMS.',
      },
    ],
  },
  {
    title: 'Breakdown Management',
    icon: AlertTriangle,
    colorScheme: 'red' as const,
    items: [
      {
        name: 'Breakdown History',
        href: '/dashboard/fleet/breakdowns/history',
        icon: History,
        description: 'Complete historical record of all vehicle breakdowns and repairs.',
      },
      {
        name: 'Diagnostics',
        href: '/dashboard/fleet/diagnostics',
        icon: Gauge,
        description: 'View and analyze vehicle fault codes from Samsara.',
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
        href: '/dashboard/fleet?tab=maintenance',
        icon: Wrench,
        description: 'Schedule and track preventive maintenance (PM) for all vehicles.',
      },
      {
        name: 'Inspections',
        href: '/dashboard/fleet/inspections',
        icon: ClipboardCheck,
        description: 'Manage vehicle inspections including pre-trip, post-trip, and safety inspections.',
      },
    ],
  },
  {
    title: 'Operations',
    icon: MessageCircle,
    colorScheme: 'purple' as const,
    items: [
      {
        name: 'Telegram Messages',
        href: '/dashboard/telegram',
        icon: MessageCircle,
        description: 'View and send Telegram messages to drivers with AI-powered responses.',
      },
      {
        name: 'On-Call Schedule',
        href: '/dashboard/fleet/on-call',
        icon: Calendar,
        description: 'Manage 24/7 on-call staffing schedule for breakdown response and emergency support.',
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
        description: 'Manage your network of service vendors including repair shops, towing companies, and parts suppliers.',
      },
      {
        name: 'Reports & Analytics',
        href: '/dashboard/fleet/reports',
        icon: BarChart3,
        description: 'Generate comprehensive fleet reports and analytics.',
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

      {/* Dashboard Link */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard/fleet"
              className={cn(
                'flex items-center',
                NAV_SPACING.iconText,
                NAV_PADDING.trigger,
                NAV_ROUNDED.item,
                NAV_TYPOGRAPHY.item,
                NAV_STATES.transition,
                'mb-2',
                pathname === '/dashboard/fleet'
                  ? NAV_STATES.active
                  : 'bg-primary/10 hover:bg-primary/20 text-primary'
              )}
            >
              <LayoutDashboard className={cn(NAV_ICON_SIZES.item, 'flex-shrink-0')} />
              <span className={NAV_TYPOGRAPHY.truncate}>Dashboard</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className={cn('font-medium mb-1', NAV_TYPOGRAPHY.truncate)}>Fleet Dashboard</p>
            <p className={NAV_TYPOGRAPHY.description}>
              Main Fleet Department dashboard with active cases, inline editing, team assignments, payment tracking, and analytics overview.
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
