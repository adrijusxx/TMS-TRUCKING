import { Breadcrumb } from '@/components/ui/breadcrumb';
import LoadBoard from '@/components/loads/LoadBoard';

export default function LoadBoardPage() {
  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Load Management', href: '/dashboard/loads' },
          { label: 'Driver Week Board', href: '/dashboard/loads/board' }
        ]} 
      />
      <div className="space-y-2">
        <div>
          <h1 className="text-lg font-bold">Driver Week Board</h1>
          <p className="text-xs text-muted-foreground">
            Weekly schedule, dispatch, and planning
          </p>
        </div>
        <LoadBoard />
      </div>
    </>
  );
}

