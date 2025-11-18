import CreateTruckForm from '@/components/trucks/CreateTruckForm';

export default function NewTruckPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Add New Truck</h1>
        <p className="text-muted-foreground">
          Register a new truck in your fleet
        </p>
      </div>
      <CreateTruckForm />
    </div>
  );
}

