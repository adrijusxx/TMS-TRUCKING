'use client';

import { useState } from 'react';
import * as React from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import LoadDocumentWarnings from './LoadDocumentWarnings';
import LoadBasicInfoTab from './LoadDetailTabs/LoadBasicInfoTab';
import LoadLocationDetailsTab from './LoadDetailTabs/LoadLocationDetailsTab';
import LoadSpecificationsTab from './LoadDetailTabs/LoadSpecificationsTab';
import LoadFinancialTab from './LoadDetailTabs/LoadFinancialTab';
import LoadRelatedItemsTab from './LoadDetailTabs/LoadRelatedItemsTab';
import LoadHistoryDocumentsTab from './LoadDetailTabs/LoadHistoryDocumentsTab';

interface LoadInlineEditProps {
  row: {
    id: string;
    loadNumber: string;
    status: string;
    customerId?: string | null;
    customer?: { id: string; name: string } | null;
    driverId?: string | null;
    driver?: { id: string; driverNumber: string } | null;
    truckId?: string | null;
    truck?: { id: string; truckNumber: string } | null;
    trailerId?: string | null;
    trailer?: { id: string; trailerNumber: string } | null;
    pickupCity?: string | null;
    pickupState?: string | null;
    deliveryCity?: string | null;
    deliveryState?: string | null;
    revenue?: number | null;
    totalMiles?: number | null;
  };
  onSave?: () => void;
  onCancel?: () => void;
}

async function fetchLoadWithDetails(id: string) {
  const response = await fetch(apiUrl(`/api/loads/${id}`));
  if (!response.ok) throw new Error('Failed to fetch load details');
  const result = await response.json();
  return result.data;
}

async function fetchCustomers() {
  const response = await fetch(apiUrl('/api/customers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch customers');
  const result = await response.json();
  return result.data || [];
}

async function fetchDrivers() {
  const response = await fetch(apiUrl('/api/drivers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch drivers');
  const result = await response.json();
  return result.data || [];
}

async function fetchTrucks() {
  const response = await fetch(apiUrl('/api/trucks?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch trucks');
  const result = await response.json();
  return result.data || [];
}

async function fetchTrailers() {
  const response = await fetch(apiUrl('/api/trailers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch trailers');
  const result = await response.json();
  return result.data || [];
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

export default function LoadInlineEdit({ row, onSave, onCancel }: LoadInlineEditProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch full load details
  const { data: load, isLoading: isLoadingLoad } = useQuery({
    queryKey: ['load', row.id],
    queryFn: () => fetchLoadWithDetails(row.id),
    enabled: !!row.id,
    staleTime: 0, // Always refetch to get fresh data
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Fetch available resources
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers'],
    queryFn: fetchDrivers,
  });

  const { data: trucksData } = useQuery({
    queryKey: ['trucks'],
    queryFn: fetchTrucks,
  });

  // Prepare data arrays - ensure they're always arrays
  const customers = React.useMemo(() => {
    // Ensure customersData is an array
    const fetched = Array.isArray(customersData) ? customersData : [];
    const current = load?.customer;
    if (current && !fetched.some((c: any) => c.id === current.id)) {
      return [{ id: current.id, name: current.name, customerNumber: current.customerNumber }, ...fetched];
    }
    return fetched;
  }, [customersData, load?.customer]);

  const availableDrivers = Array.isArray(driversData) ? driversData : [];
  const availableTrucks = Array.isArray(trucksData) ? trucksData : [];

  // Form state for editable fields - expanded to include all fields from all tabs
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // Reset formData when row.id changes (e.g., switching to a different load)
  React.useEffect(() => {
    setFormData({});
  }, [row.id]);

  // Initialize formData when load is available
  React.useEffect(() => {
    if (load && load.id) {
      const initialFormData = {
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
      };
      
      // Always update formData when load data changes (load is source of truth)
      setFormData(initialFormData);
    } else if (!load && Object.keys(formData).length > 0) {
      // Reset formData when load is cleared
      setFormData({});
    }
  }, [load, row.id]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateLoad(row.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['load', row.id] });
      toast.success('Load updated successfully');
      onSave?.();
      setIsSaving(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update load');
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    if (!load) return;

    setIsSaving(true);
    
    // Compare formData with original load and only include changed fields
    const updatePayload: any = {};
    
    Object.keys(formData).forEach((key) => {
      const formValue = (formData as any)[key];
      const originalValue = (load as any)[key];
      
      // Handle date comparisons
      if (formValue instanceof Date && originalValue instanceof Date) {
        if (formValue.getTime() !== originalValue.getTime()) {
          updatePayload[key] = formValue;
        }
      } else if (formValue !== originalValue) {
        updatePayload[key] = formValue === '' ? null : formValue;
      }
    });

    if (Object.keys(updatePayload).length === 0) {
      toast.info('No changes to save');
      setIsSaving(false);
      return;
    }

    updateMutation.mutate(updatePayload);
  };

  if (isLoadingLoad || !load) {
    return (
      <Card className="m-4 border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading load details...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="m-4 border-l-4 border-l-primary">
      <CardContent className="pt-6">
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

          {/* Document Warnings */}
          <div className="pt-4 border-t">
            <LoadDocumentWarnings loadId={row.id} loadNumber={row.loadNumber} />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving || updateMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}




