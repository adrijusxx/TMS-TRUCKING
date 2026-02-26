import RecognitionTable from '@/components/safety/recognition/RecognitionTable';

export default function DriverRecognitionPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Driver Recognition</h2>
        <p className="text-muted-foreground">Manage safety campaigns, awards, and driver recognition programs</p>
      </div>
      <RecognitionTable />
    </div>
  );
}
