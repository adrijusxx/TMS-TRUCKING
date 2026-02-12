import {
    BarChart3,
    TrendingUp,
    Map,
    Users,
    Fuel,
    TrendingDown,
    LineChart,
    Target
} from 'lucide-react';

export interface NavItem {
    name: string;
    href: string;
    icon: any;
    permission?: string;
    badge?: string;
}

export const analyticsNavItems: NavItem[] = [
    {
        name: 'Overview',
        href: '/dashboard/analytics',
        icon: BarChart3,
        permission: 'analytics.view'
    },
    {
        name: 'Profitability',
        href: '/dashboard/analytics/profitability',
        icon: TrendingUp,
        permission: 'analytics.view'
    },
    {
        name: 'Lane Analysis',
        href: '/dashboard/analytics/lanes',
        icon: Map,
        permission: 'analytics.view'
    },
    {
        name: 'Driver Performance',
        href: '/dashboard/analytics/drivers',
        icon: Users,
        permission: 'analytics.view'
    },
    {
        name: 'Fuel Analysis',
        href: '/dashboard/analytics/fuel',
        icon: Fuel,
        permission: 'analytics.view'
    },
    {
        name: 'Revenue Forecast',
        href: '/dashboard/analytics/revenue-forecast',
        icon: LineChart,
        permission: 'analytics.view'
    },
    {
        name: 'Empty Miles',
        href: '/dashboard/analytics/empty-miles',
        icon: TrendingDown,
        permission: 'analytics.view'
    },
    {
        name: 'Deep Insights',
        href: '/dashboard/analytics/deep-insights',
        icon: Target,
        permission: 'analytics.view',
        badge: 'NEW'
    }
];
