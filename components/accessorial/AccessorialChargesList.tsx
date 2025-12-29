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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Calendar,
  Edit2,
} from 'lucide-react';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { AccessorialChargeType, AccessorialChargeStatus } from '@prisma/client';
import Link from 'next/link';
import { toast } from 'sonner';
import AccessorialChargeForm from './AccessorialChargeForm';

interface AccessorialCharge {
  id: string;
  loadId: string;
  invoiceId?: string | null;
  chargeType: AccessorialChargeType;
  description: string;
  detentionHours?: number | null;
  detentionRate?: number | null;
  layoverDays?: number | null;
  layoverRate?: number | null;
  tonuReason?: string | null;
  amount: number;
  status: AccessorialChargeStatus;
  approvedAt?: Date | null;
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
  } | null;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

const statusColors: Record<AccessorialChargeStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  BILLED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  DENIED: 'bg-red-100 text-red-800 border-red-200',
};

const chargeTypeLabels: Record<AccessorialChargeType, string> = {
  DETENTION: 'Detention',
  LAYOVER: 'Layover',
  TONU: 'TONU',
  LUMPER: 'Lumper',
  SCALE_TICKET: 'Scale Ticket',
  ADDITIONAL_STOP: 'Additional Stop',
  FUEL_SURCHARGE: 'Fuel Surcharge',
  RECLASSIFICATION: 'Reclassification',
  REEFER_FUEL: 'Reefer Fuel',
  DRIVER_ASSIST: 'Driver Assist',
  SORT_SEGREGATE: 'Sort/Segregate',
  INSIDE_DELIVERY: 'Inside Delivery',
  RESIDENTIAL_DELIVERY: 'Residential Delivery',
  SATURDAY_DELIVERY: 'Saturday Delivery',
  AFTER_HOURS: 'After Hours',
  OTHER: 'Other',
};

async function fetchAccessorialCharges(params: {
  page?: number;
  limit?: number;
  status?: string;
  chargeType?: string;
  loadId?: string;
  search?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.status) queryParams.set('status', params.status);
  if (params.chargeType) queryParams.set('chargeType', params.chargeType);
  if (params.loadId) queryParams.set('loadId', params.loadId);
  if (params.search) queryParams.set('search', params.search);

  const response = await fetch(apiUrl(`/api/accessorial-charges?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch accessorial charges');
  return response.json();
}

export default function AccessorialChargesList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [chargeTypeFilter, setChargeTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharge, setSelectedCharge] = useState<AccessorialCharge | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'deny' | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingChargeId, setEditingChargeId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['accessorial-charges', page, statusFilter, chargeTypeFilter, searchQuery],
    queryFn: () =>
      fetchAccessorialCharges({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        chargeType: chargeTypeFilter !== 'all' ? chargeTypeFilter : undefined,
        search: searchQuery || undefined,
      }),
    staleTime: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: async (chargeId: string) => {
      const response = await fetch(apiUrl(`/api/accessorial-charges/${chargeId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve: true }),
      });
      if (!response.ok) throw new Error('Failed to approve charge');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Accessorial charge approved');
      queryClient.invalidateQueries({ queryKey: ['accessorial-charges'] });
      setActionDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve charge');
    },
  });

  const denyMutation = useMutation({
    mutationFn: async (chargeId: string) => {
      const response = await fetch(apiUrl(`/api/accessorial-charges/${chargeId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deny: true }),
      });
      if (!response.ok) throw new Error('Failed to deny charge');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Accessorial charge denied');
      queryClient.invalidateQueries({ queryKey: ['accessorial-charges'] });
      setActionDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deny charge');
    },
  });

  const charges: AccessorialCharge[] = data?.data || [];
  const meta = data?.meta;

  const handleApprove = (charge: AccessorialCharge) => {
    setSelectedCharge(charge);
    setAction('approve');
    setActionDialogOpen(true);
  };

  const handleDeny = (charge: AccessorialCharge) => {
    setSelectedCharge(charge);
    setAction('deny');
    setActionDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedCharge) return;

    if (action === 'approve') {
      approveMutation.mutate(selectedCharge.id);
    } else if (action === 'deny') {
      denyMutation.mutate(selectedCharge.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Accessorial Charges</h2>
          <p className="text-muted-foreground">Track detention, layover, and other charges</p>
        </div>
        <Button onClick={() => setFormDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Charge
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by load number or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(AccessorialChargeStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={chargeTypeFilter}
          onValueChange={(value) => {
            setChargeTypeFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Charge Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.values(AccessorialChargeType).map((type) => (
              <SelectItem key={type} value={type}>
                {chargeTypeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {charges.filter((c) => c.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {charges.filter((c) => c.status === 'APPROVED').length}
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
                <p className="text-sm text-muted-foreground">Billed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {charges.filter((c) => c.status === 'BILLED').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(charges.reduce((sum, c) => sum + c.amount, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading accessorial charges...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Error loading accessorial charges. Please try again.
        </div>
      ) : charges.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No accessorial charges found</p>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first accessorial charge'}
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
                  <TableHead>Load</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Charge Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/loads/${charge.loadId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {charge.load.loadNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{charge.load.customer.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {charge.load.customer.customerNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{chargeTypeLabels[charge.chargeType]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{charge.description}</div>
                        {charge.chargeType === 'DETENTION' && charge.detentionHours && (
                          <div className="text-xs text-muted-foreground">
                            {charge.detentionHours} hrs @ {formatCurrency(charge.detentionRate || 0)}/hr
                          </div>
                        )}
                        {charge.chargeType === 'LAYOVER' && charge.layoverDays && (
                          <div className="text-xs text-muted-foreground">
                            {charge.layoverDays} day(s) @ {formatCurrency(charge.layoverRate || 0)}/day
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(charge.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[charge.status]}>
                        {charge.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {charge.invoice ? (
                        <Link
                          href={`/dashboard/invoices/${charge.invoice.id}`}
                          className="text-primary hover:underline"
                        >
                          {charge.invoice.invoiceNumber}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {charge.approvedAt ? formatDate(charge.approvedAt.toString()) : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingChargeId(charge.id);
                            setFormDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {charge.status === 'PENDING' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(charge)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeny(charge)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Deny
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to{' '}
                {Math.min(page * 20, meta.total)} of {meta.total} charges
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

      {/* Approval/Denial Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve Accessorial Charge' : 'Deny Accessorial Charge'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve'
                ? 'Are you sure you want to approve this accessorial charge?'
                : 'Are you sure you want to deny this accessorial charge?'}
            </DialogDescription>
          </DialogHeader>
          {selectedCharge && (
            <div className="py-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Load:</span>
                <span className="font-medium">{selectedCharge.load.loadNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="font-medium">{chargeTypeLabels[selectedCharge.chargeType]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="font-medium">{formatCurrency(selectedCharge.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Description:</span>
                <span className="font-medium text-right">{selectedCharge.description}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              variant={action === 'approve' ? 'default' : 'destructive'}
              disabled={approveMutation.isPending || denyMutation.isPending}
            >
              {approveMutation.isPending || denyMutation.isPending
                ? 'Processing...'
                : action === 'approve'
                  ? 'Approve'
                  : 'Deny'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Form Dialog */}
      <AccessorialChargeForm
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) {
            setEditingChargeId(null);
          }
        }}
        loadId={undefined}
        chargeId={editingChargeId || undefined}
        onSuccess={() => {
          setEditingChargeId(null);
        }}
      />
    </div>
  );
}

