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
import LoadBasicInfoTab from './LoadDetailTabs/LoadBasicInfoTab';
import LoadLocationDetailsTab from './LoadDetailTabs/LoadLocationDetailsTab';
import LoadSpecificationsTab from './LoadDetailTabs/LoadSpecificationsTab';
import LoadFinancialTab from './LoadDetailTabs/LoadFinancialTab';
import LoadRelatedItemsTab from './LoadDetailTabs/LoadRelatedItemsTab';
import LoadHistoryDocumentsTab from './LoadDetailTabs/LoadHistoryDocumentsTab';

interface LoadDetailProps {
  load: any; // Full load object from Prisma
  availableDrivers?: any[]; // Available drivers for assignment
  availableTrucks?: any[]; // Available trucks for assignment
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

export default function LoadDetail({ load, availableDrivers = [], availableTrucks = [] }: LoadDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { data: session } = useSession();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Fetch customers for the combobox
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  // Prepare customers list - include current customer if not already in list
  const customers = React.useMemo(() => {
    const fetchedCustomers = customersData?.data || [];
    const currentCustomer = load.customer;
    
    // Check if current customer is already in the list
    const hasCurrentCustomer = fetchedCustomers.some((c: any) => c.id === currentCustomer?.id);
    
    if (currentCustomer && !hasCurrentCustomer) {
      // Add current customer to the list
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
  
  // MC state is managed via cookies, not URL params
  
  // Form state for editable fields - expanded to include all fields from all tabs
  const [formData, setFormData] = useState({
    // Basic Info
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
    // Location Details
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
    // Specifications
    weight: load.weight || null,
    pieces: load.pieces || null,
    commodity: load.commodity || '',
    pallets: load.pallets || null,
    temperature: load.temperature || '',
    hazmat: load.hazmat || false,
    hazmatClass: load.hazmatClass || '',
    // Financial
    revenue: load.revenue || 0,
    driverPay: load.driverPay || null,
    fuelAdvance: load.fuelAdvance || 0,
    serviceFee: load.serviceFee || null,
    loadedMiles: load.loadedMiles || null,
    emptyMiles: load.emptyMiles || null,
    totalMiles: load.totalMiles || null,
    // Notes
    dispatchNotes: load.dispatchNotes || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateLoad(load.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load', load.id] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      toast.success('Load updated successfully');
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update load');
    },
  });

  const handleSave = () => {
    const updatePayload: any = {};
    
    // Helper to check if value changed
    const hasChanged = (field: string, oldValue: any, newValue: any) => {
      if (oldValue === newValue) return false;
      if (oldValue === null && !newValue) return false;
      if (!oldValue && newValue === null) return false;
      if (oldValue === undefined && newValue === '') return false;
      return true;
    };

    // Basic Info fields
    if (hasChanged('truckId', load.truckId, formData.truckId)) updatePayload.truckId = formData.truckId || null;
    if (hasChanged('trailerId', load.trailerId, formData.trailerId)) updatePayload.trailerId = formData.trailerId || null;
    if (hasChanged('trailerNumber', load.trailerNumber, formData.trailerNumber)) updatePayload.trailerNumber = formData.trailerNumber || null;
    if (hasChanged('driverId', load.driverId, formData.driverId)) updatePayload.driverId = formData.driverId || null;
    if (hasChanged('coDriverId', load.coDriverId, formData.coDriverId)) updatePayload.coDriverId = formData.coDriverId || null;
    if (hasChanged('customerId', load.customerId, formData.customerId)) updatePayload.customerId = formData.customerId || null;
    if (hasChanged('status', load.status, formData.status)) updatePayload.status = formData.status;
    if (hasChanged('dispatchStatus', load.dispatchStatus, formData.dispatchStatus)) updatePayload.dispatchStatus = formData.dispatchStatus || null;
    if (hasChanged('loadType', load.loadType, formData.loadType)) updatePayload.loadType = formData.loadType;
    if (hasChanged('equipmentType', load.equipmentType, formData.equipmentType)) updatePayload.equipmentType = formData.equipmentType || null;

    // Location fields
    if (hasChanged('pickupLocation', load.pickupLocation, formData.pickupLocation)) updatePayload.pickupLocation = formData.pickupLocation || null;
    if (hasChanged('pickupAddress', load.pickupAddress, formData.pickupAddress)) updatePayload.pickupAddress = formData.pickupAddress || null;
    if (hasChanged('pickupCity', load.pickupCity, formData.pickupCity)) updatePayload.pickupCity = formData.pickupCity || null;
    if (hasChanged('pickupState', load.pickupState, formData.pickupState)) updatePayload.pickupState = formData.pickupState || null;
    if (hasChanged('pickupZip', load.pickupZip, formData.pickupZip)) updatePayload.pickupZip = formData.pickupZip || null;
    if (hasChanged('pickupCompany', load.pickupCompany, formData.pickupCompany)) updatePayload.pickupCompany = formData.pickupCompany || null;
    if (hasChanged('pickupDate', load.pickupDate, formData.pickupDate)) updatePayload.pickupDate = formData.pickupDate || null;
    if (hasChanged('pickupTimeStart', load.pickupTimeStart, formData.pickupTimeStart)) updatePayload.pickupTimeStart = formData.pickupTimeStart || null;
    if (hasChanged('pickupTimeEnd', load.pickupTimeEnd, formData.pickupTimeEnd)) updatePayload.pickupTimeEnd = formData.pickupTimeEnd || null;
    if (hasChanged('pickupContact', load.pickupContact, formData.pickupContact)) updatePayload.pickupContact = formData.pickupContact || null;
    if (hasChanged('pickupPhone', load.pickupPhone, formData.pickupPhone)) updatePayload.pickupPhone = formData.pickupPhone || null;
    if (hasChanged('pickupNotes', load.pickupNotes, formData.pickupNotes)) updatePayload.pickupNotes = formData.pickupNotes || null;
    
    if (hasChanged('deliveryLocation', load.deliveryLocation, formData.deliveryLocation)) updatePayload.deliveryLocation = formData.deliveryLocation || null;
    if (hasChanged('deliveryAddress', load.deliveryAddress, formData.deliveryAddress)) updatePayload.deliveryAddress = formData.deliveryAddress || null;
    if (hasChanged('deliveryCity', load.deliveryCity, formData.deliveryCity)) updatePayload.deliveryCity = formData.deliveryCity || null;
    if (hasChanged('deliveryState', load.deliveryState, formData.deliveryState)) updatePayload.deliveryState = formData.deliveryState || null;
    if (hasChanged('deliveryZip', load.deliveryZip, formData.deliveryZip)) updatePayload.deliveryZip = formData.deliveryZip || null;
    if (hasChanged('deliveryCompany', load.deliveryCompany, formData.deliveryCompany)) updatePayload.deliveryCompany = formData.deliveryCompany || null;
    if (hasChanged('deliveryDate', load.deliveryDate, formData.deliveryDate)) updatePayload.deliveryDate = formData.deliveryDate || null;
    if (hasChanged('deliveryTimeStart', load.deliveryTimeStart, formData.deliveryTimeStart)) updatePayload.deliveryTimeStart = formData.deliveryTimeStart || null;
    if (hasChanged('deliveryTimeEnd', load.deliveryTimeEnd, formData.deliveryTimeEnd)) updatePayload.deliveryTimeEnd = formData.deliveryTimeEnd || null;
    if (hasChanged('deliveryContact', load.deliveryContact, formData.deliveryContact)) updatePayload.deliveryContact = formData.deliveryContact || null;
    if (hasChanged('deliveryPhone', load.deliveryPhone, formData.deliveryPhone)) updatePayload.deliveryPhone = formData.deliveryPhone || null;
    if (hasChanged('deliveryNotes', load.deliveryNotes, formData.deliveryNotes)) updatePayload.deliveryNotes = formData.deliveryNotes || null;

    // Specification fields
    if (hasChanged('weight', load.weight, formData.weight)) updatePayload.weight = formData.weight ? Number(formData.weight) : null;
    if (hasChanged('pieces', load.pieces, formData.pieces)) updatePayload.pieces = formData.pieces ? Number(formData.pieces) : null;
    if (hasChanged('commodity', load.commodity, formData.commodity)) updatePayload.commodity = formData.commodity || null;
    if (hasChanged('pallets', load.pallets, formData.pallets)) updatePayload.pallets = formData.pallets ? Number(formData.pallets) : null;
    if (hasChanged('temperature', load.temperature, formData.temperature)) updatePayload.temperature = formData.temperature || null;
    if (hasChanged('hazmat', load.hazmat, formData.hazmat)) updatePayload.hazmat = formData.hazmat || false;
    if (hasChanged('hazmatClass', load.hazmatClass, formData.hazmatClass)) updatePayload.hazmatClass = formData.hazmatClass || null;

    // Financial fields
    if (hasChanged('revenue', load.revenue, formData.revenue)) updatePayload.revenue = formData.revenue ? Number(formData.revenue) : 0;
    if (hasChanged('driverPay', load.driverPay, formData.driverPay)) updatePayload.driverPay = formData.driverPay ? Number(formData.driverPay) : null;
    if (hasChanged('fuelAdvance', load.fuelAdvance, formData.fuelAdvance)) updatePayload.fuelAdvance = formData.fuelAdvance ? Number(formData.fuelAdvance) : 0;
    if (hasChanged('serviceFee', load.serviceFee, formData.serviceFee)) updatePayload.serviceFee = formData.serviceFee ? Number(formData.serviceFee) : null;
    if (hasChanged('loadedMiles', load.loadedMiles, formData.loadedMiles)) updatePayload.loadedMiles = formData.loadedMiles ? Number(formData.loadedMiles) : null;
    if (hasChanged('emptyMiles', load.emptyMiles, formData.emptyMiles)) updatePayload.emptyMiles = formData.emptyMiles ? Number(formData.emptyMiles) : null;
    if (hasChanged('totalMiles', load.totalMiles, formData.totalMiles)) updatePayload.totalMiles = formData.totalMiles ? Number(formData.totalMiles) : null;

    // Notes
    if (hasChanged('dispatchNotes', load.dispatchNotes, formData.dispatchNotes)) updatePayload.dispatchNotes = formData.dispatchNotes || null;
    
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/loads">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{load.loadNumber}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColors[load.status as LoadStatus]}>
            {formatStatus(load.status)}
          </Badge>
          <DispatchStatusBadge status={load.dispatchStatus} />
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
              className="h-8 text-xs"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {updateMutation.isPending ? 'Saving...' : 'Save All'}
            </Button>
          )}
          {can('loads.delete') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="h-8 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Billing Hold Warning Banner */}
      {load.isBillingHold && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                INVOICING BLOCKED
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{load.billingHoldReason || 'This load is on billing hold. Rate Con update required before invoicing.'}</p>
                <p className="mt-1 text-xs text-yellow-600">
                  Note: Driver settlement (AP) can proceed independently.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Load</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete load {load.loadNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(load.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content - Tabs */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic" className="text-xs sm:text-sm">Basic Info</TabsTrigger>
            <TabsTrigger value="location" className="text-xs sm:text-sm">Location</TabsTrigger>
            <TabsTrigger value="specifications" className="text-xs sm:text-sm">Specifications</TabsTrigger>
            <TabsTrigger value="financial" className="text-xs sm:text-sm">Financial</TabsTrigger>
            <TabsTrigger value="related" className="text-xs sm:text-sm">Related Items</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">History & Docs</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4">
            <LoadBasicInfoTab
              load={load}
              formData={formData}
              onFormDataChange={setFormData}
                              availableDrivers={availableDrivers}
                              availableTrucks={availableTrucks}
              customers={customers}
            />
          </TabsContent>

          <TabsContent value="location" className="mt-4">
            <LoadLocationDetailsTab
              load={load}
              formData={formData}
              onFormDataChange={setFormData}
            />
          </TabsContent>

          <TabsContent value="specifications" className="mt-4">
            <LoadSpecificationsTab
              load={load}
              formData={formData}
              onFormDataChange={setFormData}
            />
          </TabsContent>

          <TabsContent value="financial" className="mt-4">
            <LoadFinancialTab
              load={load}
              formData={formData}
              onFormDataChange={setFormData}
            />
          </TabsContent>

          <TabsContent value="related" className="mt-4">
            <LoadRelatedItemsTab
              load={load}
              formData={formData}
              onFormDataChange={setFormData}
              availableDrivers={availableDrivers}
              availableTrucks={availableTrucks}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <LoadHistoryDocumentsTab load={load} />
          </TabsContent>
        </Tabs>
              </div>
    </div>
  );
}
