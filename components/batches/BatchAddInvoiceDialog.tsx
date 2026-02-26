'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, Search } from 'lucide-react';
import { apiUrl, formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface BatchAddInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  batchId: string;
}

interface UnbatchedInvoice {
  id: string;
  invoiceNumber: string;
  total: number;
  balance: number;
  invoiceDate: string;
  status: string;
  customer: { name: string };
  load?: { loadNumber: string } | null;
}

export default function BatchAddInvoiceDialog({ open, onClose, batchId }: BatchAddInvoiceDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  // Fetch unbatched invoices
  const { data, isLoading } = useQuery<UnbatchedInvoice[]>({
    queryKey: ['unbatched-invoices', search],
    queryFn: async () => {
      const params = new URLSearchParams({ unbatched: 'true' });
      if (search) params.set('search', search);
      const res = await fetch(apiUrl(`/api/invoices?${params.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch invoices');
      const result = await res.json();
      return result.data || [];
    },
    enabled: open,
  });

  const invoices = data || [];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    setIsAdding(true);
    try {
      const res = await fetch(apiUrl(`/api/batches/${batchId}/invoices`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to add invoices');
      }
      toast.success(`Added ${selectedIds.size} invoice(s) to batch`);
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      setSelectedIds(new Set());
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Invoices to Batch</DialogTitle>
          <DialogDescription>Select unbatched invoices to add to this batch.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice #, customer, load..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="border rounded-lg overflow-auto flex-1 min-h-[200px] max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Load #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No unbatched invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} className="cursor-pointer" onClick={() => toggleSelect(inv.id)}>
                    <TableCell>
                      <Checkbox checked={selectedIds.has(inv.id)} onCheckedChange={() => toggleSelect(inv.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.customer?.name}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.load?.loadNumber || '-'}</TableCell>
                    <TableCell className="text-xs">{formatDate(inv.invoiceDate)}</TableCell>
                    <TableCell><Badge variant="outline">{inv.status}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(inv.total)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isAdding || selectedIds.size === 0}>
              {isAdding && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Add to Batch
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
