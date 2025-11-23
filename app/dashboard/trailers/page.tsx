import { Breadcrumb } from '@/components/ui/breadcrumb';
import TrailerList from '@/components/trailers/TrailerList';

export default function TrailersPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Trailers', href: '/dashboard/trailers' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Trailers</h1>
        </div>
        <TrailerList />
      </div>
    </>
  );
}
