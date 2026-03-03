import { PageTransition } from '@/components/ui/page-transition';
import { TrailersTableClient } from './TrailersTableClient';

export default function TrailersPage() {
  return (
    <PageTransition>
      <TrailersTableClient />
    </PageTransition>
  );
}
