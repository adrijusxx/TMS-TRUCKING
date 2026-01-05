'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, Truck, Package, DollarSign, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Summary {
    totalDrivers: number;
    driversAvailable: number;
    driversOnRoute: number;
    totalActiveLoads: number;
    totalRevenue30Days: number;
}

interface DispatchSummaryStatsProps {
    summary: Summary;
}

export default function DispatchSummaryStats({ summary }: DispatchSummaryStatsProps) {
    const stats = [
        {
            label: 'Total Drivers',
            value: summary.totalDrivers,
            icon: Users,
            color: 'text-blue-500',
        },
        {
            label: 'Available',
            value: summary.driversAvailable,
            icon: CheckCircle,
            color: 'text-green-500',
        },
        {
            label: 'On Route',
            value: summary.driversOnRoute,
            icon: Truck,
            color: 'text-orange-500',
        },
        {
            label: 'Active Loads',
            value: summary.totalActiveLoads,
            icon: Package,
            color: 'text-purple-500',
        },
        {
            label: '30-Day Revenue',
            value: formatCurrency(summary.totalRevenue30Days),
            icon: DollarSign,
            color: 'text-emerald-500',
            isLarge: true,
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.label} className="bg-card/50">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                                <span className="text-xs text-muted-foreground truncate">
                                    {stat.label}
                                </span>
                            </div>
                            <div className={`font-bold mt-1 ${stat.isLarge ? 'text-lg' : 'text-xl'}`}>
                                {stat.value}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
