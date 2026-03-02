import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BulkSettlementGeneration from '@/components/settlements/BulkSettlementGeneration';
import { PageShell } from '@/components/layout/PageShell';

export default async function BulkSettlementGenerationPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role || '')) {
    redirect('/dashboard/settlements');
  }

  return (
    <PageShell title="Bulk Generate Settlements" description="Generate settlements for multiple drivers at once">
      <BulkSettlementGeneration />
    </PageShell>
  );
}
