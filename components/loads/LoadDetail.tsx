'use client';

import { useState } from 'react';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiUrl } from '@/lib/utils';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import DispatchStatusSelector from './DispatchStatusSelector';
import { LoadDetailTrackingCard } from './LoadDetailTrackingCard';
import { ProfitabilityBadge } from './ProfitabilityBadge';
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
import LoadDetailLeftPanel from './LoadDetailTabs/LoadDetailLeftPanel';
import LoadDetailRightPanel from './LoadDetailTabs/LoadDetailRightPanel';

interface LoadDetailProps {
  load: any;
  availableDrivers?: any[];
  availableTrucks?: any[];
  availableTrailers?: any[];
  onSuccess?: () => void;
  onCancel?: () => void;
  isSheet?: boolean;
}

async function deleteLoad(loadId: string) {
  const response = await fetch(apiUrl(`/api/loads/${loadId}`), { method: 'DELETE' });
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
  availableTrailers = [],
  onSuccess,
  onCancel,
}: LoadDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
    urgency: load.urgency || 'NORMAL',
    factoringStatus: load.factoringStatus || null,
    trackingStatus: load.trackingStatus || null,
    eta: load.eta || null,
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
    loadedMiles: load.loadedMiles || null,
    emptyMiles: load.emptyMiles || null,
    totalMiles: load.totalMiles || null,
    dispatchNotes: load.dispatchNotes || '',
    shipmentId: load.shipmentId || '',
    dispatcherId: load.dispatcherId || '',
    revenuePerMile: load.revenuePerMile || null,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateLoad(load.id, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['load', load.id] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });

      const completionWarnings = data?.meta?.warnings;
      const completionResult = data?.meta?.completionResult;

      if (completionWarnings && completionWarnings.length > 0) {
        toast.warning('Load Updated (Action Required)', {
          description: (
            <div className="flex flex-col gap-1">
              <span>Load updated but issues prevented completion workflow:</span>
              <ul className="list-disc list-inside text-xs mt-1">
                {completionWarnings.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ),
          duration: 8000,
        });
      } else if (completionResult?.success) {
        toast.success('Load Delivered & Ready', {
          description: 'Load is validated, synced to accounting, and ready for settlement.',
          action: {
            label: 'Create Settlement',
            onClick: () => {
              const driverId = data?.data?.driverId || load.driverId;
              if (driverId) {
                window.location.href = `/dashboard/settlements/generate?driverId=${driverId}`;
              } else {
                window.location.href = '/dashboard/settlements/generate';
              }
            }
          },
          duration: 8000,
        });
      } else {
        toast.success('Load updated successfully');
      }

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

    const fields = [
      'truckId', 'trailerId', 'trailerNumber', 'driverId', 'coDriverId', 'customerId',
      'status', 'dispatchStatus', 'loadType', 'equipmentType',
      'urgency', 'factoringStatus', 'trackingStatus', 'eta',
      'pickupLocation', 'pickupAddress', 'pickupCity', 'pickupState', 'pickupZip',
      'pickupCompany', 'pickupDate', 'pickupTimeStart', 'pickupTimeEnd',
      'pickupContact', 'pickupPhone', 'pickupNotes',
      'deliveryLocation', 'deliveryAddress', 'deliveryCity', 'deliveryState', 'deliveryZip',
      'deliveryCompany', 'deliveryDate', 'deliveryTimeStart', 'deliveryTimeEnd',
      'deliveryContact', 'deliveryPhone', 'deliveryNotes',
      'commodity', 'hazmat', 'hazmatClass', 'dispatchNotes',
      'shipmentId', 'dispatcherId'
    ];

    const numericFields = ['weight', 'pieces', 'pallets', 'revenue', 'driverPay',
      'fuelAdvance', 'loadedMiles', 'emptyMiles', 'totalMiles', 'revenuePerMile', 'quickPayFee'];

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
      {/* Header */}
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
          <ProfitabilityBadge
            revenue={load.revenue}
            totalCosts={(load.driverPay || 0) + (load.totalExpenses || 0)}
            showPercent
          />
        </div>
        <div className="flex items-center gap-2">
          <LoadDetailTrackingCard loadId={load.id} loadStatus={load.status} />
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

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel — Assignment + Route */}
        <div className="lg:col-span-7">
          <LoadDetailLeftPanel
            load={load}
            formData={formData}
            onFormDataChange={setFormData}
            availableDrivers={availableDrivers}
            availableTrucks={availableTrucks}
            availableTrailers={availableTrailers}
            customers={customers}
            onLoadRefetch={() => {
              queryClient.invalidateQueries({ queryKey: ['load', load.id] });
            }}
          />
        </div>

        {/* Right Panel — Info + Details */}
        <div className="lg:col-span-5">
          <LoadDetailRightPanel
            load={load}
            loadId={load.id}
            formData={formData}
            onFormDataChange={setFormData}
            onLoadRefetch={() => {
              queryClient.invalidateQueries({ queryKey: ['load', load.id] });
            }}
            customers={customers}
          />
        </div>
      </div>

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
    </div>
  );
}
