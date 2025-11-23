import { Breadcrumb } from '@/components/ui/breadcrumb';
import SafetyPage from '@/components/safety/SafetyPage';

export default function TrainingsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Trainings' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Safety Trainings</h1>
        </div>
        <SafetyPage />
      </div>
    </>
  );
}

