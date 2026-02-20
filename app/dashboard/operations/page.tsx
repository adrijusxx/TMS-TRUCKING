import { Breadcrumb } from '@/components/ui/breadcrumb';
import { PageTransition } from '@/components/ui/page-transition';
import OperationsCenter from '@/components/operations/OperationsCenter';

export default function OperationsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Load Management', href: '/dashboard/loads' },
          { label: 'Operations Center', href: '/dashboard/operations' }
        ]}
      />
      <PageTransition>
        <div className="space-y-2">
          <div>
            <h1 className="text-lg font-bold">Operations Center</h1>
            <p className="text-xs text-muted-foreground">
              Fleet overview and live tracking
            </p>
          </div>
          <OperationsCenter />
        </div>
      </PageTransition>
    </>
  );
}





