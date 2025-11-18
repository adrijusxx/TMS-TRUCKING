import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, Truck, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import QuickActions from '@/components/dashboard/QuickActions';
import ActivityFeed from '@/components/activity/ActivityFeed';
import RecentLoads from '@/components/dashboard/RecentLoads';
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import RevenueTrends from '@/components/dashboard/RevenueTrends';
import LoadStatusDistribution from '@/components/dashboard/LoadStatusDistribution';
import DriverPerformanceSummary from '@/components/dashboard/DriverPerformanceSummary';
import TruckPerformanceSummary from '@/components/dashboard/TruckPerformanceSummary';
import CustomerPerformanceMetrics from '@/components/dashboard/CustomerPerformanceMetrics';
import { LoadStatus } from '@prisma/client';

// Mark this page as dynamic since it uses auth() which internally uses headers()
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function DashboardPage() {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return <div>Loading...</div>;
    }

  // Fetch dashboard stats
  const [
    totalLoads,
    activeLoads,
    totalDrivers,
    availableDrivers,
    totalTrucks,
    availableTrucks,
    revenueData,
  ] = await Promise.all([
    prisma.load.count({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
      },
    }),
    prisma.load.count({
      where: {
        companyId: session.user.companyId,
        status: {
          in: ['PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'],
        },
        deletedAt: null,
      },
    }),
    prisma.driver.count({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        deletedAt: null,
      },
    }),
    prisma.driver.count({
      where: {
        companyId: session.user.companyId,
        status: 'AVAILABLE',
        isActive: true,
        deletedAt: null,
      },
    }),
    prisma.truck.count({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        deletedAt: null,
      },
    }),
    prisma.truck.count({
      where: {
        companyId: session.user.companyId,
        status: 'AVAILABLE',
        isActive: true,
        deletedAt: null,
      },
    }),
    prisma.load.aggregate({
      where: {
        companyId: session.user.companyId,
        status: {
          in: ['DELIVERED', 'INVOICED', 'PAID'],
        },
        deletedAt: null,
      },
      _sum: {
        revenue: true,
      },
    }),
  ]);

  const totalRevenue = revenueData._sum.revenue || 0;

  const stats = [
    {
      title: 'Total Loads',
      value: totalLoads,
      description: `${activeLoads} active`,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Drivers',
      value: totalDrivers,
      description: `${availableDrivers} available`,
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Trucks',
      value: totalTrucks,
      description: `${availableTrucks} available`,
      icon: Truck,
      color: 'text-orange-600',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      description: 'All time',
      icon: DollarSign,
      color: 'text-emerald-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user?.name || 'User'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ActivityFeed filters={{ limit: 10 }} />
        <QuickActions />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RecentLoads />
        <UpcomingDeadlines />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RevenueTrends />
        <LoadStatusDistribution />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DriverPerformanceSummary />
        <TruckPerformanceSummary />
      </div>

      <div className="grid gap-4">
        <CustomerPerformanceMetrics />
      </div>
    </div>
  );
  } catch (error) {
    // Don't log Next.js build-time dynamic route warnings
    if (error instanceof Error && error.message.includes('Dynamic server usage')) {
      // This is a build-time warning, not a runtime error
      // Re-throw to let Next.js handle it properly
      throw error;
    }
    
    console.error('Dashboard error:', error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-destructive">Error Loading Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
      </div>
    );
  }
}

