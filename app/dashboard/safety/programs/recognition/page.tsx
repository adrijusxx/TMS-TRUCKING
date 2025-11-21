import DashboardLayout from '@/components/layout/DashboardLayout';

export default function RecognitionProgramsPage() {
  return (
    <DashboardLayout hideMainNav={true}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Recognition Programs</h1>
          <p className="text-muted-foreground mt-2">
            Manage driver and safety recognition programs
          </p>
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
    </DashboardLayout>
  );
}

