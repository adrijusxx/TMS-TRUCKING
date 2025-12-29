'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import ReconcileForm from '@/components/reconciliation/ReconcileForm';
import { Plus } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

async function fetchReconciliations() {
  const response = await fetch(apiUrl('/api/reconciliation'));
  if (!response.ok) throw new Error('Failed to fetch reconciliations');
  return response.json();
}

export default function ReconciliationPage() {
  const [reconcileFormOpen, setReconcileFormOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reconciliation'],
    queryFn: fetchReconciliations,
  });

  const reconciliations = data?.data || [];

  return (
    <>
      <Breadcrumb items={[
        { label: 'Invoices', href: '/dashboard/invoices' },
        { label: 'Reconciliation' }
      ]} />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Reconciliation</h1>
          </div>
        <Button
          onClick={() => {
            setSelectedInvoiceId(null);
            setReconcileFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Reconcile (0)
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading reconciliations...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Reconciled Amount</TableHead>
                <TableHead>Reconciled Date</TableHead>
                <TableHead>Reconciled By</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No reconciliations found
                  </TableCell>
                </TableRow>
              ) : (
                reconciliations.map((rec: any) => (
                  <TableRow key={rec.id}>
                    <TableCell>{rec.invoice.invoiceNumber}</TableCell>
                    <TableCell>{rec.payment?.paymentNumber || '-'}</TableCell>
                    <TableCell>{formatCurrency(rec.reconciledAmount)}</TableCell>
                    <TableCell>{formatDate(rec.reconciledAt)}</TableCell>
                    <TableCell>
                      {rec.reconciledBy.firstName} {rec.reconciledBy.lastName}
                    </TableCell>
                    <TableCell>{rec.notes || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

        <ReconcileForm
          invoiceId={selectedInvoiceId || ''}
          open={reconcileFormOpen}
          onOpenChange={setReconcileFormOpen}
        />
      </div>
    </>
  );
}

