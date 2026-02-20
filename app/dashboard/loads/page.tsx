import { Breadcrumb } from '@/components/ui/breadcrumb';
import { PageTransition } from '@/components/ui/page-transition';
import LoadListNew from '@/components/loads/LoadListNew';

export default function LoadsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Load Management', href: '/dashboard/loads' }]} />
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Load Management</h1>
          </div>
          <LoadListNew />
        </div>
      </PageTransition>
    </>
  );
}

