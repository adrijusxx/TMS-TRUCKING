import CreateDriverForm from '@/components/drivers/CreateDriverForm';

export default function NewDriverPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Add New Driver</h1>
        <p className="text-muted-foreground">
          Create a new driver account and profile
        </p>
      </div>
      <CreateDriverForm />
    </div>
  );
}

