import { PageTransition } from '@/components/ui/page-transition';
import OperationsCenter from '@/components/operations/OperationsCenter';

export default function WarRoomPage() {
  return (
    <PageTransition>
      <div className="space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">War Room</h1>
          <p className="text-sm text-muted-foreground">Fleet overview and live tracking</p>
        </div>
        <OperationsCenter />
      </div>
    </PageTransition>
  );
}
