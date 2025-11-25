import { Breadcrumb } from '@/components/ui/breadcrumb';
import TrailerListNew from '@/components/trailers/TrailerListNew';

export default function TrailersPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Trailers', href: '/dashboard/trailers' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Trailers</h1>
        </div>
        <TrailerListNew />
      </div>
    </>
  );
}
