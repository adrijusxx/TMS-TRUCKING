import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PageTransition } from '@/components/ui/page-transition';
import { LoadingState } from '@/components/ui/loading-state';
import { buildMcNumberWhereClause, buildMcNumberIdWhereClause, getCurrentMcNumber } from '@/lib/mc-number-filter';
import { cookies } from 'next/headers';
import { getLoadFilter, getDriverFilter, getTruckFilter, createFilterContext } from '@/lib/filters/role-data-filter';

// Mark this page as dynamic since it uses auth() which internally uses headers()
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Fetches all dashboard stats — extracted so it can be wrapped in Suspense */
async function DashboardStats() {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  // Build filters with MC number if applicable
  const cookieStore = await cookies();
  const requestCookies = {
    get: (name: string) => cookieStore.get(name) || null,
  } as any;

  const { mcNumberId } = await getCurrentMcNumber(session, requestCookies);

  const roleLoadFilter = await getLoadFilter(
    createFilterContext(session.user.id, session.user.role as any, session.user.companyId)
  );
  const roleDriverFilter = await getDriverFilter(
    createFilterContext(session.user.id, session.user.role as any, session.user.companyId, mcNumberId ?? undefined)
  );
  const baseLoadFilter = await buildMcNumberWhereClause(session, requestCookies);
  const baseDriverTruckFilter = await buildMcNumberIdWhereClause(session, requestCookies);

  const loadFilter = { ...baseLoadFilter, ...roleLoadFilter };
  const driverFilter = { ...baseDriverTruckFilter, ...roleDriverFilter };

  const roleTruckFilter = getTruckFilter(
    createFilterContext(session.user.id, session.user.role as any, session.user.companyId, mcNumberId ?? undefined)
  );
  const truckFilter = { ...baseDriverTruckFilter, ...roleTruckFilter };

  // Date boundaries for "Today at a Glance"
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalLoads, activeLoads, totalDrivers, availableDrivers,
    totalTrucks, availableTrucks, revenueData, deliveriesToday,
    openInvoicesData, expiringMedicalCards, expiringCDLs,
  ] = await Promise.all([
    prisma.load.count({ where: { ...loadFilter, deletedAt: null } }),
    prisma.load.count({
      where: { ...loadFilter, status: { in: ['PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'] }, deletedAt: null },
    }),
    prisma.driver.count({ where: { ...driverFilter, isActive: true, deletedAt: null } }),
    prisma.driver.count({ where: { ...driverFilter, status: 'AVAILABLE', isActive: true, deletedAt: null } }),
    prisma.truck.count({ where: { ...truckFilter, isActive: true, deletedAt: null } }),
    prisma.truck.count({ where: { ...truckFilter, status: 'AVAILABLE', isActive: true, deletedAt: null } }),
    prisma.load.aggregate({ where: { ...loadFilter, status: { not: 'CANCELLED' }, deletedAt: null }, _sum: { revenue: true } }),
    prisma.load.count({ where: { ...loadFilter, deliveryDate: { gte: todayStart, lt: todayEnd }, deletedAt: null } }),
    prisma.invoice.aggregate({ where: { companyId: session.user.companyId, status: { notIn: ['PAID', 'CANCELLED'] } }, _count: { id: true }, _sum: { balance: true } }),
    prisma.medicalCard.count({ where: { companyId: session.user.companyId, expirationDate: { gte: now, lte: thirtyDaysFromNow } } }),
    prisma.cDLRecord.count({ where: { companyId: session.user.companyId, expirationDate: { gte: now, lte: thirtyDaysFromNow } } }),
  ]);

  const totalRevenue = revenueData._sum.revenue || 0;
  const openInvoicesCount = openInvoicesData._count.id ?? 0;
  const openInvoicesBalance = openInvoicesData._sum.balance ?? 0;
  const expiringDocsCount = expiringMedicalCards + expiringCDLs;

  const stats = [
    { title: 'Total Loads', value: totalLoads, description: `${activeLoads} active`, icon: Package, color: 'text-blue-600' },
    { title: 'Drivers', value: totalDrivers, description: `${availableDrivers} available`, icon: Users, color: 'text-green-600' },
    { title: 'Trucks', value: totalTrucks, description: `${availableTrucks} available`, icon: Truck, color: 'text-orange-600' },
    { title: 'Total Revenue', value: formatCurrency(totalRevenue), description: 'All time', icon: DollarSign, color: 'text-emerald-600' },
  ];

  return (
    <>
      {/* Today at a Glance */}
      <TodayAtAGlance
        activeLoads={activeLoads}
        deliveriesToday={deliveriesToday}
        openInvoicesCount={openInvoicesCount}
        openInvoicesBalance={openInvoicesBalance}
        availableDrivers={availableDrivers}
        expiringDocsCount={expiringDocsCount}
      />

      {/* Overview Statistics */}
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
    </>
  );
}

export default async function DashboardPage() {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return <div>Loading...</div>;
    }

    // Auto-redirect new companies to onboarding wizard
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { onboardingComplete: true },
    });
    if (company && !company.onboardingComplete) {
      const [loadsCount, driversCount, trucksCount] = await Promise.all([
        prisma.load.count({ where: { companyId: session.user.companyId, deletedAt: null } }),
        prisma.driver.count({ where: { companyId: session.user.companyId, deletedAt: null } }),
        prisma.truck.count({ where: { companyId: session.user.companyId, deletedAt: null } }),
      ]);
      if (loadsCount + driversCount + trucksCount === 0) {
        redirect('/dashboard/onboarding');
      }
    }

    return (
      <div className="space-y-4">
        <PageTransition>
        {/* Stats section streams independently — page shell renders instantly */}
        <Suspense fallback={<LoadingState message="Loading stats..." className="py-8" />}>
          <DashboardStats />
        </Suspense>

        {/* Quick Actions Section — renders immediately (client component) */}
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
    // Re-throw Next.js internal errors (redirect, dynamic server usage)
    if (error instanceof Error && (
      error.message.includes('NEXT_REDIRECT') ||
      error.message.includes('Dynamic server usage') ||
      (error as any).digest?.startsWith('NEXT_REDIRECT')
    )) {
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

