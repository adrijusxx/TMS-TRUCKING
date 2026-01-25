'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { SettlementStatus } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import {
  ArrowLeft,
  DollarSign,
  User,
  Calendar,
  FileText,
  Package,
  CheckCircle,
  XCircle,
  Download,
  Mail,
  Plus,
  Trash2,

  Check,
  ChevronsUpDown,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const TRANSACTION_TYPES = {
  // Additions (Payments to driver)
  BONUS: { label: 'Bonus', category: 'addition' },
  OVERTIME: { label: 'Overtime', category: 'addition' },
  INCENTIVE: { label: 'Incentive', category: 'addition' },
  REIMBURSEMENT: { label: 'Reimbursement', category: 'addition' },

  // Deductions (Charges from driver)
  FUEL_ADVANCE: { label: 'Fuel Advance', category: 'deduction' },
  CASH_ADVANCE: { label: 'Cash Advance', category: 'deduction' },
  INSURANCE: { label: 'Insurance', category: 'deduction' },
  OCCUPATIONAL_ACCIDENT: { label: 'Occupational Accident', category: 'deduction' },
  TRUCK_PAYMENT: { label: 'Truck Payment', category: 'deduction' },
  TRUCK_LEASE: { label: 'Truck Lease', category: 'deduction' },
  ESCROW: { label: 'Escrow', category: 'deduction' },
  EQUIPMENT_RENTAL: { label: 'Equipment Rental', category: 'deduction' },
  MAINTENANCE: { label: 'Maintenance', category: 'deduction' },
  TOLLS: { label: 'Tolls', category: 'deduction' },
  PERMITS: { label: 'Permits', category: 'deduction' },
  FUEL_CARD: { label: 'Fuel Card', category: 'deduction' },
  FUEL_CARD_FEE: { label: 'Fuel Card Fee', category: 'deduction' },
  TRAILER_RENTAL: { label: 'Trailer Rental', category: 'deduction' },
  OTHER: { label: 'Other', category: 'deduction' },
} as const;

interface SettlementDetailProps {
  settlementId: string;
}

async function fetchSettlement(id: string) {
  const response = await fetch(apiUrl(`/api/settlements/${id}`));
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch settlement: ${response.status} ${response.statusText}`);
  }
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Invalid settlement data received from server');
  }
  return result;
}

async function updateSettlement(id: string, data: any) {
  const response = await fetch(apiUrl(`/api/settlements/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update settlement');
  }
  return response.json();
}

const statusColors: Record<SettlementStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  DISPUTED: 'bg-red-100 text-red-800 border-red-200',
};

function formatStatus(status: SettlementStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function downloadSettlementPDF(id: string, format?: string) {
  try {
    const url = format
      ? apiUrl(`/api/settlements/${id}/pdf?format=${format}`)
      : apiUrl(`/api/settlements/${id}/pdf`);

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to download PDF');
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `settlement-${id}${format ? '-driver' : ''}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(objectUrl);
    document.body.removeChild(a);
    toast.success('PDF downloaded successfully');
  } catch (error: any) {
    toast.error(error.message || 'Failed to download PDF');
  }
}

async function sendSettlementEmail(id: string) {
  try {
    const response = await fetch(apiUrl(`/api/settlements/${id}/send`), {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to send email');
    }
    toast.success('Settlement email sent successfully');
  } catch (error: any) {
    toast.error(error.message || 'Failed to send email');
  }
}

async function fetchDeductions(settlementId: string) {
  const response = await fetch(apiUrl(`/api/settlements/${settlementId}/deductions`));
  if (!response.ok) throw new Error('Failed to fetch deductions');
  return response.json();
}

async function fetchAdditions(settlementId: string) {
  const response = await fetch(apiUrl(`/api/settlements/${settlementId}/additions`));
  if (!response.ok) throw new Error('Failed to fetch additions');
  return response.json();
}

async function createDeduction(settlementId: string, data: any) {
  const response = await fetch(apiUrl(`/api/settlements/${settlementId}/deductions`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create deduction');
  }
  return response.json();
}

async function createAddition(settlementId: string, data: any) {
  const response = await fetch(apiUrl(`/api/settlements/${settlementId}/additions`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create addition');
  }
  return response.json();
}

async function deleteDeduction(settlementId: string, deductionId: string) {
  const response = await fetch(apiUrl(`/api/settlements/${settlementId}/deductions?deductionId=${deductionId}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete deduction');
  }
  return response.json();
}

async function deleteAddition(settlementId: string, additionId: string) {
  const response = await fetch(apiUrl(`/api/settlements/${settlementId}/additions?additionId=${additionId}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete addition');
  }
  return response.json();
}

export default function SettlementDetail({ settlementId }: SettlementDetailProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SettlementStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [customTypes, setCustomTypes] = useState<any[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const deleteCustomType = async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const res = await fetch(`/api/deduction-type-templates/${templateId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCustomTypes(prev => prev.filter(t => t.id !== templateId));
        toast.success('Template deleted');
      } else {
        toast.error('Failed to delete template');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Error deleting template');
    }
  };

  // Fetch custom type templates
  useEffect(() => {
    const fetchCustomTypes = async () => {
      try {
        const res = await fetch('/api/deduction-type-templates?isActive=true');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setCustomTypes(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to load custom type templates:', error);
      }
    };
    fetchCustomTypes();
  }, []);

  // Create new custom type
  const createCustomType = async (name: string, category: 'addition' | 'deduction') => {
    try {
      const res = await fetch('/api/deduction-type-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setCustomTypes(prev => [...prev, data.data]);
          return data.data.name;
        }
      }
    } catch (error) {
      console.error('Failed to create custom type:', error);
    }
    return name;
  };

  const customAdditions = customTypes.filter(t => t.category === 'addition');
  const customDeductions = customTypes.filter(t => t.category === 'deduction');

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDeductionDialogOpen, setIsDeductionDialogOpen] = useState(false);
  const [isAdditionDialogOpen, setIsAdditionDialogOpen] = useState(false);
  const [newDeduction, setNewDeduction] = useState({
    deductionType: 'OTHER',
    description: '',
    amount: '',
  });
  const [newAddition, setNewAddition] = useState({
    deductionType: 'BONUS',
    description: '',
    amount: '',
  });
  const [editedGrossPay, setEditedGrossPay] = useState('');
  const [editedPeriodStart, setEditedPeriodStart] = useState('');
  const [editedPeriodEnd, setEditedPeriodEnd] = useState('');

  const { data, isLoading, error: settlementError } = useQuery({
    queryKey: ['settlement', settlementId],
    queryFn: () => fetchSettlement(settlementId),
    retry: 1,
  });

  // Log settlement data when loaded (React Query v5 pattern)
  useEffect(() => {
    if (data) {
      console.log('[SettlementDetail] Settlement data loaded:', data);
    }
    if (settlementError) {
      console.error('[SettlementDetail] Error fetching settlement:', settlementError);
    }
  }, [data, settlementError]);

  // Initialize state from settlement data when it loads
  useEffect(() => {
    if (data?.data) {
      const settlement = data.data;
      if (settlement.status && !status) {
        setStatus(settlement.status as SettlementStatus);
      }
      if (settlement.notes && !notes) {
        setNotes(settlement.notes);
      }
      if (isEditing && settlement.grossPay && !editedGrossPay) {
        setEditedGrossPay(settlement.grossPay.toString());
      }
      if (isEditing && settlement.periodStart && !editedPeriodStart) {
        setEditedPeriodStart(new Date(settlement.periodStart).toISOString().split('T')[0]);
      }
      if (isEditing && settlement.periodEnd && !editedPeriodEnd) {
        setEditedPeriodEnd(new Date(settlement.periodEnd).toISOString().split('T')[0]);
      }
    }
  }, [data, isEditing, status, notes, editedGrossPay, editedPeriodStart, editedPeriodEnd]);

  const { data: deductionsData, refetch: refetchDeductions } = useQuery({
    queryKey: ['settlement-deductions', settlementId],
    queryFn: () => fetchDeductions(settlementId),
    enabled: !!settlementId,
  });

  const { data: additionsData, refetch: refetchAdditions } = useQuery({
    queryKey: ['settlement-additions', settlementId],
    queryFn: () => fetchAdditions(settlementId),
    enabled: !!settlementId,
  });

  const createDeductionMutation = useMutation({
    mutationFn: (data: any) => createDeduction(settlementId, data),
    onSuccess: () => {
      toast.success('Deduction added successfully');
      queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
      queryClient.invalidateQueries({ queryKey: ['settlement-deductions', settlementId] });
      setIsDeductionDialogOpen(false);
      setNewDeduction({ deductionType: 'OTHER', description: '', amount: '' });
      refetchDeductions();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add deduction');
    },
  });

  const createAdditionMutation = useMutation({
    mutationFn: (data: any) => createAddition(settlementId, data),
    onSuccess: () => {
      toast.success('Addition added successfully');
      queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
      queryClient.invalidateQueries({ queryKey: ['settlement-additions', settlementId] });
      setIsAdditionDialogOpen(false);
      setNewAddition({ deductionType: 'BONUS', description: '', amount: '' });
      refetchAdditions();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add addition');
    },
  });

  const deleteDeductionMutation = useMutation({
    mutationFn: (deductionId: string) => deleteDeduction(settlementId, deductionId),
    onSuccess: () => {
      toast.success('Deduction deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
      queryClient.invalidateQueries({ queryKey: ['settlement-deductions', settlementId] });
      refetchDeductions();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete deduction');
    },
  });

  const deleteAdditionMutation = useMutation({
    mutationFn: (additionId: string) => deleteAddition(settlementId, additionId),
    onSuccess: () => {
      toast.success('Addition deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
      queryClient.invalidateQueries({ queryKey: ['settlement-additions', settlementId] });
      refetchAdditions();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete addition');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateSettlement(settlementId, data),
    onSuccess: () => {
      toast.success('Settlement updated successfully');
      queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
      setIsEditing(false);
      setStatus('');
      setNotes('');
      setEditedGrossPay('');
      setEditedPeriodStart('');
      setEditedPeriodEnd('');
    },
  });

  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculate = async () => {
    if (!confirm('Are you sure you want to recalculate this settlement? This will reset all auto-generated deductions and update pay based on current load data. Manual edits to deductions may be lost.')) return;

    setIsRecalculating(true);
    try {
      const response = await fetch(apiUrl(`/api/settlements/${settlementId}/recalculate`), {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to recalculate settlement');
      }

      const result = await response.json();
      if (result.success) {
        toast.success('Settlement recalculated successfully');
        queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
        queryClient.invalidateQueries({ queryKey: ['settlement-deductions', settlementId] });
        queryClient.invalidateQueries({ queryKey: ['settlement-additions', settlementId] });
        refetchDeductions();
        refetchAdditions();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to recalculate settlement');
    } finally {
      setIsRecalculating(false);
    }
  };


  const settlement = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading settlement...</span>
      </div>
    );
  }

  if (settlementError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Settlement</h2>
        <p className="text-muted-foreground mb-4">
          {settlementError instanceof Error ? settlementError.message : 'Failed to load settlement data'}
        </p>
        <Link href="/dashboard/settlements">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settlements
          </Button>
        </Link>
      </div>
    );
  }

  if (!settlement) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Settlement Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The settlement you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link href="/dashboard/settlements">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settlements
          </Button>
        </Link>
      </div>
    );
  }

  // Safety check for driver data
  if (!settlement.driver) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Driver Information Missing</h2>
        <p className="text-muted-foreground mb-4">
          This settlement is missing driver information. Please contact support.
        </p>
        <Link href="/dashboard/settlements">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settlements
          </Button>
        </Link>
      </div>
    );
  }

  const handleSave = () => {
    const updateData: any = {};

    if (status) updateData.status = status;
    if (notes !== settlement.notes) updateData.notes = notes;
    if (editedGrossPay && parseFloat(editedGrossPay) !== settlement.grossPay) {
      updateData.grossPay = parseFloat(editedGrossPay);
    }
    if (editedPeriodStart && editedPeriodStart !== new Date(settlement.periodStart).toISOString().split('T')[0]) {
      updateData.periodStart = new Date(editedPeriodStart);
    }
    if (editedPeriodEnd && editedPeriodEnd !== new Date(settlement.periodEnd).toISOString().split('T')[0]) {
      updateData.periodEnd = new Date(editedPeriodEnd);
    }

    updateMutation.mutate(updateData);
  };

  const handleDownloadPDF = async (format?: string) => {
    setIsDownloadingPDF(true);
    try {
      await downloadSettlementPDF(settlementId, format);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      await sendSettlementEmail(settlementId);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleAddDeduction = () => {
    if (!newDeduction.description || !newDeduction.amount) {
      toast.error('Please fill in all fields');
      return;
    }
    createDeductionMutation.mutate({
      deductionType: newDeduction.deductionType,
      description: newDeduction.description,
      amount: parseFloat(newDeduction.amount),
    });
  };

  const handleDeleteDeduction = (deductionId: string) => {
    if (confirm('Are you sure you want to delete this deduction?')) {
      deleteDeductionMutation.mutate(deductionId);
    }
  };

  const deductionTypeLabels: Record<string, string> = {
    FUEL_ADVANCE: 'Fuel Advance',
    CASH_ADVANCE: 'Cash Advance',
    INSURANCE: 'Insurance',
    ESCROW: 'Escrow',
    FINE: 'Fine',
    REPAIR: 'Repair',
    OTHER: 'Other',
  };

  const deductions = deductionsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settlements">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{settlement.settlementNumber}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColors[settlement.status as SettlementStatus]}>
            {formatStatus(settlement.status)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isDownloadingPDF}
              >
                {isDownloadingPDF ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                    <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[60]">
              <DropdownMenuItem onClick={() => handleDownloadPDF()}>
                Formal (Office)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadPDF('simple')}>
                Driver Friendly (Simple)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={handleSendEmail}
            disabled={isSendingEmail}
            variant="outline"
            size="sm"
          >
            {isSendingEmail ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Email Statement
              </>
            )}
          </Button>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                Save
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Driver Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Driver
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">
              {settlement.driver?.user?.firstName} {settlement.driver?.user?.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {settlement.driver?.driverNumber || 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground">
              {settlement.driver?.user?.email || 'N/A'}
            </p>
            <Link href={`/dashboard/drivers?driverId=${settlement.driverId}`}>
              <Button variant="ghost" size="sm" className="mt-2">
                Edit Driver
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pay Structure - Combined single display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pay Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {(() => {
                const payType = settlement.driver?.payType;
                const payRate = settlement.driver?.payRate;

                if (!payType || payRate === null || payRate === undefined) {
                  return <span className="text-muted-foreground">Not Configured</span>;
                }

                switch (payType) {
                  case 'PER_MILE':
                    return `CPM: ${formatCurrency(payRate)}/mile`;
                  case 'PERCENTAGE':
                    return `Percentage: ${payRate}%`;
                  case 'PER_LOAD':
                    return `Per Load: ${formatCurrency(payRate)}/load`;
                  case 'HOURLY':
                    return `Hourly: ${formatCurrency(payRate)}/hour`;
                  default:
                    return <span className="text-muted-foreground">{payType}</span>;
                }
              })()}
            </div>
            {/* Note: perDiem field removed - use recurring transactions instead */}
          </CardContent>
        </Card>

        {/* Escrow Information */}
        {(settlement.driver?.escrowTargetAmount || settlement.driver?.escrowDeductionPerWeek) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Escrow / Holdings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {settlement.driver?.escrowTargetAmount && (
                <div>
                  <p className="text-sm text-muted-foreground">Target Amount</p>
                  <p className="font-medium">{formatCurrency(settlement.driver.escrowTargetAmount)}</p>
                </div>
              )}
              {settlement.driver?.escrowDeductionPerWeek && (
                <div>
                  <p className="text-sm text-muted-foreground">Deduction Per Week</p>
                  <p className="font-medium">{formatCurrency(settlement.driver.escrowDeductionPerWeek)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="font-medium">{formatCurrency(settlement.driver?.escrowBalance || 0)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Period */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              {isEditing ? (
                <Input
                  type="date"
                  value={editedPeriodStart}
                  onChange={(e) => setEditedPeriodStart(e.target.value)}
                />
              ) : (
                <p className="font-medium">{formatDate(settlement.periodStart)}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              {isEditing ? (
                <Input
                  type="date"
                  value={editedPeriodEnd}
                  onChange={(e) => setEditedPeriodEnd(e.target.value)}
                />
              ) : (
                <p className="font-medium">{formatDate(settlement.periodEnd)}</p>
              )}
            </div>
            {settlement.paidDate && (
              <div>
                <p className="text-sm text-muted-foreground">Paid Date</p>
                <p className="font-medium">{formatDate(settlement.paidDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gross Pay</span>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.01"
                  className="w-32 text-right"
                  value={editedGrossPay}
                  onChange={(e) => setEditedGrossPay(e.target.value)}
                />
              ) : (
                <span className="font-medium">{formatCurrency(settlement.grossPay)}</span>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t mt-2">
              <span className="text-sm text-muted-foreground">Total Miles</span>
              <span className="font-medium">
                {settlement.loads?.reduce((sum: number, load: any) => sum + (load.totalMiles || load.loadedMiles || 0), 0).toLocaleString()} mi
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b mb-2">
              <span className="text-sm text-muted-foreground">Loaded Miles</span>
              <span className="font-medium">
                {settlement.loads?.reduce((sum: number, load: any) => sum + (load.loadedMiles || 0), 0).toLocaleString()} mi
              </span>
            </div>
            {additionsData?.data && additionsData.data.length > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Additions</span>
                <span className="font-medium text-green-600">
                  +{formatCurrency(additionsData.data.reduce((sum: number, a: any) => sum + a.amount, 0))}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Deductions</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(settlement.deductions)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Advances</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(settlement.advances)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Net Pay</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(settlement.netPay)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Additions Section */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Additions
              </CardTitle>
              <Dialog open={isAdditionDialogOpen} onOpenChange={setIsAdditionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Addition
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Addition</DialogTitle>
                    <DialogDescription>
                      Add a bonus, overtime, incentive, or reimbursement to this settlement
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="additionType">Type *</Label>
                      <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between font-normal",
                              !newAddition.deductionType && "text-muted-foreground"
                            )}
                          >
                            {newAddition.deductionType === 'OTHER' && newAddition.description
                              ? newAddition.description
                              : (TRANSACTION_TYPES[newAddition.deductionType as keyof typeof TRANSACTION_TYPES]?.label || "Select type...")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search or create type..."
                              value={searchTerm}
                              onValueChange={setSearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>
                                <Button
                                  variant="ghost"
                                  className="w-full text-sm justify-start h-auto py-1.5 px-2 font-normal"
                                  onClick={async () => {
                                    const foundKey = Object.keys(TRANSACTION_TYPES).find(key =>
                                      TRANSACTION_TYPES[key as keyof typeof TRANSACTION_TYPES].label === searchTerm
                                    );
                                    if (foundKey) {
                                      setNewAddition({ ...newAddition, deductionType: foundKey });
                                      setOpenCombobox(false);
                                      setSearchTerm('');
                                      return;
                                    }

                                    await createCustomType(searchTerm, 'addition');
                                    setNewAddition({ ...newAddition, deductionType: 'OTHER', description: searchTerm });
                                    setOpenCombobox(false);
                                    setSearchTerm('');
                                  }}
                                >
                                  Create "{searchTerm}"
                                </Button>
                              </CommandEmpty>
                              {customAdditions.length > 0 && (
                                <CommandGroup heading="Additions">
                                  {customAdditions.map((ct) => (
                                    <CommandItem
                                      key={ct.id}
                                      value={ct.name}
                                      onSelect={() => {
                                        setNewAddition({
                                          ...newAddition,
                                          deductionType: 'OTHER',
                                          description: ct.name,
                                        });
                                        setOpenCombobox(false);
                                        setSearchTerm('');
                                      }}
                                      className="justify-between"
                                    >
                                      <div className="flex items-center">
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            (newAddition.deductionType === 'OTHER' && newAddition.description === ct.name)
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {ct.name}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={(e) => deleteCustomType(e, ct.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}

                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addDescription">Description *</Label>
                      <Input
                        id="addDescription"
                        placeholder="e.g., Safety Bonus, Extra Hours"
                        value={newAddition.description}
                        onChange={(e) =>
                          setNewAddition({ ...newAddition, description: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addAmount">Amount *</Label>
                      <Input
                        id="addAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newAddition.amount}
                        onChange={(e) =>
                          setNewAddition({ ...newAddition, amount: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAdditionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (newAddition.description && newAddition.amount) {
                          createAdditionMutation.mutate({
                            deductionType: newAddition.deductionType,
                            description: newAddition.description,
                            amount: parseFloat(newAddition.amount),
                          });
                        }
                      }}
                      disabled={createAdditionMutation.isPending}
                    >
                      {createAdditionMutation.isPending ? 'Adding...' : 'Add Addition'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {(!additionsData?.data || additionsData.data.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No additions added yet. Click "Add Addition" to add one.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {additionsData.data.map((addition: any) => (
                    <TableRow key={addition.id}>
                      <TableCell>
                        {addition.deductionType === 'BONUS' ? 'Bonus' :
                          addition.deductionType === 'OVERTIME' ? 'Overtime' :
                            addition.deductionType === 'INCENTIVE' ? 'Incentive' :
                              addition.deductionType === 'REIMBURSEMENT' ? 'Reimbursement' :
                                addition.deductionType}
                      </TableCell>
                      <TableCell>{addition.description}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        +{formatCurrency(addition.amount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAdditionMutation.mutate(addition.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Status Update */}
        {isEditing && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Update Settlement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as SettlementStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="DISPUTED">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {settlement.notes && !isEditing && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{settlement.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Loads Included */}
        {settlement.loads && settlement.loads.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Loads Included ({settlement.loads.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Load #</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Driver Pay</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlement.loads.map((load: any) => (
                      <TableRow key={load.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dashboard/loads/${load.id}`}
                            className="text-primary hover:underline"
                          >
                            {load.loadNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {load.pickupCity}, {load.pickupState} → {load.deliveryCity},{' '}
                          {load.deliveryState}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(load.revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(load.driverPay || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {(load.route?.totalDistance || load.totalMiles || 0) ? `${(load.route?.totalDistance || load.totalMiles || 0)} mi` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {load.deliveredAt ? formatDate(load.deliveredAt) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/loads/${load.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deductions */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Deductions ({deductions.length})
              </CardTitle>
              <Dialog open={isDeductionDialogOpen} onOpenChange={setIsDeductionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Deduction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Deduction</DialogTitle>
                    <DialogDescription>
                      Add a deduction to this settlement. The settlement totals will be recalculated automatically.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="deductionType">Type</Label>
                      <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between font-normal",
                              !newDeduction.deductionType && "text-muted-foreground"
                            )}
                          >
                            {newDeduction.deductionType === 'OTHER' && newDeduction.description
                              ? newDeduction.description
                              : (TRANSACTION_TYPES[newDeduction.deductionType as keyof typeof TRANSACTION_TYPES]?.label || "Select type...")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search or create type..."
                              value={searchTerm}
                              onValueChange={setSearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>
                                <Button
                                  variant="ghost"
                                  className="w-full text-sm justify-start h-auto py-1.5 px-2 font-normal"
                                  onClick={async () => {
                                    const foundKey = Object.keys(TRANSACTION_TYPES).find(key =>
                                      TRANSACTION_TYPES[key as keyof typeof TRANSACTION_TYPES].label === searchTerm
                                    );
                                    if (foundKey) {
                                      setNewDeduction({ ...newDeduction, deductionType: foundKey });
                                      setOpenCombobox(false);
                                      setSearchTerm('');
                                      return;
                                    }
                                    await createCustomType(searchTerm, 'deduction');
                                    setNewDeduction({ ...newDeduction, deductionType: 'OTHER', description: searchTerm });
                                    setOpenCombobox(false);
                                    setSearchTerm('');
                                  }}
                                >
                                  Create "{searchTerm}"
                                </Button>
                              </CommandEmpty>
                              {customDeductions.length > 0 && (
                                <CommandGroup heading="Deductions">
                                  {customDeductions.map((ct) => (
                                    <CommandItem
                                      key={ct.id}
                                      value={ct.name}
                                      onSelect={() => {
                                        setNewDeduction({
                                          ...newDeduction,
                                          deductionType: 'OTHER',
                                          description: ct.name,
                                        });
                                        setOpenCombobox(false);
                                        setSearchTerm('');
                                      }}
                                      className="justify-between"
                                    >
                                      <div className="flex items-center">
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            (newDeduction.deductionType === 'OTHER' && newDeduction.description === ct.name)
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {ct.name}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={(e) => deleteCustomType(e, ct.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newDeduction.description}
                        onChange={(e) => setNewDeduction({ ...newDeduction, description: e.target.value })}
                        placeholder="Enter deduction description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newDeduction.amount}
                        onChange={(e) => setNewDeduction({ ...newDeduction, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDeductionDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddDeduction}
                      disabled={createDeductionMutation.isPending}
                    >
                      {createDeductionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add Deduction'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {deductions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No deductions added yet. Click "Add Deduction" to add one.
              </p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductions.map((deduction: any) => (
                      <TableRow key={deduction.id}>
                        <TableCell>{deductionTypeLabels[deduction.deductionType] || deduction.deductionType}</TableCell>
                        <TableCell className="text-right text-red-600">
                          -{formatCurrency(deduction.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDeduction(deduction.id)}
                            disabled={deleteDeductionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 bg-muted border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Deductions:</span>
                    <span className="text-lg font-bold text-red-600">
                      -{formatCurrency(deductions.reduce((sum: number, d: any) => sum + d.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

