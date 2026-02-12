'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    TrendingUp,
    Map,
    Users,
    Fuel,
    TrendingDown,
    LineChart,
    Target,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const hubItems = [
    {
        title: 'Deep Insights',
        href: '/dashboard/analytics/deep-insights',
        icon: Target,
        description: 'AI-driven analysis of staffing, costs, and operational opportunities.',
        color: 'text-purple-600',
        bg: 'bg-purple-100',
        badge: 'NEW'
    },
    {
        title: 'Profitability',
        href: '/dashboard/analytics/profitability',
        icon: TrendingUp,
        description: 'Comprehensive financial breakdown by load, truck, and driver.',
        color: 'text-green-600',
        bg: 'bg-green-100'
    },
    {
        title: 'Driver Performance',
        href: '/dashboard/analytics/drivers',
        icon: Users,
        description: 'Track driver revenue, efficiency, and safety metrics.',
        color: 'text-blue-600',
        bg: 'bg-blue-100'
    },
    {
        title: 'Lane Analysis',
        href: '/dashboard/analytics/lanes',
        icon: Map,
        description: 'Identify your most profitable routes and regions.',
        color: 'text-orange-600',
        bg: 'bg-orange-100'
    },
    {
        title: 'Fuel Analysis',
        href: '/dashboard/analytics/fuel',
        icon: Fuel,
        description: 'Monitor fuel consumption and efficiency trends.',
        color: 'text-red-600',
        bg: 'bg-red-100'
    },
    {
        title: 'Revenue Forecast',
        href: '/dashboard/analytics/revenue-forecast',
        icon: LineChart,
        description: 'Project future earnings based on historical data.',
        color: 'text-indigo-600',
        bg: 'bg-indigo-100'
    },
];

export default function AnalyticsNavigationCards() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hubItems.map((item) => (
                <Link key={item.href} href={item.href} className="block group">
                    <Card className="h-full transition-all hover:shadow-md border-muted/60 hover:border-primary/20">
                        <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                            <div className={cn("p-2 rounded-lg mr-3", item.bg)}>
                                <item.icon className={cn("h-5 w-5", item.color)} />
                            </div>
                            <div className="flex-1 space-y-1">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    {item.title}
                                    {item.badge && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                            {item.badge}
                                        </span>
                                    )}
                                </CardTitle>
                                <CardDescription className="text-xs line-clamp-2">
                                    {item.description}
                                </CardDescription>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </CardHeader>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
