import CreateTrailerForm from '@/components/trailers/CreateTrailerForm';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function NewTrailerPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Trailers', href: '/dashboard/trailers' },
        { label: 'New Trailer' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add New Trailer</h1>
        </div>
        <CreateTrailerForm />
      </div>
    </>
  );
}

