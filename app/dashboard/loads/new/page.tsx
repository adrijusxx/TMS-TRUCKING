import CreateLoadForm from '@/components/loads/CreateLoadForm';

export default function NewLoadPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Create New Load</h1>
        <p className="text-muted-foreground">
          Enter load details to create a new shipment
        </p>
      </div>
      <CreateLoadForm />
    </div>
  );
}

