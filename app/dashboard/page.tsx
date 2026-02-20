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
import TodayAtAGlance from '@/components/dashboard/TodayAtAGlance';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { PageTransition } from '@/components/ui/page-transition';
import OnboardingGuide from '@/components/dashboard/OnboardingGuide';
import { LoadStatus } from '@prisma/client';
import { buildMcNumberWhereClause, buildMcNumberIdWhereClause, getCurrentMcNumber } from '@/lib/mc-number-filter';
import { cookies } from 'next/headers';
import { getLoadFilter, getDriverFilter, getTruckFilter, createFilterContext } from '@/lib/filters/role-data-filter';

// Mark this page as dynamic since it uses auth() which internally uses headers()
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function DashboardPage() {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return <div>Loading...</div>;
    }

    // Build filters with MC number if applicable
    // Load uses mcNumber (string), Driver and Truck use mcNumberId (relation)
    const cookieStore = await cookies();
    const requestCookies = {
      get: (name: string) => cookieStore.get(name) || null,
    } as any;

    // Get MC number for role filtering (for drivers/trucks which use mcNumberId relation)
    const { mcNumberId } = await getCurrentMcNumber(session, requestCookies);

    // Apply role-based filtering
    // Note: Loads use mcNumber (string), so MC filtering is handled in baseLoadFilter
    const roleLoadFilter = await getLoadFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        session.user.companyId
      )
    );

    // Drivers use mcNumberId (relation), so pass it for driver filtering
    const roleDriverFilter = await getDriverFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        session.user.companyId,
        mcNumberId ?? undefined
      )
    );

    // Merge MC filters with role filters
    const baseLoadFilter = await buildMcNumberWhereClause(session, requestCookies);
    const baseDriverTruckFilter = await buildMcNumberIdWhereClause(session, requestCookies);

    const loadFilter = { ...baseLoadFilter, ...roleLoadFilter };
    const driverFilter = { ...baseDriverTruckFilter, ...roleDriverFilter };

    // Get truck filter separately (trucks don't have assignedDispatcherId)
    const roleTruckFilter = getTruckFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        session.user.companyId,
        mcNumberId ?? undefined
      )
    );
    const truckFilter = { ...baseDriverTruckFilter, ...roleTruckFilter };

    // Date boundaries for "Today at a Glance"
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Fetch dashboard stats
    const [
      totalLoads,
      activeLoads,
      totalDrivers,
      availableDrivers,
      totalTrucks,
      availableTrucks,
      revenueData,
      deliveriesToday,
      openInvoicesData,
      expiringMedicalCards,
      expiringCDLs,
    ] = await Promise.all([
      prisma.load.count({
        where: {
          ...loadFilter,
          deletedAt: null,
        },
      }),
      prisma.load.count({
        where: {
          ...loadFilter,
          status: {
            in: ['PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'],
          },
          deletedAt: null,
        },
      }),
      prisma.driver.count({
        where: {
          ...driverFilter,
          isActive: true,
          deletedAt: null,
        },
      }),
      prisma.driver.count({
        where: {
          ...driverFilter,
          status: 'AVAILABLE',
          isActive: true,
          deletedAt: null,
        },
      }),
      prisma.truck.count({
        where: {
          ...truckFilter,
          isActive: true,
          deletedAt: null,
        },
      }),
      prisma.truck.count({
        where: {
          ...truckFilter,
          status: 'AVAILABLE',
          isActive: true,
          deletedAt: null,
        },
      }),
      prisma.load.aggregate({
        where: {
          ...loadFilter,
          status: { not: 'CANCELLED' },
          deletedAt: null,
        },
        _sum: {
          revenue: true,
        },
      }),
      // Deliveries due today
      prisma.load.count({
        where: {
          ...loadFilter,
          deliveryDate: { gte: todayStart, lt: todayEnd },
          deletedAt: null,
        },
      }),
      // Open invoices (not paid or cancelled)
      prisma.invoice.aggregate({
        where: {
          companyId: session.user.companyId,
          status: { notIn: ['PAID', 'CANCELLED'] },
        },
        _count: { id: true },
        _sum: { balance: true },
      }),
      // Medical cards expiring within 30 days
      prisma.medicalCard.count({
        where: {
          companyId: session.user.companyId,
          expirationDate: { gte: now, lte: thirtyDaysFromNow },
        },
      }),
      // CDLs expiring within 30 days
      prisma.cDLRecord.count({
        where: {
          companyId: session.user.companyId,
          expirationDate: { gte: now, lte: thirtyDaysFromNow },
        },
      }),
    ]);

    const totalRevenue = revenueData._sum.revenue || 0;
    const openInvoicesCount = openInvoicesData._count.id ?? 0;
    const openInvoicesBalance = openInvoicesData._sum.balance ?? 0;
    const expiringDocsCount = expiringMedicalCards + expiringCDLs;

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
      <div className="space-y-4 sm:space-y-6">
        <Breadcrumb items={[{ label: 'Dashboard' }]} />
        <PageTransition>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">Dashboard</h1>
        </div>

        {/* Onboarding Guide for New Users */}
        <OnboardingGuide />

        {/* Today at a Glance */}
        <TodayAtAGlance
          activeLoads={activeLoads}
          deliveriesToday={deliveriesToday}
          openInvoicesCount={openInvoicesCount}
          openInvoicesBalance={openInvoicesBalance}
          availableDrivers={availableDrivers}
          expiringDocsCount={expiringDocsCount}
        />

        {/* Overview Statistics Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base sm:text-xl font-semibold mb-1">Overview</h2>
            <p className="text-sm text-muted-foreground">Key metrics at a glance</p>
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
        </section>

        {/* Quick Actions Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base sm:text-xl font-semibold mb-1">Quick Actions</h2>
            <p className="text-sm text-muted-foreground">Common tasks and shortcuts</p>
          </div>
          <div className="grid gap-4 md:grid-cols-1">
            <QuickActions />
          </div>
        </section>

        {/* Loads & Operations Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base sm:text-xl font-semibold mb-1">Loads & Operations</h2>
            <p className="text-sm text-muted-foreground">Current loads and operational status</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <RecentLoads />
            <UpcomingDeadlines />
          </div>
        </section>

        {/* Financial Performance Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base sm:text-xl font-semibold mb-1">Financial Performance</h2>
            <p className="text-sm text-muted-foreground">Revenue trends and financial metrics</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <RevenueTrends />
            <LoadStatusDistribution />
          </div>
        </section>

        {/* Fleet & Personnel Performance Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base sm:text-xl font-semibold mb-1">Fleet & Personnel Performance</h2>
            <p className="text-sm text-muted-foreground">Driver and truck performance metrics</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <DriverPerformanceSummary />
            <TruckPerformanceSummary />
          </div>
        </section>

        {/* Customer Performance Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base sm:text-xl font-semibold mb-1">Customer Performance</h2>
            <p className="text-sm text-muted-foreground">Customer metrics and relationship insights</p>
          </div>
          <div className="grid gap-4">
            <CustomerPerformanceMetrics />
          </div>
        </section>

        {/* Activity Feed Section - Admin Only */}
        {session.user?.role === 'ADMIN' && (
          <section className="space-y-4 mt-8 border-t pt-6">
            <div>
              <h2 className="text-base sm:text-xl font-semibold mb-1">Activity Feed</h2>
              <p className="text-sm text-muted-foreground">Recent system activity and user actions</p>
            </div>
            <div className="grid gap-4">
              <ActivityFeed filters={{ limit: 20 }} />
            </div>
          </section>
        )}
        </PageTransition>
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

