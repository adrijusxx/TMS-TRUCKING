'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Users,
  Shield,
  CreditCard,
  Plug,
  RefreshCw,
  FileText,
  Hash,
  ShoppingBag,
  DollarSign,
  Calculator,
  Palette,
  Tag,
  FolderTree,
  FileCheck,
  ChartBar,
  Layers,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useSidebarToggle } from '@/hooks/useSidebarToggle';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  query?: string;
}

const navItems: NavItem[] = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Team Management', href: '/dashboard/settings', icon: Users, query: 'tab=team' },
  { name: 'Permissions & Roles', href: '/dashboard/settings', icon: Shield, query: 'tab=security' },
  { name: 'Billing & Subscription', href: '/dashboard/settings', icon: CreditCard, query: 'tab=billing' },
  { name: 'Integrations', href: '/dashboard/settings', icon: Plug, query: 'tab=integrations' },
  { name: 'EDI', href: '/dashboard/edi', icon: FileText },
  { name: 'MC numbers', href: '/dashboard/mc-numbers', icon: Hash },
  { name: 'Apps & Marketplace', href: '/dashboard/apps/marketplace', icon: ShoppingBag },
  { name: 'Dynamic statuses', href: '/dashboard/settings/customizations/statuses', icon: Palette },
  { name: 'Tag management', href: '/dashboard/settings/customizations/tags', icon: Tag },
  { name: 'Classifications', href: '/dashboard/settings/customizations/classifications', icon: FolderTree },
  { name: 'Templates', href: '/dashboard/settings/customizations/templates', icon: FileText },
  { name: 'Default configurations', href: '/dashboard/settings/customizations/defaults', icon: Settings },
  { name: 'Task Management Projects', href: '/dashboard/settings/customizations/tasks', icon: Layers },
];

export default function SettingsNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isOpen, toggle } = useSidebarToggle('settingsNavOpen', true);

  const isActive = (item: NavItem) => {
    // For settings pages with query params
    if (item.href === '/dashboard/settings' && item.query) {
      const currentTab = searchParams.get('tab');
      const expectedTab = item.query.split('=')[1];
      return pathname === item.href && currentTab === expectedTab;
    }
    
    // For settings page without query (default)
    if (item.href === '/dashboard/settings' && !item.query) {
      const currentTab = searchParams.get('tab');
      return pathname === item.href && (!currentTab || currentTab === 'general');
    }
    
    // For other pages
    return pathname === item.href || pathname?.startsWith(item.href + '/');
  };

  const handleNavigation = (item: NavItem) => {
    if (item.query) {
      router.push(`${item.href}?${item.query}`);
    } else {
      router.push(item.href);
    }
  };

  if (!isOpen) {
    return (
      <div className="w-12 border-r bg-card p-2 flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggle}
          title="Show sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-56 border-r bg-card p-2">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
          Settings
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={toggle}
          title="Hide sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <nav className="space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item)}
              className={cn(
                'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:bg-accent hover:text-foreground'
              )}
            >
              <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.name}</span>
              </div>
              {active && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
