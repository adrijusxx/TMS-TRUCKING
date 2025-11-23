import { Breadcrumb } from '@/components/ui/breadcrumb';
import BatchList from '@/components/batches/BatchList';

export default function BatchesPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Batches', href: '/dashboard/batches' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Batches</h1>
        </div>
        <BatchList />
      </div>
    </>
  );
}

