'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Link2,
  Unlink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Edit2,
} from 'lucide-react';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import RateConfirmationForm from './RateConfirmationForm';

interface RateConfirmation {
  id: string;
  loadId: string;
  invoiceId?: string | null;
  rateConfNumber?: string | null;
  baseRate: number;
  fuelSurcharge: number;
  accessorialCharges: number;
  totalRate: number;
  paymentTerms: number;
  paymentMethod?: string | null;
  matchedToInvoice: boolean;
  matchedAt?: Date | null;
  notes?: string | null;
  load: {
    id: string;
    loadNumber: string;
    customer: {
      name: string;
      customerNumber: string;
    };
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    total: number;
  } | null;
  document?: {
    id: string;
    fileName: string;
    fileUrl: string;
  } | null;
  matchedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

async function fetchRateConfirmations(params: {
  page?: number;
  limit?: number;
  matched?: string;
  loadId?: string;
  search?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.matched) queryParams.set('matched', params.matched);
  if (params.loadId) queryParams.set('loadId', params.loadId);
  if (params.search) queryParams.set('search', params.search);

  const response = await fetch(apiUrl(`/api/rate-confirmations?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch rate confirmations');
  return response.json();
}

async function fetchLoads() {
  const response = await fetch(apiUrl('/api/loads?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch loads');
  return response.json();
}

async function fetchInvoices(loadId: string) {
  const response = await fetch(apiUrl(`/api/invoices?limit=100`));
  if (!response.ok) throw new Error('Failed to fetch invoices');
  return response.json();
}

export default function RateConfirmationList() {
  const [page, setPage] = useState(1);
  const [matchedFilter, setMatchedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingConfirmationId, setEditingConfirmationId] = useState<string | null>(null);
  const [selectedConfirmation, setSelectedConfirmation] = useState<RateConfirmation | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['rate-confirmations', page, matchedFilter, searchQuery],
    queryFn: () =>
      fetchRateConfirmations({
        page,
        limit: 20,
        matched: matchedFilter !== 'all' ? matchedFilter : undefined,
        search: searchQuery || undefined,
      }),
    staleTime: 30000,
  });

  // Fetch loads for dropdown
  const { data: loadsData } = useQuery({
    queryKey: ['loads-dropdown'],
    queryFn: fetchLoads,
    staleTime: 60000,
  });

  // Fetch invoices when matching
  const { data: invoicesData } = useQuery({
    queryKey: ['invoices-for-matching', selectedConfirmation?.loadId],
    queryFn: () => {
      if (!selectedConfirmation?.loadId) return { data: [] };
      return fetchInvoices(selectedConfirmation.loadId);
    },
    enabled: !!selectedConfirmation && matchDialogOpen,
    staleTime: 30000,
  });

  const matchMutation = useMutation({
    mutationFn: async ({ confirmationId, invoiceId }: { confirmationId: string; invoiceId: string }) => {
      const response = await fetch(apiUrl(`/api/rate-confirmations/${confirmationId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchToInvoice: true, invoiceId }),
      });
      if (!response.ok) throw new Error('Failed to match rate confirmation');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Rate confirmation matched to invoice');
      queryClient.invalidateQueries({ queryKey: ['rate-confirmations'] });
      setMatchDialogOpen(false);
      setSelectedConfirmation(null);
      setSelectedInvoiceId('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to match rate confirmation');
    },
  });

  const unmatchMutation = useMutation({
    mutationFn: async (confirmationId: string) => {
      const response = await fetch(apiUrl(`/api/rate-confirmations/${confirmationId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchToInvoice: false }),
      });
      if (!response.ok) throw new Error('Failed to unmatch rate confirmation');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Rate confirmation unmatched');
      queryClient.invalidateQueries({ queryKey: ['rate-confirmations'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unmatch rate confirmation');
    },
  });

  const confirmations: RateConfirmation[] = data?.data || [];
  const meta = data?.meta;

  const handleMatch = (confirmation: RateConfirmation) => {
    setSelectedConfirmation(confirmation);
    setSelectedInvoiceId('');
    setMatchDialogOpen(true);
  };

  const handleMatchConfirm = () => {
    if (!selectedConfirmation || !selectedInvoiceId) {
      toast.error('Please select an invoice');
      return;
    }
    matchMutation.mutate({
      confirmationId: selectedConfirmation.id,
      invoiceId: selectedInvoiceId,
    });
  };

  const handleUnmatch = (confirmation: RateConfirmation) => {
    if (confirm('Are you sure you want to unmatch this rate confirmation from its invoice?')) {
      unmatchMutation.mutate(confirmation.id);
    }
  };

  const loads = loadsData?.data || [];
  const invoices = invoicesData?.data || [];

  // Filter invoices to only show those for the selected load
  const filteredInvoices = selectedConfirmation
    ? invoices.filter((inv: any) => inv.loadIds?.includes(selectedConfirmation.loadId))
    : [];

  // Calculate discrepancies
  const getDiscrepancy = (confirmation: RateConfirmation) => {
    if (!confirmation.invoice) return null;
    const difference = confirmation.totalRate - confirmation.invoice.total;
    const percentDifference = (difference / confirmation.totalRate) * 100;
    return { difference, percentDifference };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rate Confirmations</h2>
          <p className="text-muted-foreground">
            Track rate confirmations and match them to invoices
          </p>
        </div>
        <Button onClick={() => setFormDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rate Confirmation
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by load number or confirmation number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={matchedFilter}
          onValueChange={(value) => {
            setMatchedFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Matched</SelectItem>
            <SelectItem value="false">Unmatched</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{confirmations.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Matched</p>
                <p className="text-2xl font-bold text-green-600">
                  {confirmations.filter((c) => c.matchedToInvoice).length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unmatched</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {confirmations.filter((c) => !c.matchedToInvoice).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rate Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(confirmations.reduce((sum, c) => sum + c.totalRate, 0))}
                </p>
              </div>
              <FileText className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading rate confirmations...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Error loading rate confirmations. Please try again.
        </div>
      ) : confirmations.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No rate confirmations found</p>
              <p className="text-muted-foreground">
                {searchQuery || matchedFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first rate confirmation'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Confirmation #</TableHead>
                  <TableHead>Load</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Base Rate</TableHead>
                  <TableHead>Fuel Surcharge</TableHead>
                  <TableHead>Accessorials</TableHead>
                  <TableHead>Total Rate</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Discrepancy</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmations.map((confirmation) => {
                  const discrepancy = getDiscrepancy(confirmation);
                  return (
                    <TableRow key={confirmation.id}>
                      <TableCell className="font-medium">
                        {confirmation.rateConfNumber || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/loads/${confirmation.loadId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {confirmation.load.loadNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{confirmation.load.customer.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {confirmation.load.customer.customerNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(confirmation.baseRate)}</TableCell>
                      <TableCell>{formatCurrency(confirmation.fuelSurcharge)}</TableCell>
                      <TableCell>{formatCurrency(confirmation.accessorialCharges)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(confirmation.totalRate)}</TableCell>
                      <TableCell>
                        {confirmation.invoice ? (
                          <Link
                            href={`/dashboard/invoices/${confirmation.invoice.id}`}
                            className="text-primary hover:underline"
                          >
                            {confirmation.invoice.invoiceNumber}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            confirmation.matchedToInvoice
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }
                        >
                          {confirmation.matchedToInvoice ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Matched
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Unmatched
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {discrepancy && Math.abs(discrepancy.percentDifference) > 1 ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-xs font-medium">
                              {discrepancy.difference > 0 ? '+' : ''}
                              {formatCurrency(discrepancy.difference)} (
                              {discrepancy.percentDifference > 0 ? '+' : ''}
                              {discrepancy.percentDifference.toFixed(1)}%)
                            </span>
                          </div>
                        ) : discrepancy ? (
                          <span className="text-xs text-muted-foreground">OK</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingConfirmationId(confirmation.id);
                              setFormDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {confirmation.document && (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={confirmation.document.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {confirmation.matchedToInvoice ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnmatch(confirmation)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Unlink className="h-4 w-4 mr-1" />
                              Unmatch
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMatch(confirmation)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Link2 className="h-4 w-4 mr-1" />
                              Match
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, meta.total)} of{' '}
                {meta.total} confirmations
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Match Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Match Rate Confirmation to Invoice</DialogTitle>
            <DialogDescription>
              Select an invoice to match with this rate confirmation
            </DialogDescription>
          </DialogHeader>
          {selectedConfirmation && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rate Confirmation</Label>
                <div className="p-3 bg-muted rounded-md">
                  <div className="font-medium">
                    {selectedConfirmation.rateConfNumber || 'N/A'} -{' '}
                    {selectedConfirmation.load.loadNumber}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Rate: {formatCurrency(selectedConfirmation.totalRate)}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice">Invoice *</Label>
                <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredInvoices.length === 0 ? (
                      <SelectItem value="" disabled>
                        No invoices found for this load
                      </SelectItem>
                    ) : (
                      filteredInvoices.map((invoice: any) => {
                        const invDiscrepancy =
                          selectedConfirmation.totalRate - invoice.total;
                        const invPercentDiff =
                          (invDiscrepancy / selectedConfirmation.totalRate) * 100;
                        return (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoiceNumber} - {formatCurrency(invoice.total)}
                            {Math.abs(invPercentDiff) > 1 && (
                              <span
                                className={
                                  invPercentDiff > 0 ? 'text-red-600' : 'text-green-600'
                                }
                              >
                                {' '}
                                ({invPercentDiff > 0 ? '+' : ''}
                                {invPercentDiff.toFixed(1)}%)
                              </span>
                            )}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
                {selectedInvoiceId && filteredInvoices.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {(() => {
                      const selectedInvoice = filteredInvoices.find(
                        (inv: any) => inv.id === selectedInvoiceId
                      );
                      if (!selectedInvoice) return null;
                      const disc = selectedConfirmation.totalRate - selectedInvoice.total;
                      const pct = (disc / selectedConfirmation.totalRate) * 100;
                      if (Math.abs(pct) > 1) {
                        return (
                          <span className={pct > 0 ? 'text-red-600' : 'text-green-600'}>
                            ⚠️ Discrepancy: {pct > 0 ? '+' : ''}
                            {formatCurrency(disc)} ({pct > 0 ? '+' : ''}
                            {pct.toFixed(1)}%)
                          </span>
                        );
                      }
                      return <span className="text-green-600">✓ Rates match</span>;
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMatchConfirm}
              disabled={!selectedInvoiceId || matchMutation.isPending}
            >
              {matchMutation.isPending ? 'Matching...' : 'Match'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Form Dialog */}
      <RateConfirmationForm
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) {
            setEditingConfirmationId(null);
          }
        }}
        loadId={undefined}
        confirmationId={editingConfirmationId || undefined}
        onSuccess={() => {
          setEditingConfirmationId(null);
        }}
      />
    </div>
  );
}

