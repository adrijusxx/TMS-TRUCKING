'use client';

import { useState } from 'react';
import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatDateTime, apiUrl } from '@/lib/utils';
import { LoadStatus } from '@prisma/client';
import {
  ArrowLeft,
  Trash2,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { useSession } from 'next-auth/react';
import DispatchStatusSelector, { DispatchStatusBadge } from './DispatchStatusSelector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadDetailsTab from './LoadDetailTabs/LoadDetailsTab';
import LoadRouteTab from './LoadDetailTabs/LoadRouteTab';
import LoadFinancialTab from './LoadDetailTabs/LoadFinancialTab';
import LoadHistoryDocumentsTab from './LoadDetailTabs/LoadHistoryDocumentsTab';

interface LoadDetailProps {
  load: any;
  availableDrivers?: any[];
  availableTrucks?: any[];
  onSuccess?: () => void;
  onCancel?: () => void;
  isSheet?: boolean;
}

const statusColors: Record<LoadStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  EN_ROUTE_PICKUP: 'bg-purple-100 text-purple-800 border-purple-200',
  AT_PICKUP: 'bg-orange-100 text-orange-800 border-orange-200',
  LOADED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  EN_ROUTE_DELIVERY: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  AT_DELIVERY: 'bg-pink-100 text-pink-800 border-pink-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  BILLING_HOLD: 'bg-amber-100 text-amber-800 border-amber-200',
  READY_TO_BILL: 'bg-lime-100 text-lime-800 border-lime-200',
  INVOICED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PAID: 'bg-teal-100 text-teal-800 border-teal-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

function formatStatus(status: LoadStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function deleteLoad(loadId: string) {
  const response = await fetch(apiUrl(`/api/loads/${loadId}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete load');
  }
  return response.json();
}

async function updateLoad(loadId: string, data: any) {
  const response = await fetch(apiUrl(`/api/loads/${loadId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update load');
  }
  return response.json();
}

async function fetchCustomers() {
  const response = await fetch(apiUrl('/api/customers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
}

export default function LoadDetail({
  load,
  availableDrivers = [],
  availableTrucks = [],
  onSuccess,
  onCancel,
  isSheet = false,
}: LoadDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { data: session } = useSession();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const customers = React.useMemo(() => {
    const fetchedCustomers = customersData?.data || [];
    const currentCustomer = load.customer;

    const hasCurrentCustomer = fetchedCustomers.some((c: any) => c.id === currentCustomer?.id);

    if (currentCustomer && !hasCurrentCustomer) {
      return [
        {
          id: currentCustomer.id,
          name: currentCustomer.name,
          customerNumber: currentCustomer.customerNumber,
          email: currentCustomer.email,
        },
        ...fetchedCustomers,
      ];
    }

    return fetchedCustomers;
  }, [customersData, load.customer]);

  const [formData, setFormData] = useState({
    truckId: load.truckId || '',
    trailerId: load.trailerId || '',
    trailerNumber: load.trailerNumber || '',
    driverId: load.driverId || '',
    coDriverId: load.coDriverId || '',
    customerId: load.customerId || '',
    status: load.status || 'PENDING',
    dispatchStatus: load.dispatchStatus || null,
    loadType: load.loadType || 'FTL',
    equipmentType: load.equipmentType || '',
    pickupLocation: load.pickupLocation || '',
    pickupAddress: load.pickupAddress || '',
    pickupCity: load.pickupCity || '',
    pickupState: load.pickupState || '',
    pickupZip: load.pickupZip || '',
    pickupCompany: load.pickupCompany || '',
    pickupDate: load.pickupDate || null,
    pickupTimeStart: load.pickupTimeStart || null,
    pickupTimeEnd: load.pickupTimeEnd || null,
    pickupContact: load.pickupContact || '',
    pickupPhone: load.pickupPhone || '',
    pickupNotes: load.pickupNotes || '',
    deliveryLocation: load.deliveryLocation || '',
    deliveryAddress: load.deliveryAddress || '',
    deliveryCity: load.deliveryCity || '',
    deliveryState: load.deliveryState || '',
    deliveryZip: load.deliveryZip || '',
    deliveryCompany: load.deliveryCompany || '',
    deliveryDate: load.deliveryDate || null,
    deliveryTimeStart: load.deliveryTimeStart || null,
    deliveryTimeEnd: load.deliveryTimeEnd || null,
    deliveryContact: load.deliveryContact || '',
    deliveryPhone: load.deliveryPhone || '',
    deliveryNotes: load.deliveryNotes || '',
    weight: load.weight || null,
    pieces: load.pieces || null,
    commodity: load.commodity || '',
    pallets: load.pallets || null,
    temperature: load.temperature || '',
    hazmat: load.hazmat || false,
    hazmatClass: load.hazmatClass || '',
    revenue: load.revenue || 0,
    driverPay: load.driverPay || null,
    fuelAdvance: load.fuelAdvance || 0,
    serviceFee: load.serviceFee || null,
    loadedMiles: load.loadedMiles || null,
    emptyMiles: load.emptyMiles || null,
    totalMiles: load.totalMiles || null,
    dispatchNotes: load.dispatchNotes || '',
    tripId: load.tripId || '',
    shipmentId: load.shipmentId || '',
    dispatcherId: load.dispatcherId || '',
    revenuePerMile: load.revenuePerMile || null,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateLoad(load.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load', load.id] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      toast.success('Load updated successfully');
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update load');
    },
  });

  const handleSave = () => {
    const updatePayload: any = {};

    const hasChanged = (field: string, oldValue: any, newValue: any) => {
      if (oldValue === newValue) return false;
      if (oldValue === null && !newValue) return false;
      if (!oldValue && newValue === null) return false;
      if (oldValue === undefined && newValue === '') return false;
      return true;
    };

    // All fields
    const fields = [
      'truckId', 'trailerId', 'trailerNumber', 'driverId', 'coDriverId', 'customerId',
      'status', 'dispatchStatus', 'loadType', 'equipmentType',
      'pickupLocation', 'pickupAddress', 'pickupCity', 'pickupState', 'pickupZip',
      'pickupCompany', 'pickupDate', 'pickupTimeStart', 'pickupTimeEnd',
      'pickupContact', 'pickupPhone', 'pickupNotes',
      'deliveryLocation', 'deliveryAddress', 'deliveryCity', 'deliveryState', 'deliveryZip',
      'deliveryCompany', 'deliveryDate', 'deliveryTimeStart', 'deliveryTimeEnd',
      'deliveryContact', 'deliveryPhone', 'deliveryNotes',
      'commodity', 'hazmat', 'hazmatClass', 'dispatchNotes',
      'tripId', 'shipmentId', 'dispatcherId'
    ];

    const numericFields = ['weight', 'pieces', 'pallets', 'revenue', 'driverPay',
      'fuelAdvance', 'serviceFee', 'loadedMiles', 'emptyMiles', 'totalMiles', 'revenuePerMile'];

    fields.forEach(field => {
      if (hasChanged(field, (load as any)[field], (formData as any)[field])) {
        updatePayload[field] = (formData as any)[field] || null;
      }
    });

    numericFields.forEach(field => {
      if (hasChanged(field, (load as any)[field], (formData as any)[field])) {
        const value = (formData as any)[field];
        updatePayload[field] = value ? Number(value) : null;
      }
    });

    if (Object.keys(updatePayload).length > 0) {
      updateMutation.mutate(updatePayload);
    } else {
      toast.info('No changes to save');
    }
  };

  const deleteMutation = useMutation({
    mutationFn: deleteLoad,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      toast.success('Load deleted successfully');
      router.push('/dashboard/loads');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete load');
    },
  });

  return (
    <div className="space-y-3">
      {/* Header - Compact */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Link href="/dashboard/loads">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <h1 className="text-lg font-bold">{load.loadNumber}</h1>
          {/* Show DispatchStatus if set, otherwise show main LoadStatus */}
          {load.dispatchStatus ? (
            <DispatchStatusBadge status={load.dispatchStatus} />
          ) : (
            <Badge variant="outline" className={`text-xs ${statusColors[load.status as LoadStatus]}`}>
              {formatStatus(load.status)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <DispatchStatusSelector
            loadId={load.id}
            currentDispatchStatus={load.dispatchStatus}
          />
          {can('loads.edit') && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="h-7 text-xs px-2"
            >
              <Save className="h-3 w-3 mr-1" />
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          )}
          {can('loads.delete') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="h-7 text-xs px-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Billing Hold Warning */}
      {load.isBillingHold && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded text-xs">
          <p className="font-medium text-yellow-800">INVOICING BLOCKED</p>
          <p className="text-yellow-700">{load.billingHoldReason || 'Rate Con update required'}</p>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Load</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete load {load.loadNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(load.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 text-xs"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tabs - Merged to 4 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-8">
          <TabsTrigger value="details" className="text-xs h-7">Details</TabsTrigger>
          <TabsTrigger value="route" className="text-xs h-7">Route</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs h-7">Financial</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs h-7">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-3">
          <LoadDetailsTab
            load={load}
            formData={formData}
            onFormDataChange={setFormData}
            availableDrivers={availableDrivers}
            availableTrucks={availableTrucks}
            customers={customers}
          />
        </TabsContent>

        <TabsContent value="route" className="mt-3">
          <LoadRouteTab
            load={load}
            formData={formData}
            onFormDataChange={setFormData}
          />
        </TabsContent>

        <TabsContent value="financial" className="mt-3">
          <LoadFinancialTab
            load={load}
            formData={formData}
            onFormDataChange={setFormData}
            onLoadRefetch={() => {
              queryClient.invalidateQueries({ queryKey: ['load', load.id] });
            }}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-3">
          <LoadHistoryDocumentsTab load={load} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
