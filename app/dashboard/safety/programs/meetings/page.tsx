import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SafetyMeetingsPage() {
  return (
    <DashboardLayout hideMainNav={true}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Safety Meetings</h1>
          <p className="text-muted-foreground mt-2">
            Schedule and track safety meetings
          </p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-muted-foreground">
            Safety meeting management coming soon. This feature will allow you to:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>Schedule safety meetings</li>
            <li>Track attendance</li>
            <li>Record meeting minutes</li>
            <li>Manage safety topics and agendas</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

