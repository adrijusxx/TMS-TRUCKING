import { PageTransition } from '@/components/ui/page-transition';
import OperationsCenter from '@/components/operations/OperationsCenter';

export default function FleetMapPage() {
  return (
    <PageTransition>
      <div className="space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet Map</h1>
          <p className="text-sm text-muted-foreground">Live fleet tracking and operations</p>
        </div>
        <OperationsCenter />
      </div>
    </PageTransition>
  );
}
