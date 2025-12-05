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
import LoadDetailsTab from './LoadDetailTabs/LoadDetailsTab';
import LoadRouteTab from './LoadDetailTabs/LoadRouteTab';
import LoadFinancialTab from './LoadDetailTabs/LoadFinancialTab';
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
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);
  const hasTriggeredRecalc = React.useRef(false);

  const { data: load, isLoading: isLoadingLoad } = useQuery({
    queryKey: ['load', row.id],
    queryFn: () => fetchLoadWithDetails(row.id),
    enabled: !!row.id,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

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

  const customers = React.useMemo(() => {
    const fetched = Array.isArray(customersData) ? customersData : [];
    const current = load?.customer;
    if (current && !fetched.some((c: any) => c.id === current.id)) {
      return [{ id: current.id, name: current.name, customerNumber: current.customerNumber }, ...fetched];
    }
    return fetched;
  }, [customersData, load?.customer]);

  const availableDrivers = Array.isArray(driversData) ? driversData : [];
  const availableTrucks = Array.isArray(trucksData) ? trucksData : [];

  const [formData, setFormData] = useState<Record<string, any>>({});
  
  React.useEffect(() => {
    setFormData({});
  }, [row.id]);

  React.useEffect(() => {
    if (load && load.id) {
      const initialFormData = {
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
      };
      
      setFormData(initialFormData);
    } else if (!load && Object.keys(formData).length > 0) {
      setFormData({});
    }
  }, [load, row.id]);

  React.useEffect(() => {
    if (
      load &&
      load.id &&
      load.driverId &&
      (!load.driverPay || load.driverPay === 0) &&
      !hasTriggeredRecalc.current
    ) {
      hasTriggeredRecalc.current = true;
      fetch(apiUrl(`/api/loads/${row.id}/recalculate-driver-pay`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
        .then((response) => {
          if (response.ok) {
            queryClient.invalidateQueries({ queryKey: ['load', row.id] });
          }
        })
        .catch((error) => {
          console.debug('Auto-recalculate driver pay:', error);
        });
    }
    
    if (load?.id !== row.id) {
      hasTriggeredRecalc.current = false;
    }
  }, [load?.id, load?.driverId, load?.driverPay, row.id, queryClient]);

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
    
    const updatePayload: any = {};
    
    Object.keys(formData).forEach((key) => {
      const formValue = (formData as any)[key];
      const originalValue = (load as any)[key];
      
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
      <Card className="m-2 border-l-4 border-l-primary">
        <CardContent className="py-4">
          <div className="text-center text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="m-2 border-l-4 border-l-primary">
      <CardContent className="py-3">
        <div className="space-y-3">
          {/* Tabs - 4 tabs matching LoadDetail */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-7">
              <TabsTrigger value="details" className="text-xs h-6">Details</TabsTrigger>
              <TabsTrigger value="route" className="text-xs h-6">Route</TabsTrigger>
              <TabsTrigger value="financial" className="text-xs h-6">Financial</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs h-6">Documents</TabsTrigger>
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
                  queryClient.invalidateQueries({ queryKey: ['load', row.id] });
                }}
              />
            </TabsContent>

            <TabsContent value="documents" className="mt-3">
              <LoadHistoryDocumentsTab load={load} />
            </TabsContent>
          </Tabs>

          {/* Document Warnings */}
          <div className="pt-2 border-t">
            <LoadDocumentWarnings loadId={row.id} loadNumber={row.loadNumber} />
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex justify-end gap-1 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSaving || updateMutation.isPending}
              className="h-7 text-xs px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || updateMutation.isPending}
              className="h-7 text-xs px-2"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
