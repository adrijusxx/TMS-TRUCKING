'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, LayoutGrid, Settings, ClipboardCheck, BarChart3, Megaphone } from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard/crm', icon: LayoutDashboard },
    { name: 'Leads', href: '/dashboard/crm/leads', icon: Users },
    { name: 'Kanban', href: '/dashboard/crm/kanban', icon: LayoutGrid },
    { name: 'Onboarding', href: '/dashboard/crm/onboarding', icon: ClipboardCheck },
    { name: 'Reports', href: '/dashboard/crm/reports', icon: BarChart3 },
    { name: 'Campaigns', href: '/dashboard/crm/campaigns', icon: Megaphone },
    { name: 'Settings', href: '/dashboard/crm/settings', icon: Settings },
];

export default function CRMHeaderNav() {
    const pathname = usePathname();

    return (
        <nav className="flex items-center gap-1">
            {navItems.map((item) => {
                const isActive = pathname === item.href ||
                    (item.href !== '/dashboard/crm' && pathname?.startsWith(item.href));

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                            isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{item.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
