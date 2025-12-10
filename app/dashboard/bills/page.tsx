import { redirect } from 'next/navigation';

// Redirect bills to invoices (they're the same thing)
export default function BillsPage() {
  redirect('/dashboard/invoices');
}

