import { Breadcrumb } from '@/components/ui/breadcrumb';
import LoadBoardSearch from '@/components/loadboard/LoadBoardSearch';

export default function LoadBoardPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Loadboard', href: '/dashboard/loadboard' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Loadboard</h1>
        </div>
        <LoadBoardSearch />
      </div>
    </>
  );
}

