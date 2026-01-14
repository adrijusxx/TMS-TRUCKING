import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import BulkSettlementGeneration from '@/components/settlements/BulkSettlementGeneration';

export default async function BulkSettlementGenerationPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  // Only ADMIN and ACCOUNTANT can access bulk generation
  if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role || '')) {
    redirect('/dashboard/settlements');
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Settlements', href: '/dashboard/settlements' },
          { label: 'Bulk Generation' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bulk Settlement Generation</h1>
          <p className="text-muted-foreground">
            Generate settlements for all active drivers for a specific pay period
          </p>
        </div>
        <BulkSettlementGeneration />
      </div>
    </>
  );
}

























