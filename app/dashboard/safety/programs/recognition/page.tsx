import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function RecognitionProgramsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Programs', href: '/dashboard/safety/programs' },
        { label: 'Recognition' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Recognition Programs</h1>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-muted-foreground">
            Recognition program management coming soon. This feature will allow you to:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>Track safety milestones and achievements</li>
            <li>Manage recognition awards</li>
            <li>View driver safety records</li>
            <li>Generate recognition reports</li>
          </ul>
        </div>
      </div>
    </>
  );
}



