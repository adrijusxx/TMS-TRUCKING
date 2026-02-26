import TrainingCenter from '@/components/safety/training/TrainingCenter';

export default function TrainingCenterPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Training Center</h2>
        <p className="text-muted-foreground">Manage training records, materials, and track certificate expiration</p>
      </div>
      <TrainingCenter />
    </div>
  );
}
