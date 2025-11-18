import CreateCustomerForm from '@/components/customers/CreateCustomerForm';

export default function NewCustomerPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Add New Customer</h1>
        <p className="text-muted-foreground">
          Register a new customer in your system
        </p>
      </div>
      <CreateCustomerForm />
    </div>
  );
}

