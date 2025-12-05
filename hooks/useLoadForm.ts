/**
 * useLoadForm - Shared hook for load form state management
 * Used by LoadDetail and LoadInlineEdit components
 */

import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

/**
 * Load form data structure matching all editable fields
 */
export interface LoadFormData {
  // Basic Info
  truckId: string;
  trailerId: string;
  trailerNumber: string;
  driverId: string;
  coDriverId: string;
  customerId: string;
  status: string;
  dispatchStatus: string | null;
  loadType: string;
  equipmentType: string;
  // Location Details
  pickupLocation: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string;
  pickupZip: string;
  pickupCompany: string;
  pickupDate: string | Date | null;
  pickupTimeStart: string | Date | null;
  pickupTimeEnd: string | Date | null;
  pickupContact: string;
  pickupPhone: string;
  pickupNotes: string;
  deliveryLocation: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZip: string;
  deliveryCompany: string;
  deliveryDate: string | Date | null;
  deliveryTimeStart: string | Date | null;
  deliveryTimeEnd: string | Date | null;
  deliveryContact: string;
  deliveryPhone: string;
  deliveryNotes: string;
  // Specifications
  weight: number | null;
  pieces: number | null;
  commodity: string;
  pallets: number | null;
  temperature: string;
  hazmat: boolean;
  hazmatClass: string;
  // Financial
  revenue: number;
  driverPay: number | null;
  fuelAdvance: number;
  serviceFee: number | null;
  loadedMiles: number | null;
  emptyMiles: number | null;
  totalMiles: number | null;
  // Notes
  dispatchNotes: string;
  // Additional fields
  tripId: string;
  shipmentId: string;
  dispatcherId: string;
  revenuePerMile: number | null;
}

/**
 * Initialize form data from load object
 */
export function initializeFormData(load: Record<string, unknown>): LoadFormData {
  return {
    // Basic Info
    truckId: (load.truckId as string) || '',
    trailerId: (load.trailerId as string) || '',
    trailerNumber: (load.trailerNumber as string) || '',
    driverId: (load.driverId as string) || '',
    coDriverId: (load.coDriverId as string) || '',
    customerId: (load.customerId as string) || '',
    status: (load.status as string) || 'PENDING',
    dispatchStatus: (load.dispatchStatus as string) || null,
    loadType: (load.loadType as string) || 'FTL',
    equipmentType: (load.equipmentType as string) || '',
    // Location Details
    pickupLocation: (load.pickupLocation as string) || '',
    pickupAddress: (load.pickupAddress as string) || '',
    pickupCity: (load.pickupCity as string) || '',
    pickupState: (load.pickupState as string) || '',
    pickupZip: (load.pickupZip as string) || '',
    pickupCompany: (load.pickupCompany as string) || '',
    pickupDate: (load.pickupDate as string | Date) || null,
    pickupTimeStart: (load.pickupTimeStart as string | Date) || null,
    pickupTimeEnd: (load.pickupTimeEnd as string | Date) || null,
    pickupContact: (load.pickupContact as string) || '',
    pickupPhone: (load.pickupPhone as string) || '',
    pickupNotes: (load.pickupNotes as string) || '',
    deliveryLocation: (load.deliveryLocation as string) || '',
    deliveryAddress: (load.deliveryAddress as string) || '',
    deliveryCity: (load.deliveryCity as string) || '',
    deliveryState: (load.deliveryState as string) || '',
    deliveryZip: (load.deliveryZip as string) || '',
    deliveryCompany: (load.deliveryCompany as string) || '',
    deliveryDate: (load.deliveryDate as string | Date) || null,
    deliveryTimeStart: (load.deliveryTimeStart as string | Date) || null,
    deliveryTimeEnd: (load.deliveryTimeEnd as string | Date) || null,
    deliveryContact: (load.deliveryContact as string) || '',
    deliveryPhone: (load.deliveryPhone as string) || '',
    deliveryNotes: (load.deliveryNotes as string) || '',
    // Specifications
    weight: (load.weight as number) || null,
    pieces: (load.pieces as number) || null,
    commodity: (load.commodity as string) || '',
    pallets: (load.pallets as number) || null,
    temperature: (load.temperature as string) || '',
    hazmat: (load.hazmat as boolean) || false,
    hazmatClass: (load.hazmatClass as string) || '',
    // Financial
    revenue: (load.revenue as number) || 0,
    driverPay: (load.driverPay as number) || null,
    fuelAdvance: (load.fuelAdvance as number) || 0,
    serviceFee: (load.serviceFee as number) || null,
    loadedMiles: (load.loadedMiles as number) || null,
    emptyMiles: (load.emptyMiles as number) || null,
    totalMiles: (load.totalMiles as number) || null,
    // Notes
    dispatchNotes: (load.dispatchNotes as string) || '',
    // Additional fields
    tripId: (load.tripId as string) || '',
    shipmentId: (load.shipmentId as string) || '',
    dispatcherId: (load.dispatcherId as string) || '',
    revenuePerMile: (load.revenuePerMile as number) || null,
  };
}

/**
 * API function to update a load
 */
async function updateLoadApi(loadId: string, data: Partial<LoadFormData>) {
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

/**
 * Check if a value has changed from original
 */
function hasValueChanged(oldValue: unknown, newValue: unknown): boolean {
  if (oldValue === newValue) return false;
  if (oldValue === null && !newValue) return false;
  if (!oldValue && newValue === null) return false;
  if (oldValue === undefined && newValue === '') return false;
  return true;
}

/**
 * Build update payload from changed fields
 */
export function buildUpdatePayload(
  formData: LoadFormData,
  originalLoad: Record<string, unknown>
): Partial<LoadFormData> {
  const payload: Partial<Record<string, unknown>> = {};

  // String fields
  const stringFields: (keyof LoadFormData)[] = [
    'truckId', 'trailerId', 'trailerNumber', 'driverId', 'coDriverId', 'customerId',
    'status', 'dispatchStatus', 'loadType', 'equipmentType',
    'pickupLocation', 'pickupAddress', 'pickupCity', 'pickupState', 'pickupZip',
    'pickupCompany', 'pickupContact', 'pickupPhone', 'pickupNotes',
    'deliveryLocation', 'deliveryAddress', 'deliveryCity', 'deliveryState', 'deliveryZip',
    'deliveryCompany', 'deliveryContact', 'deliveryPhone', 'deliveryNotes',
    'commodity', 'temperature', 'hazmatClass', 'dispatchNotes',
    'tripId', 'shipmentId', 'dispatcherId',
  ];

  for (const field of stringFields) {
    if (hasValueChanged(originalLoad[field], formData[field])) {
      payload[field] = formData[field] || null;
    }
  }

  // Date fields
  const dateFields: (keyof LoadFormData)[] = [
    'pickupDate', 'pickupTimeStart', 'pickupTimeEnd',
    'deliveryDate', 'deliveryTimeStart', 'deliveryTimeEnd',
  ];

  for (const field of dateFields) {
    if (hasValueChanged(originalLoad[field], formData[field])) {
      payload[field] = formData[field] || null;
    }
  }

  // Numeric fields
  const numericFields: (keyof LoadFormData)[] = [
    'weight', 'pieces', 'pallets', 'revenue', 'driverPay', 'fuelAdvance',
    'serviceFee', 'loadedMiles', 'emptyMiles', 'totalMiles', 'revenuePerMile',
  ];

  for (const field of numericFields) {
    if (hasValueChanged(originalLoad[field], formData[field])) {
      const value = formData[field];
      payload[field] = value ? Number(value) : null;
    }
  }

  // Boolean fields
  if (hasValueChanged(originalLoad.hazmat, formData.hazmat)) {
    payload.hazmat = formData.hazmat || false;
  }

  return payload as Partial<LoadFormData>;
}

interface UseLoadFormOptions {
  loadId: string;
  load: Record<string, unknown>;
  onSaveSuccess?: () => void;
}

/**
 * Custom hook for load form management
 */
export function useLoadForm({ loadId, load, onSaveSuccess }: UseLoadFormOptions) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<LoadFormData>(() => initializeFormData(load));

  // Update form data when load changes
  const resetForm = useCallback(() => {
    setFormData(initializeFormData(load));
  }, [load]);

  // Update a single field
  const updateField = useCallback(<K extends keyof LoadFormData>(
    field: K,
    value: LoadFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<LoadFormData>) => updateLoadApi(loadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load', loadId] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      toast.success('Load updated successfully');
      onSaveSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update load');
    },
  });

  // Save changes
  const handleSave = useCallback(() => {
    const updatePayload = buildUpdatePayload(formData, load);

    if (Object.keys(updatePayload).length === 0) {
      toast.info('No changes to save');
      return;
    }

    updateMutation.mutate(updatePayload);
  }, [formData, load, updateMutation]);

  // Check if form has changes
  const hasChanges = useMemo(() => {
    const payload = buildUpdatePayload(formData, load);
    return Object.keys(payload).length > 0;
  }, [formData, load]);

  return {
    formData,
    setFormData,
    updateField,
    handleSave,
    resetForm,
    hasChanges,
    isSaving: updateMutation.isPending,
  };
}

export default useLoadForm;





