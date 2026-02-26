import MeetingsTable from '@/components/safety/meetings/MeetingsTable';

export default function SafetyMeetingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Safety Meetings</h2>
        <p className="text-muted-foreground">Schedule meetings, track attendance, and manage action items</p>
      </div>
      <MeetingsTable />
    </div>
  );
}
