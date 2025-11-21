'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  History,
  Building2,
  Calendar,
  Wrench,
  DollarSign,
  MapPin,
  BarChart3,
  Phone,
  ClipboardCheck,
  Truck,
  Plus,
  Container,
  MessageCircle,
} from 'lucide-react';

const fleetNavigation = [
  {
    name: 'Trucks',
    href: '/dashboard/trucks',
    icon: Truck,
    description: 'Manage truck fleet',
  },
  {
    name: 'Trailers',
    href: '/dashboard/trailers',
    icon: Container,
    description: 'Manage trailer fleet',
  },
  {
    name: 'Active Breakdowns',
    href: '/dashboard/fleet/breakdowns',
    icon: AlertTriangle,
    description: 'Real-time breakdown dashboard',
  },
  {
    name: 'Breakdown History',
    href: '/dashboard/fleet/breakdowns/history',
    icon: History,
    description: 'Complete breakdown history',
  },
  {
    name: 'Vendor Directory',
    href: '/dashboard/fleet/vendors',
    icon: Building2,
    description: 'Service vendor network',
  },
  {
    name: 'Preventive Maintenance',
    href: '/dashboard/fleet/maintenance',
    icon: Wrench,
    description: 'PM scheduling and tracking',
  },
  {
    name: 'Inspections',
    href: '/dashboard/fleet/inspections',
    icon: ClipboardCheck,
    description: 'Pre-trip and safety inspections',
  },
  {
    name: 'Cost Tracking',
    href: '/dashboard/fleet/costs',
    icon: DollarSign,
    description: 'Breakdown cost analysis',
  },
  {
    name: 'Breakdown Hotspots',
    href: '/dashboard/fleet/hotspots',
    icon: MapPin,
    description: 'Geographic analysis',
  },
  {
    name: 'Reports & Analytics',
    href: '/dashboard/fleet/reports',
    icon: BarChart3,
    description: 'Comprehensive reports',
  },
  {
    name: 'On-Call Schedule',
    href: '/dashboard/fleet/on-call',
    icon: Calendar,
    description: '24/7 staffing schedule',
  },
  {
    name: 'Fleet Board',
    href: '/dashboard/fleet-board',
    icon: BarChart3,
    description: 'Fleet overview dashboard',
  },
  {
    name: 'Communication Hub',
    href: '/dashboard/fleet/communications',
    icon: MessageCircle,
    description: 'All driver communications',
  },
];

export default function FleetManagementSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-full border-r bg-muted/30 overflow-y-auto p-3 space-y-2">
      <div className="mb-3 pb-3 border-b">
        <div className="flex items-center gap-2 mb-1">
          <Truck className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-base">Fleet Department</h2>
        </div>
        <p className="text-xs text-muted-foreground">Breakdown & maintenance</p>
      </div>

      <Link
        href="/dashboard/fleet/breakdowns"
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-2',
          pathname === '/dashboard/fleet/breakdowns'
            ? 'bg-primary text-primary-foreground'
            : 'bg-background hover:bg-muted'
        )}
      >
        <Plus className="h-4 w-4" />
        Quick Entry
      </Link>

      <div className="pt-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Navigation
        </div>
        <nav className="space-y-0.5">
          {fleetNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors group',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                )}
                title={item.description}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                <span className="font-medium truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

