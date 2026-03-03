import { PageTransition } from '@/components/ui/page-transition';
import { TrucksTableClient } from './TrucksTableClient';

export default function TrucksPage() {
  return (
    <PageTransition>
      <TrucksTableClient />
    </PageTransition>
  );
}
