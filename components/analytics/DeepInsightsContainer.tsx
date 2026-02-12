'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiUrl } from '@/lib/utils';
import StaffingInsights from './StaffingInsights';
import CostOptimizationInsights from './CostOptimizationInsights';
import { BarChart3, Users, Lightbulb } from 'lucide-react';

async function fetchDeepInsights() {
    const response = await fetch(apiUrl('/api/analytics/deep-insights'));
    if (!response.ok) throw new Error('Failed to fetch deep insights');
    const result = await response.json();
    return result.data;
}

export default function DeepInsightsContainer() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['deep-insights'],
        queryFn: fetchDeepInsights,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="pt-6">
                    <p className="text-destructive">Failed to load deep insights. Please try again.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Tabs defaultValue="cost" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cost" className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    <span className="hidden sm:inline">Cost & Revenue Analysis</span>
                    <span className="sm:hidden">Costs</span>
                </TabsTrigger>
                <TabsTrigger value="staffing" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Staffing Recommendations</span>
                    <span className="sm:hidden">Staffing</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="cost" className="space-y-6">
                <CostOptimizationInsights
                    kpis={data.kpis}
                    monthly={data.monthly}
                    costInsights={data.costInsights}
                    totalTrucks={data.overview.totalTrucks}
                    totalDrivers={data.overview.totalDrivers}
                />
            </TabsContent>

            <TabsContent value="staffing" className="space-y-6">
                <StaffingInsights
                    staffing={data.staffing}
                    totalTrucks={data.overview.totalTrucks}
                    totalDrivers={data.overview.totalDrivers}
                    totalUsers={data.overview.totalUsers}
                />
            </TabsContent>
        </Tabs>
    );
}
