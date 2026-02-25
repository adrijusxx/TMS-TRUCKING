'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createLoadSchema, updateLoadSchema, type CreateLoadInput, type UpdateLoadInput } from '@/lib/validations/load';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles, X, FileText, Upload, MapPin, Plus, Package } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import AILoadImporter from '@/components/loads/AILoadImporter';
import LoadStopsDisplay from '@/components/loads/LoadStopsDisplay';
import EditableLoadStops from '@/components/loads/EditableLoadStops';
import AddStopDialog from '@/components/loads/AddStopDialog';
import CustomerSheet from '@/components/customers/CustomerSheet';
import { apiUrl } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { LoadFormWizard, type WizardStep } from './load-form/LoadFormWizard';
import { LoadFormBasicStep } from './load-form/LoadFormBasicStep';
import { LoadFormRouteStep } from './load-form/LoadFormRouteStep';
import { LoadFormDetailsStep } from './load-form/LoadFormDetailsStep';
import { useLoadMileage } from './load-form/useLoadMileage';
import type { LoadFormMethods } from './load-form/types';

// --- API functions ---

async function fetchCustomers() {
  const response = await fetch(apiUrl('/api/customers'));
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
}

async function fetchDrivers(mcNumber?: string | null, canReassign?: boolean, isAdmin?: boolean) {
  const url = isAdmin
    ? apiUrl('/api/drivers?limit=1000&status=AVAILABLE')
    : mcNumber
      ? apiUrl(`/api/drivers?limit=1000&status=AVAILABLE&mcNumber=${encodeURIComponent(mcNumber)}`)
      : apiUrl('/api/drivers?limit=1000&status=AVAILABLE');
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch drivers');
  return response.json();
}

async function fetchLoad(loadId: string) {
  const response = await fetch(apiUrl(`/api/loads/${loadId}`));
  if (!response.ok) throw new Error('Failed to fetch load');
  return response.json();
}

async function createLoadApi(data: CreateLoadInput) {
  const response = await fetch(apiUrl('/api/loads'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create load');
  }
  return response.json();
}

async function updateLoadApi(loadId: string, data: UpdateLoadInput) {
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

// --- Wizard step definitions ---

const WIZARD_STEPS: WizardStep[] = [
  { id: 'basic', label: 'Basic Info', icon: Package },
  { id: 'route', label: 'Route', icon: MapPin },
  { id: 'details', label: 'Details & Financial', icon: FileText },
];

// --- Component ---

interface LoadFormProps {
  initialData?: any;
  loadId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isSheet?: boolean;
}

export default function LoadForm({
  initialData,
  loadId,
  onSuccess,
  onCancel,
  isSheet = false,
}: LoadFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isCustomerSheetOpen, setIsCustomerSheetOpen] = useState(false);
  const [isAddStopDialogOpen, setIsAddStopDialogOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [selectedMcNumberId, setSelectedMcNumberId] = useState<string | undefined>(undefined);
  const [wizardStep, setWizardStep] = useState(0);

  const isEditMode = !!initialData;
  const isCreateMode = !initialData;
  const editLoadId = loadId || initialData?.id;

  const currentMcNumber = session?.user?.mcNumber || null;
  const userRole = session?.user?.role;
  const isAdmin = userRole === 'ADMIN';
  const isDispatcher = userRole === 'DISPATCHER';
  const canReassignDriver = isAdmin || isDispatcher;
  const userMcAccess = (session?.user as any)?.mcAccess || [];
  const hasMultipleMcAccess = userMcAccess.length > 1 || (isAdmin && userMcAccess.length === 0);

  const { data: customersData, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    enabled: !!session,
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers', currentMcNumber, canReassignDriver, isAdmin],
    queryFn: () => fetchDrivers(currentMcNumber, canReassignDriver, isAdmin),
    enabled: !!session && isCreateMode,
  });

  const { data: loadData } = useQuery({
    queryKey: ['load', editLoadId],
    queryFn: () => fetchLoad(editLoadId!),
    enabled: !!editLoadId && isEditMode,
    initialData: initialData ? { success: true, data: initialData } : undefined,
  });

  const customers = customersData?.data || [];
  const drivers = driversData?.data || [];
  const load = loadData?.data || initialData;

  const formSchema = isCreateMode ? createLoadSchema : updateLoadSchema;

  const getDefaultValues = () => {
    if (initialData || load) {
      const data = initialData || load;
      const formatDate = (d: string) => {
        const date = new Date(d);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      };
      return {
        loadNumber: data.loadNumber || '',
        customerId: data.customerId || '',
        loadType: data.loadType || 'FTL',
        equipmentType: data.equipmentType || 'DRY_VAN',
        weight: data.weight || undefined,
        pieces: data.pieces || undefined,
        commodity: data.commodity || '',
        pallets: data.pallets || undefined,
        temperature: data.temperature || '',
        hazmat: data.hazmat ?? false,
        hazmatClass: data.hazmatClass || '',
        revenue: data.revenue || 0,
        driverPay: data.driverPay || undefined,
        fuelAdvance: data.fuelAdvance ?? 0,
        totalMiles: data.totalMiles || undefined,
        loadedMiles: data.loadedMiles || undefined,
        emptyMiles: data.emptyMiles || undefined,
        trailerNumber: data.trailerNumber || '',
        dispatchNotes: data.dispatchNotes || '',
        dispatcherId: data.dispatcherId || '',
        pickupLocation: data.pickupLocation || '',
        pickupAddress: data.pickupAddress || '',
        pickupCity: data.pickupCity || '',
        pickupState: data.pickupState || '',
        pickupZip: data.pickupZip || '',
        pickupDate: data.pickupDate ? formatDate(data.pickupDate) : undefined,
        deliveryLocation: data.deliveryLocation || '',
        deliveryAddress: data.deliveryAddress || '',
        deliveryCity: data.deliveryCity || '',
        deliveryState: data.deliveryState || '',
        deliveryZip: data.deliveryZip || '',
        deliveryDate: data.deliveryDate ? formatDate(data.deliveryDate) : undefined,
        stops: data.stops?.map((stop: any) => ({
          stopType: stop.stopType, sequence: stop.sequence,
          company: stop.company || '', address: stop.address, city: stop.city,
          state: stop.state, zip: stop.zip, phone: stop.phone || '',
          earliestArrival: stop.earliestArrival ? new Date(stop.earliestArrival).toISOString() : undefined,
          latestArrival: stop.latestArrival ? new Date(stop.latestArrival).toISOString() : undefined,
          contactName: stop.contactName || '', contactPhone: stop.contactPhone || '',
          items: stop.items || undefined, totalPieces: stop.totalPieces || undefined,
          totalWeight: stop.totalWeight || undefined, notes: stop.notes || '',
          specialInstructions: stop.specialInstructions || '',
        })) || undefined,
      };
    }
    return {
      loadType: 'FTL', equipmentType: 'DRY_VAN', hazmat: false,
      fuelAdvance: 0, customerId: '', dispatcherId: session?.user?.id || '',
    };
  };

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
    setValue, watch, reset,
  } = useForm<CreateLoadInput | UpdateLoadInput>({
    // @ts-expect-error - zodResolver accepts union of Zod schemas
    resolver: zodResolver(formSchema),
    // @ts-expect-error - defaultValues type mismatch between create and update schemas
    defaultValues: getDefaultValues(),
  });

  const stops = watch('stops');
  const selectedDriverId = watch('driverId');

  const {
    calculateMileage, isCalculatingMiles,
    loadedMiles, emptyMiles, totalMiles, isMultiStop,
  } = useLoadMileage({ setValue, watch, isCreateMode, setError });

  const selectedDriver = drivers.find((d: any) => d.id === selectedDriverId);
  const formMethods: LoadFormMethods = { register, errors, watch, setValue };

  const wizardSteps = WIZARD_STEPS.map((step) => ({
    ...step,
    hidden: step.id === 'route' && isMultiStop,
  }));
  const currentStepId = wizardSteps[wizardStep]?.id;

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: createLoadApi,
    onSuccess: async (data) => {
      const newLoadId = data.data.id;
      if (pendingFiles.length > 0) {
        try {
          await Promise.all(pendingFiles.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('loadId', newLoadId);
            formData.append('type', 'RATE_CONFIRMATION');
            formData.append('fileName', file.name);
            formData.append('title', file.name);
            formData.append('fileUrl', `/uploads/${Date.now()}-${file.name}`);
            formData.append('fileSize', file.size.toString());
            formData.append('mimeType', file.type);
            const response = await fetch(apiUrl('/api/documents/upload'), { method: 'POST', body: formData });
            if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
          }));
          toast.success(`Load created and ${pendingFiles.length} file(s) attached successfully`);
        } catch (err) {
          console.error('Error uploading files:', err);
          toast.error('Load created but some files failed to upload');
        }
      }
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      if (onSuccess) onSuccess();
      else router.push(`/dashboard/loads/${newLoadId}`);
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateLoadInput) => updateLoadApi(editLoadId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['load', editLoadId] });
      if (onSuccess) onSuccess();
      else router.push(`/dashboard/loads/${editLoadId}`);
    },
    onError: (err: Error) => setError(err.message),
  });

  // --- Handlers ---

  const onSubmit = async (data: CreateLoadInput | UpdateLoadInput) => {
    setError(null);
    if (isCreateMode) {
      const createData = data as CreateLoadInput;
      if (!createData.customerId || createData.customerId.trim() === '') {
        setError('Please select a customer before submitting');
        toast.error('Customer is required');
        return;
      }
      if (createData.stops?.length) {
        const normalizedStops = normalizeStopsForSubmit(createData.stops);
        const invalidStops = normalizedStops.filter(
          (s: any) => !s.address || !s.city || !s.state || s.state.length !== 2 || !s.zip || s.zip.length < 5
        );
        if (invalidStops.length > 0) {
          const seqs = invalidStops.map((s: any) => s.sequence).join(', ');
          setError(`Stops ${seqs} are missing required fields (address, city, state, zip)`);
          toast.error(`Please complete all required fields for stops: ${seqs}`);
          return;
        }
        createData.stops = normalizedStops;
      }
      const submissionData = {
        ...createData,
        ...(hasMultipleMcAccess && selectedMcNumberId && { mcNumberId: selectedMcNumberId }),
      };
      createMutation.mutate(submissionData as CreateLoadInput);
    } else {
      updateMutation.mutate(data as UpdateLoadInput);
    }
  };

  const handleDataExtracted = async (data: Partial<CreateLoadInput>, pdfFile?: File) => {
    if (!isCreateMode) return;
    if (pdfFile) {
      setPendingFiles((prev) => [...prev, pdfFile]);
      toast.info(`PDF file "${pdfFile.name}" will be attached after load creation`);
    }
    if (data.customerId) {
      await refetchCustomers();
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    // Mileage
    if (data.loadedMiles !== undefined || data.emptyMiles !== undefined || data.totalMiles !== undefined) {
      if (typeof data.loadedMiles === 'number' && !isNaN(data.loadedMiles)) setValue('loadedMiles', data.loadedMiles, { shouldValidate: false });
      if (typeof data.emptyMiles === 'number' && !isNaN(data.emptyMiles)) setValue('emptyMiles', data.emptyMiles, { shouldValidate: false });
      if (typeof data.totalMiles === 'number' && !isNaN(data.totalMiles)) setValue('totalMiles', data.totalMiles, { shouldValidate: false });
    } else if (data.stops && data.stops.length > 1) {
      setTimeout(() => {
        const cs = watch('stops');
        if (cs && cs.length > 1 && cs.every((s: any) => s.city && s.state)) calculateMileage().catch(console.error);
      }, 1000);
    } else if (data.pickupCity && data.pickupState && data.deliveryCity && data.deliveryState && !data.stops) {
      setTimeout(() => {
        if (watch('pickupCity') && watch('pickupState') && watch('deliveryCity') && watch('deliveryState'))
          calculateMileage().catch(console.error);
      }, 1000);
    }
    // Customer
    if (data.customerId) {
      const allCustomers = (queryClient.getQueryData(['customers']) as any)?.data || customers;
      if (!allCustomers.some((c: any) => c.id === data.customerId)) {
        await refetchCustomers();
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      setValue('customerId', data.customerId, { shouldValidate: false });
    }
    // Scalar fields
    if (data.loadNumber) setValue('loadNumber', data.loadNumber, { shouldValidate: false });
    if (data.loadType) setValue('loadType', data.loadType, { shouldValidate: false });
    if (data.equipmentType) setValue('equipmentType', data.equipmentType, { shouldValidate: false });
    setNumericField(data, 'weight', setValue);
    setNumericField(data, 'revenue', setValue);
    setNumericField(data, 'pieces', setValue);
    if (data.commodity) setValue('commodity', data.commodity, { shouldValidate: false });
    if (data.dispatchNotes) setValue('dispatchNotes', data.dispatchNotes, { shouldValidate: false });
    if (data.hazmat !== undefined) setValue('hazmat', !!data.hazmat, { shouldValidate: false });
    // Location or stops
    if (data.stops?.length) {
      setValue('stops', data.stops, { shouldValidate: false });
    } else {
      const locationFields = ['pickupLocation', 'pickupAddress', 'pickupCity', 'pickupState', 'pickupZip',
        'deliveryLocation', 'deliveryAddress', 'deliveryCity', 'deliveryState', 'deliveryZip'] as const;
      for (const field of locationFields) {
        if (data[field]) setValue(field, data[field], { shouldValidate: false });
      }
    }
    setIsAIDialogOpen(false);
  };

  const handleDriverChange = (driverId: string) => {
    setValue('driverId', driverId, { shouldValidate: false });
    const driver = drivers.find((d: any) => d.id === driverId);
    if (driver?.currentTruck?.id) setValue('truckId', driver.currentTruck.id, { shouldValidate: false });
    if (driver?.currentTrailer?.id) setValue('trailerId', driver.currentTrailer.id, { shouldValidate: false });
  };

  const handleCustomerCreated = async (customerId?: string) => {
    if (!customerId) return;
    await queryClient.invalidateQueries({ queryKey: ['customers'] });
    await refetchCustomers();
    await new Promise(resolve => setTimeout(resolve, 300));
    setValue('customerId', customerId, { shouldValidate: true });
    toast.success('Customer created and selected');
  };

  const handleAddStop = (stop: Omit<any, 'sequence'>) => {
    const currentStops = watch('stops') || [];
    const nextSequence = currentStops.length > 0
      ? Math.max(...currentStops.map((s: any) => s.sequence)) + 1 : 1;
    const newStop: any = {
      stopType: stop.stopType, sequence: nextSequence,
      address: stop.address || '', city: stop.city || '', state: stop.state || '', zip: stop.zip || '',
      company: stop.company, phone: stop.phone,
      earliestArrival: stop.earliestArrival instanceof Date ? stop.earliestArrival.toISOString()
        : typeof stop.earliestArrival === 'string' ? stop.earliestArrival : undefined,
      latestArrival: stop.latestArrival instanceof Date ? stop.latestArrival.toISOString()
        : typeof stop.latestArrival === 'string' ? stop.latestArrival : undefined,
      contactName: stop.contactName, contactPhone: stop.contactPhone,
      notes: stop.notes, specialInstructions: stop.specialInstructions,
    };
    setValue('stops', [...currentStops, newStop], { shouldValidate: false });
    toast.success('Stop added successfully');
  };

  // Auto-set MC number on mount
  useEffect(() => {
    if (isCreateMode && currentMcNumber) {
      const currentMcValue = watch('mcNumber');
      if (!currentMcValue || currentMcValue !== currentMcNumber)
        setValue('mcNumber', currentMcNumber, { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMcNumber, isCreateMode]);

  const cancelUrl = isEditMode && editLoadId ? `/dashboard/loads/${editLoadId}` : '/dashboard/loads';

  // --- Step component props ---

  const basicStepProps = {
    form: formMethods, isCreateMode, isMultiStop,
    customers, drivers, selectedDriver,
    canReassignDriver, isAdmin, hasMultipleMcAccess,
    selectedMcNumberId, setSelectedMcNumberId,
    currentMcNumber, handleDriverChange,
    onNewCustomer: () => setIsCustomerSheetOpen(true),
  };
  const routeStepProps = { form: formMethods, isCreateMode, isMultiStop };
  const detailsStepProps = {
    form: formMethods, isCreateMode, isMultiStop,
    loadedMiles, emptyMiles, totalMiles,
    isCalculatingMiles, calculateMileage,
  };

  // --- Render ---

  return (
    <div className="space-y-4 pb-6">
      {isCreateMode && (
        <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Load Confirmation Import</DialogTitle>
              <DialogDescription>Upload a rate confirmation PDF to automatically extract load information</DialogDescription>
            </DialogHeader>
            <AILoadImporter onDataExtracted={handleDataExtracted} onClose={() => setIsAIDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onCancel ? (
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Link href={cancelUrl}>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
          )}
          <p className="text-sm text-muted-foreground">
            {isCreateMode ? 'Enter load details to create a new shipment' : 'Update load details'}
          </p>
        </div>
        {isCreateMode && (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAIDialogOpen(true)} className="h-8 text-xs">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />AI Import
            </Button>
            <label className="relative cursor-pointer">
              <input type="file" className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) { setPendingFiles((prev) => [...prev, file]); e.target.value = ''; } }}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs relative">
                <Upload className="h-3.5 w-3.5 mr-1.5" />Attach Files
                {pendingFiles.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-medium">
                    {pendingFiles.length}
                  </span>
                )}
              </Button>
            </label>
            {!isMultiStop && (
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddStopDialogOpen(true)} className="h-8 text-xs">
                <MapPin className="h-3.5 w-3.5 mr-1.5" />Multi-Stop
              </Button>
            )}
          </div>
        )}
      </div>

      {isCreateMode && pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-md border border-dashed">
          {pendingFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-1.5 px-2 py-1 bg-background rounded-md text-xs border shadow-sm">
              <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="max-w-[180px] truncate font-medium">{file.name}</span>
              <Button type="button" variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-destructive/10 shrink-0"
                onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {Object.keys(errors).length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-destructive/10 rounded"><X className="h-4 w-4 text-destructive" /></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-destructive mb-2">Validation Errors</h4>
                  <ul className="space-y-1 text-sm">
                    {Object.entries(errors).map(([key, err]) => (
                      <li key={key} className="text-destructive/90">
                        <span className="font-medium">{key}:</span> {String((err as any)?.message || 'Invalid')}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isMultiStop && stops && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded"><MapPin className="h-3.5 w-3.5 text-primary" /></div>
                  <CardTitle className="text-sm font-semibold">Multi-Stop Route ({stops.length} stops)</CardTitle>
                </div>
                {isCreateMode && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddStopDialogOpen(true)} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />Add Stop
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              {isCreateMode ? (
                <EditableLoadStops
                  stops={stops as any}
                  onChange={(updatedStops) => {
                    const normalizedStops = updatedStops.map((stop: any) => ({
                      ...stop,
                      earliestArrival: stop.earliestArrival && typeof stop.earliestArrival !== 'string'
                        ? (stop.earliestArrival instanceof Date ? stop.earliestArrival.toISOString() : String(stop.earliestArrival))
                        : stop.earliestArrival,
                      latestArrival: stop.latestArrival && typeof stop.latestArrival !== 'string'
                        ? (stop.latestArrival instanceof Date ? stop.latestArrival.toISOString() : String(stop.latestArrival))
                        : stop.latestArrival,
                    }));
                    setValue('stops', normalizedStops as any, { shouldValidate: false });
                  }}
                  compact={true}
                />
              ) : (
                <LoadStopsDisplay stops={stops as any} />
              )}
            </CardContent>
          </Card>
        )}

        <CustomerSheet open={isCustomerSheetOpen} onOpenChange={setIsCustomerSheetOpen} onSuccess={handleCustomerCreated} mode="create" />

        {isCreateMode && (
          <AddStopDialog
            open={isAddStopDialogOpen} onOpenChange={setIsAddStopDialogOpen}
            onAddStop={handleAddStop} nextSequence={(stops?.length || 0) + 1}
            existingStops={(stops || []).map((stop: any) => ({
              ...stop,
              earliestArrival: stop.earliestArrival instanceof Date ? stop.earliestArrival.toISOString() : stop.earliestArrival,
              latestArrival: stop.latestArrival instanceof Date ? stop.latestArrival.toISOString() : stop.latestArrival,
            }))}
          />
        )}

        {isCreateMode ? (
          <LoadFormWizard
            steps={wizardSteps}
            currentStep={wizardStep}
            onStepChange={setWizardStep}
            isSubmitting={isSubmitting || createMutation.isPending}
          >
            {currentStepId === 'basic' && <LoadFormBasicStep {...basicStepProps} />}
            {currentStepId === 'route' && <LoadFormRouteStep {...routeStepProps} />}
            {currentStepId === 'details' && <LoadFormDetailsStep {...detailsStepProps} />}
          </LoadFormWizard>
        ) : (
          <EditModeLayout
            basicStepProps={basicStepProps}
            routeStepProps={routeStepProps}
            detailsStepProps={detailsStepProps}
            isMultiStop={isMultiStop}
          />
        )}

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Error</p>
                  <p className="text-xs text-destructive/90 mt-0.5">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isEditMode && (
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Link href={cancelUrl}><Button type="button" variant="outline" size="sm">Cancel</Button></Link>
            <Button type="submit" size="sm" disabled={isSubmitting || updateMutation.isPending}>
              {isSubmitting || updateMutation.isPending ? 'Updating...' : 'Update Load'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

// --- Edit mode layout ---

function EditModeLayout({ basicStepProps, routeStepProps, detailsStepProps, isMultiStop }: {
  basicStepProps: any; routeStepProps: any; detailsStepProps: any; isMultiStop: boolean;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader><CardTitle>Basic Information</CardTitle><CardDescription>Load number and customer</CardDescription></CardHeader>
        <CardContent className="space-y-4"><LoadFormBasicStep {...basicStepProps} /></CardContent>
      </Card>
      {!isMultiStop && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Route Information</CardTitle><CardDescription>Pickup and delivery details</CardDescription></CardHeader>
          <CardContent className="space-y-4"><LoadFormRouteStep {...routeStepProps} /></CardContent>
        </Card>
      )}
      <Card className="shadow-sm">
        <CardHeader><CardTitle>Load Details & Financial</CardTitle><CardDescription>Specifications and pricing</CardDescription></CardHeader>
        <CardContent className="space-y-4"><LoadFormDetailsStep {...detailsStepProps} /></CardContent>
      </Card>
    </div>
  );
}

// --- Helpers ---

function normalizeStopsForSubmit(stops: any[]): any[] {
  return stops.map((stop: any) => {
    const normalized: any = {
      stopType: stop.stopType, sequence: stop.sequence,
      address: stop.address?.trim() || '', city: stop.city?.trim() || '',
      state: stop.state?.trim().toUpperCase().slice(0, 2) || '', zip: stop.zip?.trim() || '',
    };
    if (stop.company) normalized.company = stop.company.trim();
    if (stop.phone) normalized.phone = stop.phone.trim();
    if (stop.contactName) normalized.contactName = stop.contactName.trim();
    if (stop.contactPhone) normalized.contactPhone = stop.contactPhone.trim();
    if (stop.notes) normalized.notes = stop.notes.trim();
    if (stop.specialInstructions) normalized.specialInstructions = stop.specialInstructions.trim();
    if (stop.items) normalized.items = stop.items;
    if (stop.totalPieces) normalized.totalPieces = stop.totalPieces;
    if (stop.totalWeight) normalized.totalWeight = stop.totalWeight;
    if (stop.earliestArrival) {
      normalized.earliestArrival = stop.earliestArrival instanceof Date
        ? stop.earliestArrival.toISOString()
        : typeof stop.earliestArrival === 'string' ? stop.earliestArrival : undefined;
    }
    if (stop.latestArrival) {
      normalized.latestArrival = stop.latestArrival instanceof Date
        ? stop.latestArrival.toISOString()
        : typeof stop.latestArrival === 'string' ? stop.latestArrival : undefined;
    }
    return normalized;
  });
}

function setNumericField(data: any, field: string, setValue: any) {
  if (data[field] !== undefined && data[field] !== null) {
    const value = typeof data[field] === 'string' ? parseFloat(data[field]) : data[field];
    if (!isNaN(value) && value >= 0) setValue(field, value, { shouldValidate: false });
  }
}
