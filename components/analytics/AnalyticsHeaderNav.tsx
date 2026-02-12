'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { analyticsNavItems } from './AnalyticsNav';
import { usePermissions } from '@/hooks/usePermissions';

export default function AnalyticsHeaderNav() {
    const pathname = usePathname();
    const { can } = usePermissions();

    return (
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[calc(100vw-200px)]">
            {analyticsNavItems.map((item) => {
                if (item.permission && !can(item.permission as any)) return null;

                const isActive = pathname === item.href ||
                    (item.href !== '/dashboard/analytics' && pathname?.startsWith(item.href));

                const Icon = item.icon;

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                            isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{item.name}</span>
                        {item.badge && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
