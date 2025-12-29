import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { DriverSettlementHistory } from '@/components/drivers/DriverSettlementHistory';
import { DriverAdvanceRequest } from '@/components/drivers/DriverAdvanceRequest';
import { DriverExpenseSubmission } from '@/components/drivers/DriverExpenseSubmission';
import { DriverBalanceCard } from '@/components/drivers/DriverBalanceCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, FileText, CreditCard, TrendingUp } from 'lucide-react';

export default async function DriverSettlementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  // Get driver details
  const driver = await prisma.driver.findFirst({
    where: {
      id,
      companyId: session.user.companyId,
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!driver) {
    notFound();
  }

  // Check if user is the driver or has permission to view
  const isOwnProfile = session.user.id === driver.userId;
  const hasPermission = ['ADMIN', 'ACCOUNTANT', 'DISPATCHER'].includes(session.user.role || '');

  if (!isOwnProfile && !hasPermission) {
    redirect('/dashboard');
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Drivers', href: '/dashboard/drivers' },
          { label: `${driver.user.firstName} ${driver.user.lastName}`, href: `/dashboard/drivers/${id}` },
          { label: 'Settlements & Finances', href: `/dashboard/drivers/${id}/settlements` },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {driver.user.firstName} {driver.user.lastName} - Settlements & Finances
          </h1>
        </div>

        {/* Balance Overview */}
        <DriverBalanceCard driverId={id} />

        {/* Tabs for different sections */}
        <Tabs defaultValue="settlements" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settlements">
              <CreditCard className="h-4 w-4 mr-2" />
              Settlements
            </TabsTrigger>
            <TabsTrigger value="advances">
              <DollarSign className="h-4 w-4 mr-2" />
              Advances
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <FileText className="h-4 w-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settlements" className="space-y-4">
            <DriverSettlementHistory driverId={id} />
          </TabsContent>

          <TabsContent value="advances" className="space-y-4">
            <DriverAdvanceRequest driverId={id} />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <DriverExpenseSubmission driverId={id} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              Performance metrics coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

