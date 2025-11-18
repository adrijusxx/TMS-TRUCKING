import DashboardLayout from '@/components/layout/DashboardLayout';
import InvoiceList from '@/components/invoices/InvoiceList';

export default function BillsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bills</h1>
          <p className="text-muted-foreground">Manage bills and accounts payable</p>
        </div>
        <InvoiceList />
      </div>
    </DashboardLayout>
  );
}
