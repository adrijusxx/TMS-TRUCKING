import { Breadcrumb } from '@/components/ui/breadcrumb';
import { PageTransition } from '@/components/ui/page-transition';
import BatchListNew from '@/components/batches/BatchListNew';

export default function BatchesPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Batches', href: '/dashboard/batches' }]} />
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Batches</h1>
          </div>
          <BatchListNew />
        </div>
      </PageTransition>
    </>
  );
}

