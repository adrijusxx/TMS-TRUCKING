import { auth } from '@/app/api/auth/[...nextauth]/route';
import FactoringWorkflowInfo from '@/components/factoring/FactoringWorkflowInfo';
import FactoringDashboard from '@/components/factoring/FactoringDashboard';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function FactoringPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Accounting', href: '/dashboard/accounting' },
          { label: 'Factoring', href: '/dashboard/accounting/factoring' },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold">Factoring Dashboard</h1>
      </div>
      <FactoringWorkflowInfo />
      <FactoringDashboard />
    </div>
  );
}

