import { PageTransition } from '@/components/ui/page-transition';
import LoadListNew from '@/components/loads/LoadListNew';

export default function LoadsPage() {
  return (
    <PageTransition>
        <LoadListNew />
      </PageTransition>
  );
}

