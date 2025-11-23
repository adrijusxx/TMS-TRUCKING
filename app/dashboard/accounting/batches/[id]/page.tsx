import BatchDetail from '@/components/batches/BatchDetail';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Breadcrumb items={[
        { label: 'Accounting', href: '/dashboard/accounting' },
        { label: 'Batches', href: '/dashboard/accounting/batches' },
        { label: `Batch #${id}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Accounting Batch Details</h1>
        </div>
        <BatchDetail batchId={id} />
      </div>
    </>
  );
}

