import BatchListNew from '@/components/batches/BatchListNew';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function BatchesPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Accounting', href: '/dashboard/accounting' },
        { label: 'Batches' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Accounting Batches</h1>
        </div>
        <BatchListNew />
      </div>
    </>
  );
}

