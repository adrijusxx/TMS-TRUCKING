import CreateBatchFormPage from '@/components/batches/CreateBatchFormPage';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function NewBatchPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Batches', href: '/dashboard/batches' },
        { label: 'New Batch' }
      ]} />
      <CreateBatchFormPage />
    </>
  );
}

