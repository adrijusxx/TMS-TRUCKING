import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import BreakdownReportForm from '@/components/mobile/BreakdownReportForm';
import DriverBreakdownList from '@/components/mobile/DriverBreakdownList';

export default async function DriverBreakdownsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const driver = await prisma.driver.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!driver) {
    redirect('/dashboard');
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Breakdowns</h1>
        <p className="text-muted-foreground">Report breakdowns and communicate with dispatch</p>
      </div>

      <BreakdownReportForm />
      <DriverBreakdownList />
    </div>
  );
}

