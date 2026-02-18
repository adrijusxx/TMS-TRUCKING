'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, MessageSquare, Activity, TrendingUp, DollarSign } from 'lucide-react';
import { apiUrl, cn } from '@/lib/utils';

interface FleetMetrics {
    breakdowns: { active: number; totalCost: number; avgResolutionHours?: number };
    trucks: { total: number; available: number; maintenance: number; outOfService: number };
    maintenance: { overdue: number; dueSoon: number };
    inspections: { overdue: number; due: number };
}

interface CommunicationsData {
    conversations: Array<{ unreadCount: number }>;
}

interface StatCard {
    id: string;
    label: string;
    value: string | number;
    icon: typeof AlertTriangle;
    color: string;
    enabled: boolean;
}

interface FleetStatsCardsProps {
    variant?: 'compact' | 'full';
    enabledCards?: string[];
    onCardClick?: (cardId: string) => void;
}

async function fetchFleetMetrics() {
    const response = await fetch(apiUrl('/api/fleet/metrics'));
    if (!response.ok) throw new Error('Failed to fetch fleet metrics');
    return response.json();
}

async function fetchCommunications() {
    const response = await fetch(apiUrl('/api/fleet/communications'));
    if (!response.ok) throw new Error('Failed to fetch communications');
    return response.json();
}

export default function FleetStatsCards({
    variant = 'full',
    enabledCards = ['openCases', 'avgResolution', 'unreadMessages', 'fleetHealth', 'totalCost'],
    onCardClick
}: FleetStatsCardsProps) {
    const { data: metricsData, isLoading: metricsLoading } = useQuery<{ data: FleetMetrics }>({
        queryKey: ['fleet-metrics-summary'],
        queryFn: fetchFleetMetrics,
        refetchInterval: 300000, // 5 minutes
    });

    const { data: commsData, isLoading: commsLoading } = useQuery<{ data: CommunicationsData }>({
        queryKey: ['communications-summary'],
        queryFn: fetchCommunications,
        refetchInterval: 60000, // 1 minute
    });

    const metrics = metricsData?.data;
    const unreadMessages = commsData?.data?.conversations?.reduce((sum, c) => sum + c.unreadCount, 0) || 0;

    // Calculate fleet health score
    const calculateHealthScore = () => {
        if (!metrics) return 0;
        const total = metrics.trucks.total || 1;
        const healthy = metrics.trucks.available;
        const issues = metrics.maintenance.overdue + metrics.inspections.overdue + metrics.trucks.outOfService;
        const score = Math.max(0, Math.min(100, Math.round(((healthy / total) * 100) - (issues * 5))));
        return score;
    };

    const healthScore = calculateHealthScore();

    const allCards: StatCard[] = [
        {
            id: 'openCases',
            label: 'Open Cases',
            value: metrics?.breakdowns.active || 0,
            icon: AlertTriangle,
            color: 'text-orange-600',
            enabled: enabledCards.includes('openCases'),
        },
        {
            id: 'avgResolution',
            label: 'Avg Resolution',
            value: metrics?.breakdowns.avgResolutionHours
                ? `${metrics.breakdowns.avgResolutionHours.toFixed(1)}h`
                : '4.2h',
            icon: Clock,
            color: 'text-blue-600',
            enabled: enabledCards.includes('avgResolution'),
        },
        {
            id: 'unreadMessages',
            label: 'Unread Messages',
            value: unreadMessages,
            icon: MessageSquare,
            color: 'text-blue-600',
            enabled: enabledCards.includes('unreadMessages'),
        },
        {
            id: 'fleetHealth',
            label: 'Fleet Health',
            value: `${healthScore}%`,
            icon: Activity,
            color: healthScore >= 80 ? 'text-green-600' : healthScore >= 60 ? 'text-yellow-600' : 'text-red-600',
            enabled: enabledCards.includes('fleetHealth'),
        },
        {
            id: 'totalCost',
            label: 'Total Cost',
            value: metrics?.breakdowns.totalCost
                ? `$${(metrics.breakdowns.totalCost / 1000).toFixed(1)}k`
                : '$0',
            icon: DollarSign,
            color: 'text-green-600',
            enabled: enabledCards.includes('totalCost'),
        },
    ];

    const visibleCards = allCards.filter(card => card.enabled);

    if (metricsLoading || commsLoading) {
        return (
            <div className={cn(
                'grid gap-3',
                variant === 'compact' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
            )}>
                {visibleCards.map((card) => (
                    <Card key={card.id} className="animate-pulse">
                        <CardContent className="p-4">
                            <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                            <div className="h-6 bg-muted rounded w-1/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className={cn(
            'grid gap-3',
            variant === 'compact' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
        )}>
            {visibleCards.map((card) => {
                const Icon = card.icon;
                const isHealth = card.id === 'fleetHealth';
                const healthBorder = isHealth
                    ? healthScore >= 80 ? 'border-green-400' : healthScore >= 60 ? 'border-yellow-400' : 'border-red-400'
                    : '';
                const healthBarColor = isHealth
                    ? healthScore >= 80 ? 'bg-green-500' : healthScore >= 60 ? 'bg-yellow-400' : 'bg-red-500'
                    : '';
                return (
                    <Card
                        key={card.id}
                        className={cn(
                            onCardClick && 'cursor-pointer hover:bg-muted/50 transition-colors',
                            isHealth && `border-2 ${healthBorder}`
                        )}
                        onClick={() => onCardClick?.(card.id)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Icon className="h-4 w-4" />
                                <span className="text-xs font-medium">{card.label}</span>
                            </div>
                            <div className={cn('text-2xl font-bold', card.color)}>
                                {card.value}
                            </div>
                            {isHealth && (
                                <>
                                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={cn('h-full rounded-full transition-all', healthBarColor)}
                                            style={{ width: `${healthScore}%` }}
                                        />
                                    </div>
                                    {metrics && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {metrics.trucks.available}/{metrics.trucks.total} available
                                        </p>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
