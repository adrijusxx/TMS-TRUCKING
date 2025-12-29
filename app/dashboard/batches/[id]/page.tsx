import BatchDetail from '@/components/batches/BatchDetail';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Breadcrumb items={[
        { label: 'Batches', href: '/dashboard/batches' },
        { label: `Batch #${id.slice(0, 8)}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Batch Details</h1>
        </div>
        <BatchDetail batchId={id} />
      </div>
    </>
  );
}

