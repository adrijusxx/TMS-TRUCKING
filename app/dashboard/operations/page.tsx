import { PageTransition } from '@/components/ui/page-transition';
import OperationsCenter from '@/components/operations/OperationsCenter';

export default function OperationsPage() {
  return (
    <PageTransition>
        <div className="space-y-2">
<OperationsCenter />
        </div>
      </PageTransition>
  );
}





