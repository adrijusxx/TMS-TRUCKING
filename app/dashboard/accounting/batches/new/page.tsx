import CreateBatchFormPage from '@/components/batches/CreateBatchFormPage';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function NewBatchPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Accounting', href: '/dashboard/accounting' },
        { label: 'Batches', href: '/dashboard/accounting/batches' },
        { label: 'New Batch' }
      ]} />
      <CreateBatchFormPage />
    </>
  );
}

