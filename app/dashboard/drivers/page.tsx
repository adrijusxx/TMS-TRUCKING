import { PageTransition } from '@/components/ui/page-transition';
import { DriversTableClient } from './DriversTableClient';

export default function DriversPage() {
  return (
    <PageTransition>
      <DriversTableClient />
    </PageTransition>
  );
}
