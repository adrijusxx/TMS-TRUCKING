'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createLoadSchema, updateLoadSchema, type CreateLoadInput, type UpdateLoadInput } from '@/lib/validations/load';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadType, EquipmentType } from '@prisma/client';
import { ArrowLeft, Sparkles, X, FileText, Upload, MapPin, Plus, User, Truck, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import AILoadImporter from '@/components/loads/AILoadImporter';
import LoadStopsDisplay from '@/components/loads/LoadStopsDisplay';
import EditableLoadStops from '@/components/loads/EditableLoadStops';
import AddStopDialog from '@/components/loads/AddStopDialog';
import CustomerSheet from '@/components/customers/CustomerSheet';
import CustomerCombobox from '@/components/customers/CustomerCombobox';
import DriverCombobox from '@/components/drivers/DriverCombobox';
import DispatcherCombobox from '@/components/users/DispatcherCombobox';
import TruckCombobox from '@/components/trucks/TruckCombobox';
import TrailerCombobox from '@/components/trailers/TrailerCombobox';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { apiUrl } from '@/lib/utils';
import { useSession } from 'next-auth/react';

async function fetchCustomers() {
  const response = await fetch(apiUrl('/api/customers'));
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
}

async function fetchDrivers(mcNumber?: string | null, canReassign?: boolean, isAdmin?: boolean) {
  const url = (isAdmin)
    ? apiUrl('/api/drivers?limit=1000&status=AVAILABLE')
    : (mcNumber)
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

async function createLoad(data: CreateLoadInput) {
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

async function updateLoad(loadId: string, data: UpdateLoadInput) {
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
  isSheet = false
}: LoadFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isCustomerSheetOpen, setIsCustomerSheetOpen] = useState(false);
  const [isAddStopDialogOpen, setIsAddStopDialogOpen] = useState(false);
  const [createdLoadId, setCreatedLoadId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isCalculatingMiles, setIsCalculatingMiles] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic', 'pickup', 'delivery', 'details'])
  );
  const [selectedMcNumberId, setSelectedMcNumberId] = useState<string | undefined>(undefined);

  // Determine mode based on initialData presence
  const isEditMode = !!initialData;
  const isCreateMode = !initialData;
  const editLoadId = loadId || initialData?.id;

  // Get current user's MC number from session
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

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formSchema = isCreateMode ? createLoadSchema : updateLoadSchema;

  // Prepare default values from initialData if present
  const getDefaultValues = () => {
    if (initialData || load) {
      const data = initialData || load;
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
        pickupDate: data.pickupDate ? (() => {
          const date = new Date(data.pickupDate);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        })() : undefined,
        deliveryLocation: data.deliveryLocation || '',
        deliveryAddress: data.deliveryAddress || '',
        deliveryCity: data.deliveryCity || '',
        deliveryState: data.deliveryState || '',
        deliveryZip: data.deliveryZip || '',
        deliveryDate: data.deliveryDate ? (() => {
          const date = new Date(data.deliveryDate);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        })() : undefined,
        stops: data.stops ? data.stops.map((stop: any) => ({
          stopType: stop.stopType,
          sequence: stop.sequence,
          company: stop.company || '',
          address: stop.address,
          city: stop.city,
          state: stop.state,
          zip: stop.zip,
          phone: stop.phone || '',
          earliestArrival: stop.earliestArrival ? new Date(stop.earliestArrival).toISOString() : undefined,
          latestArrival: stop.latestArrival ? new Date(stop.latestArrival).toISOString() : undefined,
          contactName: stop.contactName || '',
          contactPhone: stop.contactPhone || '',
          items: stop.items || undefined,
          totalPieces: stop.totalPieces || undefined,
          totalWeight: stop.totalWeight || undefined,
          notes: stop.notes || '',
          specialInstructions: stop.specialInstructions || '',
        })) : undefined,
      };
    }
    return {
      loadType: 'FTL',
      equipmentType: 'DRY_VAN',
      hazmat: false,
      fuelAdvance: 0,
      customerId: '',
      dispatcherId: session?.user?.id || '',
    };
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CreateLoadInput | UpdateLoadInput>({
    // @ts-expect-error - zodResolver accepts union of Zod schemas but TypeScript doesn't infer it correctly
    resolver: zodResolver(formSchema),
    // @ts-expect-error - defaultValues type mismatch between create and update schemas
    defaultValues: getDefaultValues(),
  });

  // Form is populated via defaultValues, no need for useEffect

  // Watch for stops to determine if this is a multi-stop load
  const stops = watch('stops');
  const isMultiStop = stops && Array.isArray(stops) && stops.length > 0;
  const selectedDriverId = watch('driverId');

  // Watch form values for mileage calculation
  const pickupCity = watch('pickupCity');
  const pickupState = watch('pickupState');
  const deliveryCity = watch('deliveryCity');
  const deliveryState = watch('deliveryState');
  const loadedMiles = watch('loadedMiles');
  const emptyMiles = watch('emptyMiles');
  const totalMiles = watch('totalMiles');

  // Calculate mileage function (create mode only)
  const calculateDistance = async (
    origin: { city: string; state: string },
    destination: { city: string; state: string }
  ): Promise<number> => {
    try {
      const response = await fetch(apiUrl('/api/routes/distance'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origins: [origin],
          destinations: [destination],
          mode: 'driving',
          units: 'imperial',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate distance');
      }

      const result = await response.json();
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error('Invalid distance calculation result');
      }

      const distanceInMiles = result.data[0][0]?.distance?.miles;
      if (!distanceInMiles && distanceInMiles !== 0) {
        throw new Error('Distance calculation returned invalid data');
      }

      return distanceInMiles;
    } catch (error) {
      console.error('Distance calculation error:', error);
      throw error;
    }
  };

  const calculateMileage = async () => {
    if (!isCreateMode) return;

    try {
      setIsCalculatingMiles(true);
      setError(null);

      if (isMultiStop && stops && stops.length > 0) {
        const sortedStops = [...stops].sort((a: any, b: any) => a.sequence - b.sequence);

        const invalidStops = sortedStops.filter(
          (stop: any) => !stop.city || !stop.state
        );

        if (invalidStops.length > 0) {
          throw new Error('All stops must have city and state for mileage calculation');
        }

        let loadedMiles = 0;
        let emptyMiles = 0;

        for (let i = 0; i < sortedStops.length - 1; i++) {
          const currentStop = sortedStops[i];
          const nextStop = sortedStops[i + 1];

          const distance = await calculateDistance(
            { city: currentStop.city, state: currentStop.state },
            { city: nextStop.city, state: nextStop.state }
          );

          if (currentStop.stopType === 'DELIVERY' && nextStop.stopType === 'PICKUP') {
            emptyMiles += distance;
          } else {
            loadedMiles += distance;
          }
        }

        const totalMiles = loadedMiles + emptyMiles;

        setValue('loadedMiles', Math.round(loadedMiles * 10) / 10, { shouldValidate: false });
        setValue('emptyMiles', Math.round(emptyMiles * 10) / 10, { shouldValidate: false });
        setValue('totalMiles', Math.round(totalMiles * 10) / 10, { shouldValidate: false });

        toast.success(
          `Calculated: ${Math.round(loadedMiles)} loaded mi, ${Math.round(emptyMiles)} deadhead mi, ${Math.round(totalMiles)} total mi`
        );
      } else {
        if (!pickupCity || !pickupState || !deliveryCity || !deliveryState) {
          throw new Error('Pickup and delivery city/state are required for mileage calculation');
        }

        const distance = await calculateDistance(
          { city: pickupCity, state: pickupState },
          { city: deliveryCity, state: deliveryState }
        );

        const totalMiles = Math.round(distance * 10) / 10;
        setValue('loadedMiles', totalMiles, { shouldValidate: false });
        setValue('emptyMiles', 0, { shouldValidate: false });
        setValue('totalMiles', totalMiles, { shouldValidate: false });

        toast.success(`Calculated: ${totalMiles} miles`);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to calculate mileage';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCalculatingMiles(false);
    }
  };

  // Auto-calculate mileage when stops or location fields are populated (create mode only)
  useEffect(() => {
    if (!isCreateMode) return;
    if (isCalculatingMiles) return;

    const hasMiles = (loadedMiles !== undefined && loadedMiles !== null && !isNaN(loadedMiles)) ||
      (emptyMiles !== undefined && emptyMiles !== null && !isNaN(emptyMiles)) ||
      (totalMiles !== undefined && totalMiles !== null && !isNaN(totalMiles));

    if (hasMiles) return;

    if (stops && stops.length > 1) {
      const allValid = stops.every((s: any) => s.city && s.state);
      if (allValid) {
        const timer = setTimeout(() => {
          calculateMileage().catch((err) => {
            console.error('Auto-calculation failed:', err);
          });
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
    else if (pickupCity && pickupState && deliveryCity && deliveryState && (!stops || stops.length === 0)) {
      const timer = setTimeout(() => {
        calculateMileage().catch((err) => {
          console.error('Auto-calculation failed:', err);
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, pickupCity, pickupState, deliveryCity, deliveryState, loadedMiles, emptyMiles, totalMiles, isCalculatingMiles, isCreateMode]);

  const createMutation = useMutation({
    mutationFn: createLoad,
    onSuccess: async (data) => {
      const newLoadId = data.data.id;

      if (pendingFiles.length > 0) {
        try {
          await Promise.all(
            pendingFiles.map(async (file) => {
              const formData = new FormData();
              formData.append('file', file);
              formData.append('loadId', newLoadId);
              formData.append('type', 'RATE_CONFIRMATION');
              formData.append('fileName', file.name);
              formData.append('title', file.name);
              formData.append('fileUrl', `/uploads/${Date.now()}-${file.name}`);
              formData.append('fileSize', file.size.toString());
              formData.append('mimeType', file.type);

              const response = await fetch(apiUrl('/api/documents/upload'), {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) {
                throw new Error(`Failed to upload ${file.name}`);
              }
            })
          );
          toast.success(`Load created and ${pendingFiles.length} file(s) attached successfully`);
        } catch (error) {
          console.error('Error uploading files:', error);
          toast.error('Load created but some files failed to upload');
        }
      }

      queryClient.invalidateQueries({ queryKey: ['loads'] });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/loads/${newLoadId}`);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateLoadInput) => updateLoad(editLoadId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['load', editLoadId] });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/loads/${editLoadId}`);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const onSubmit = async (data: CreateLoadInput | UpdateLoadInput) => {
    setError(null);

    if (isCreateMode) {
      const createData = data as CreateLoadInput;

      if (!createData.customerId || createData.customerId.trim() === '') {
        setError('Please select a customer before submitting');
        toast.error('Customer is required');
        return;
      }

      if (createData.stops && Array.isArray(createData.stops) && createData.stops.length > 0) {
        const normalizedStops = createData.stops.map((stop: any) => {
          const normalized: any = {
            stopType: stop.stopType,
            sequence: stop.sequence,
            address: stop.address?.trim() || '',
            city: stop.city?.trim() || '',
            state: stop.state?.trim().toUpperCase().slice(0, 2) || '',
            zip: stop.zip?.trim() || '',
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
              : typeof stop.earliestArrival === 'string'
                ? stop.earliestArrival
                : undefined;
          }
          if (stop.latestArrival) {
            normalized.latestArrival = stop.latestArrival instanceof Date
              ? stop.latestArrival.toISOString()
              : typeof stop.latestArrival === 'string'
                ? stop.latestArrival
                : undefined;
          }

          return normalized;
        });

        const invalidStops = normalizedStops.filter(
          (stop: any) => !stop.address || !stop.city || !stop.state || stop.state.length !== 2 || !stop.zip || stop.zip.length < 5
        );

        if (invalidStops.length > 0) {
          const invalidSequences = invalidStops.map((s: any) => s.sequence).join(', ');
          setError(`Stops ${invalidSequences} are missing required fields (address, city, state, zip)`);
          toast.error(`Please complete all required fields for stops: ${invalidSequences}`);
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

  // Handle AI data extraction (create mode only)
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

    if (data.loadedMiles !== undefined || data.emptyMiles !== undefined || data.totalMiles !== undefined) {
      if (data.loadedMiles !== undefined && typeof data.loadedMiles === 'number' && !isNaN(data.loadedMiles)) {
        setValue('loadedMiles', data.loadedMiles, { shouldValidate: false });
      }
      if (data.emptyMiles !== undefined && typeof data.emptyMiles === 'number' && !isNaN(data.emptyMiles)) {
        setValue('emptyMiles', data.emptyMiles, { shouldValidate: false });
      }
      if (data.totalMiles !== undefined && typeof data.totalMiles === 'number' && !isNaN(data.totalMiles)) {
        setValue('totalMiles', data.totalMiles, { shouldValidate: false });
      }
    } else if (data.stops && data.stops.length > 1) {
      setTimeout(() => {
        const currentStops = watch('stops');
        if (currentStops && currentStops.length > 1) {
          const allValid = currentStops.every((s: any) => s.city && s.state);
          if (allValid) {
            calculateMileage().catch(console.error);
          }
        }
      }, 1000);
    } else if (data.pickupCity && data.pickupState && data.deliveryCity && data.deliveryState && !data.stops) {
      setTimeout(() => {
        const currentPickupCity = watch('pickupCity');
        const currentPickupState = watch('pickupState');
        const currentDeliveryCity = watch('deliveryCity');
        const currentDeliveryState = watch('deliveryState');
        if (currentPickupCity && currentPickupState && currentDeliveryCity && currentDeliveryState) {
          calculateMileage().catch(console.error);
        }
      }, 1000);
    }

    if (data.customerId) {
      const updatedCustomers = queryClient.getQueryData(['customers']) as any;
      const allCustomers = updatedCustomers?.data || customersData?.data || customers;
      const customerExists = allCustomers.some((c: any) => c.id === data.customerId);

      if (customerExists) {
        setValue('customerId', data.customerId, { shouldValidate: false });
      } else {
        await refetchCustomers();
        await new Promise(resolve => setTimeout(resolve, 300));

        const retryCustomers = queryClient.getQueryData(['customers']) as any;
        const retryAllCustomers = retryCustomers?.data || [];
        const retryExists = retryAllCustomers.some((c: any) => c.id === data.customerId);

        if (retryExists) {
          setValue('customerId', data.customerId, { shouldValidate: false });
        } else {
          setValue('customerId', data.customerId, { shouldValidate: false });
          toast.info('Customer selected. If not visible in dropdown, please refresh the page.');
        }
      }
    }

    if (data.loadNumber) setValue('loadNumber', data.loadNumber, { shouldValidate: false });
    if (data.loadType) setValue('loadType', data.loadType as LoadType, { shouldValidate: false });
    if (data.equipmentType) setValue('equipmentType', data.equipmentType as EquipmentType, { shouldValidate: false });

    if (data.weight !== undefined && data.weight !== null) {
      const weight = typeof data.weight === 'string' ? parseFloat(data.weight) : data.weight;
      if (!isNaN(weight) && weight > 0) {
        setValue('weight', weight, { shouldValidate: false });
      }
    }

    if (data.revenue !== undefined && data.revenue !== null) {
      const revenue = typeof data.revenue === 'string' ? parseFloat(data.revenue) : data.revenue;
      if (!isNaN(revenue) && revenue >= 0) {
        setValue('revenue', revenue, { shouldValidate: false });
      }
    }

    if (data.pieces !== undefined && data.pieces !== null) {
      const pieces = typeof data.pieces === 'string' ? parseInt(data.pieces) : data.pieces;
      if (!isNaN(pieces) && pieces > 0) {
        setValue('pieces', pieces, { shouldValidate: false });
      }
    }

    if (data.commodity) setValue('commodity', data.commodity, { shouldValidate: false });
    if (data.dispatchNotes) setValue('dispatchNotes', data.dispatchNotes, { shouldValidate: false });
    if (data.hazmat !== undefined) {
      const hazmatValue = typeof data.hazmat === 'boolean' ? data.hazmat : data.hazmat === 'true' || data.hazmat === true;
      setValue('hazmat', hazmatValue, { shouldValidate: false });
    }

    if (data.stops && Array.isArray(data.stops) && data.stops.length > 0) {
      setValue('stops', data.stops, { shouldValidate: false });
    } else {
      if (data.pickupLocation) setValue('pickupLocation', data.pickupLocation, { shouldValidate: false });
      if (data.pickupAddress) setValue('pickupAddress', data.pickupAddress, { shouldValidate: false });
      if (data.pickupCity) setValue('pickupCity', data.pickupCity, { shouldValidate: false });
      if (data.pickupState) setValue('pickupState', data.pickupState, { shouldValidate: false });
      if (data.pickupZip) setValue('pickupZip', data.pickupZip, { shouldValidate: false });
      if (data.deliveryLocation) setValue('deliveryLocation', data.deliveryLocation, { shouldValidate: false });
      if (data.deliveryAddress) setValue('deliveryAddress', data.deliveryAddress, { shouldValidate: false });
      if (data.deliveryCity) setValue('deliveryCity', data.deliveryCity, { shouldValidate: false });
      if (data.deliveryState) setValue('deliveryState', data.deliveryState, { shouldValidate: false });
      if (data.deliveryZip) setValue('deliveryZip', data.deliveryZip, { shouldValidate: false });
    }

    setIsAIDialogOpen(false);
  };

  const handleDriverChange = (driverId: string) => {
    setValue('driverId', driverId, { shouldValidate: false });
    const driver = drivers.find((d: any) => d.id === driverId);
    if (driver) {
      if (driver.currentTruck?.id) {
        setValue('truckId', driver.currentTruck.id, { shouldValidate: false });
      }
      if (driver.currentTrailer?.id) {
        setValue('trailerId', driver.currentTrailer.id, { shouldValidate: false });
      }
    }
  };

  const handleCustomerCreated = async (customerId?: string) => {
    if (!customerId) return;
    await queryClient.invalidateQueries({ queryKey: ['customers'] });
    const result = await refetchCustomers();
    await new Promise(resolve => setTimeout(resolve, 300));

    const latestCustomers = result.data?.data || customersData?.data || [];
    const customerExists = latestCustomers.some((c: any) => c.id === customerId);

    if (customerExists) {
      setValue('customerId', customerId, { shouldValidate: true });
      toast.success('Customer created and selected');
    } else {
      const retryResult = await refetchCustomers();
      const retryCustomers = retryResult.data?.data || [];
      if (retryCustomers.some((c: any) => c.id === customerId)) {
        setValue('customerId', customerId, { shouldValidate: true });
        toast.success('Customer created and selected');
      } else {
        if (customerId && typeof customerId === 'string' && customerId.trim() !== '') {
          setValue('customerId', customerId, { shouldValidate: true });
          toast.success('Customer created. If not visible, please refresh the page.');
        } else {
          toast.error('Customer created but could not be selected. Please select it manually from the dropdown.');
        }
      }
    }
  };

  const handleAddStop = (stop: Omit<any, 'sequence'>) => {
    const currentStops = watch('stops') || [];
    const nextSequence = currentStops.length > 0
      ? Math.max(...currentStops.map((s: any) => s.sequence)) + 1
      : 1;

    const newStop: any = {
      stopType: stop.stopType,
      sequence: nextSequence,
      address: stop.address || '',
      city: stop.city || '',
      state: stop.state || '',
      zip: stop.zip || '',
      company: stop.company,
      phone: stop.phone,
      earliestArrival: stop.earliestArrival instanceof Date
        ? stop.earliestArrival.toISOString()
        : typeof stop.earliestArrival === 'string'
          ? stop.earliestArrival
          : undefined,
      latestArrival: stop.latestArrival instanceof Date
        ? stop.latestArrival.toISOString()
        : typeof stop.latestArrival === 'string'
          ? stop.latestArrival
          : undefined,
      contactName: stop.contactName,
      contactPhone: stop.contactPhone,
      notes: stop.notes,
      specialInstructions: stop.specialInstructions,
    };

    setValue('stops', [...currentStops, newStop], { shouldValidate: false });
    toast.success('Stop added successfully');
  };

  const selectedDriver = drivers.find((d: any) => d.id === selectedDriverId);

  // Auto-set MC number from session on mount (create mode only)
  useEffect(() => {
    if (isCreateMode && currentMcNumber) {
      const currentMcValue = watch('mcNumber');
      if (!currentMcValue || currentMcValue !== currentMcNumber) {
        setValue('mcNumber', currentMcNumber, { shouldValidate: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMcNumber, isCreateMode]);

  const cancelUrl = isEditMode && editLoadId
    ? `/dashboard/loads/${editLoadId}`
    : '/dashboard/loads';

  return (
    <div className="space-y-4 pb-6">
      {/* AI Import Dialog (create mode only) */}
      {isCreateMode && (
        <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Load Confirmation Import</DialogTitle>
              <DialogDescription>
                Upload a rate confirmation PDF to automatically extract load information
              </DialogDescription>
            </DialogHeader>
            <AILoadImporter
              onDataExtracted={handleDataExtracted}
              onClose={() => setIsAIDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onCancel ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onCancel}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Link href={cancelUrl}>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <div>
            <p className="text-sm text-muted-foreground">
              {isCreateMode
                ? 'Enter load details to create a new shipment'
                : 'Update load details'}
            </p>
          </div>
        </div>

        {/* Quick Actions (create mode only) */}
        {isCreateMode && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAIDialogOpen(true)}
              className="h-8 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              AI Import
            </Button>
            <label className="relative cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPendingFiles((prev) => [...prev, file]);
                    e.target.value = '';
                  }
                }}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs relative"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Attach Files
                {pendingFiles.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-medium">
                    {pendingFiles.length}
                  </span>
                )}
              </Button>
            </label>
            {!isMultiStop && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddStopDialogOpen(true)}
                className="h-8 text-xs"
              >
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                Multi-Stop
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pending Files List (create mode only) */}
      {isCreateMode && pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-md border border-dashed">
          {pendingFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-1.5 px-2 py-1 bg-background rounded-md text-xs border shadow-sm">
              <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="max-w-[180px] truncate font-medium">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive/10 shrink-0"
                onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Validation Errors */}
        {Object.keys(errors).length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-destructive/10 rounded">
                  <X className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-destructive mb-2">Validation Errors</h4>
                  <ul className="space-y-1 text-sm">
                    {Object.entries(errors).map(([key, error]) => {
                      if (key.startsWith('stops') && error && typeof error === 'object' && 'message' in error) {
                        return (
                          <li key={key} className="text-destructive/90">
                            <span className="font-medium">{key}:</span> {String((error as any).message || 'Invalid')}
                          </li>
                        );
                      }
                      if (key === 'stops' && Array.isArray(error)) {
                        return error.map((err: any, idx: number) => (
                          <li key={`${key}-${idx}`} className="text-destructive/90">
                            <span className="font-medium">Stop {idx + 1}:</span> {err?.message || JSON.stringify(err)}
                          </li>
                        ));
                      }
                      return (
                        <li key={key} className="text-destructive/90">
                          <span className="font-medium">{key}:</span> {String((error as any)?.message || (typeof error === 'string' ? error : 'Invalid'))}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Multi-Stop Display */}
        {isMultiStop && stops && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Multi-Stop Route ({stops.length} stops)</CardTitle>
                </div>
                {isCreateMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddStopDialogOpen(true)}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Stop
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

        {/* Customer Creation Sheet */}
        <CustomerSheet
          open={isCustomerSheetOpen}
          onOpenChange={setIsCustomerSheetOpen}
          onSuccess={handleCustomerCreated}
          mode="create"
        />

        {/* Add Stop Dialog (create mode only) */}
        {isCreateMode && (
          <AddStopDialog
            open={isAddStopDialogOpen}
            onOpenChange={setIsAddStopDialogOpen}
            onAddStop={handleAddStop}
            nextSequence={(stops?.length || 0) + 1}
            existingStops={(stops || []).map((stop: any) => ({
              ...stop,
              earliestArrival: stop.earliestArrival instanceof Date
                ? stop.earliestArrival.toISOString()
                : stop.earliestArrival,
              latestArrival: stop.latestArrival instanceof Date
                ? stop.latestArrival.toISOString()
                : stop.latestArrival,
            }))}
          />
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {/* Basic Info */}
          <Card className="shadow-sm">
            {isCreateMode ? (
              <Collapsible open={expandedSections.has('basic')} onOpenChange={() => toggleSection('basic')}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-2.5 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-blue-500/10 rounded">
                          <Package className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
                      </div>
                      {expandedSections.has('basic') ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-2.5 pt-3 pb-3">
                    {renderBasicInfoFields()}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Load number and customer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderBasicInfoFields()}
                </CardContent>
              </>
            )}
          </Card>

          {/* Pickup Information */}
          {(!isMultiStop || isEditMode) && (
            <Card className="shadow-sm">
              {isCreateMode ? (
                <Collapsible open={expandedSections.has('pickup')} onOpenChange={() => toggleSection('pickup')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-2.5 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-green-500/10 rounded">
                            <MapPin className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <CardTitle className="text-sm font-semibold">Pickup {isMultiStop && '(Optional)'}</CardTitle>
                        </div>
                        {expandedSections.has('pickup') ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-2.5 pt-3 pb-3">
                      {renderPickupFields()}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <>
                  <CardHeader>
                    <CardTitle>Pickup Information</CardTitle>
                    <CardDescription>Pickup details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderPickupFields()}
                  </CardContent>
                </>
              )}
            </Card>
          )}

          {/* Delivery Information */}
          {(!isMultiStop || isEditMode) && (
            <Card className="shadow-sm">
              {isCreateMode ? (
                <Collapsible open={expandedSections.has('delivery')} onOpenChange={() => toggleSection('delivery')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-2.5 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-orange-500/10 rounded">
                            <MapPin className="h-3.5 w-3.5 text-orange-600" />
                          </div>
                          <CardTitle className="text-sm font-semibold">Delivery {isMultiStop && '(Optional)'}</CardTitle>
                        </div>
                        {expandedSections.has('delivery') ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-2.5 pt-3 pb-3">
                      {renderDeliveryFields()}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <>
                  <CardHeader>
                    <CardTitle>Delivery Information</CardTitle>
                    <CardDescription>Delivery details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderDeliveryFields()}
                  </CardContent>
                </>
              )}
            </Card>
          )}

          {/* Load Details & Financial */}
          <Card className="shadow-sm">
            {isCreateMode ? (
              <Collapsible open={expandedSections.has('details')} onOpenChange={() => toggleSection('details')}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-2.5 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-purple-500/10 rounded">
                          <FileText className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                        <CardTitle className="text-sm font-semibold">Load Details & Financial</CardTitle>
                      </div>
                      {expandedSections.has('details') ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-2.5 pt-3 pb-3">
                    {renderDetailsFields()}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>Load Details & Financial</CardTitle>
                  <CardDescription>Specifications and pricing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderDetailsFields()}
                </CardContent>
              </>
            )}
          </Card>
        </div>

        {/* Error message */}
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

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t">
          <Link href={cancelUrl}>
            <Button type="button" variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
          >
            {isSubmitting || createMutation.isPending || updateMutation.isPending
              ? (isCreateMode ? 'Creating...' : 'Updating...')
              : (isCreateMode ? 'Create Load' : 'Update Load')}
          </Button>
        </div>
      </form>
    </div>
  );

  // Render helper functions
  function renderBasicInfoFields() {
    return (
      <>
        <div className="space-y-1.5">
          <Label htmlFor="loadNumber" className="text-xs">Load Number *</Label>
          <Input
            id="loadNumber"
            placeholder="LOAD-2024-001"
            className={isCreateMode ? "h-8 text-sm" : ""}
            {...register('loadNumber')}
          />
          {errors.loadNumber && (
            <p className="text-xs text-destructive">
              {errors.loadNumber.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="customerId" className="text-xs">Customer *</Label>
            {isCreateMode && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  Type to search
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCustomerSheetOpen(true)}
                  className="h-6 text-xs px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </Button>
              </div>
            )}
          </div>
          {isCreateMode ? (
            <CustomerCombobox
              key={`customer-${customers.length}-${watch('customerId')}`}
              value={watch('customerId') || ''}
              onValueChange={(value) => {
                if (value && value.trim() !== '') {
                  setValue('customerId', value, { shouldValidate: true });
                } else {
                  setValue('customerId', '', { shouldValidate: true });
                }
              }}
              onNewCustomer={() => setIsCustomerSheetOpen(true)}
              placeholder="Search customer by name, number, or email..."
              className="h-8 text-sm"
              customers={customers}
            />
          ) : (
            <Select
              value={watch('customerId') || ''}
              onValueChange={(value) => setValue('customerId', value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} ({customer.customerNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.customerId && (
            <p className="text-xs text-destructive">
              {errors.customerId.message}
            </p>
          )}
        </div>

        {isCreateMode && hasMultipleMcAccess ? (
          <div className="space-y-1.5">
            <McNumberSelector
              value={selectedMcNumberId || ''}
              onValueChange={(mcNumberId) => setSelectedMcNumberId(mcNumberId)}
              label="MC Number"
              required={false}
              className="text-xs"
            />
          </div>
        ) : isCreateMode && currentMcNumber ? (
          <div className="space-y-1">
            <Label className="text-xs">MC Number</Label>
            <div className="p-1.5 bg-muted rounded text-xs">
              {currentMcNumber}
            </div>
          </div>
        ) : null}

        {isCreateMode && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="driverId" className="text-xs">
                Driver {canReassignDriver && !isAdmin && '(MC only)'}
              </Label>
              {canReassignDriver && (
                <span className="text-[10px] text-muted-foreground">
                  Type to search
                </span>
              )}
            </div>
            {canReassignDriver ? (
              <DriverCombobox
                value={watch('driverId') || ''}
                onValueChange={handleDriverChange}
                placeholder="Search driver by name or number..."
                className="h-8 text-sm"
                drivers={drivers}
              />
            ) : (
              <div className="p-1.5 bg-muted rounded text-xs text-muted-foreground">
                Contact dispatcher to assign
              </div>
            )}
            {selectedDriver && (
              <div className="p-1.5 bg-muted rounded text-xs space-y-0.5">
                {selectedDriver.currentTruck && (
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-3 w-3" />
                    <span>Truck: {selectedDriver.currentTruck.truckNumber}</span>
                  </div>
                )}
                {selectedDriver.currentTrailer && (
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3 w-3" />
                    <span>Trailer: {selectedDriver.currentTrailer.trailerNumber}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5 mb-2">
          <Label htmlFor="dispatcherId" className={isCreateMode ? "text-xs" : ""}>Dispatcher</Label>
          <DispatcherCombobox
            value={watch('dispatcherId') || ''}
            onValueChange={(value) => setValue('dispatcherId', value, { shouldValidate: true })}
            className={isCreateMode ? "h-8 text-sm" : ""}
          />
        </div>

        <div className={isCreateMode ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 gap-4"}>
          <div className="space-y-1.5">
            <Label htmlFor="loadType" className={isCreateMode ? "text-xs" : ""}>Load Type *</Label>
            <Select
              onValueChange={(value) =>
                setValue('loadType', value as LoadType)
              }
              defaultValue="FTL"
              value={watch('loadType') || 'FTL'}
            >
              <SelectTrigger className={isCreateMode ? "h-8 text-sm" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FTL">Full Truckload</SelectItem>
                <SelectItem value="LTL">Less Than Truckload</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="INTERMODAL">Intermodal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="equipmentType" className={isCreateMode ? "text-xs" : ""}>Equipment Type *</Label>
            <Select
              onValueChange={(value) =>
                setValue('equipmentType', value as EquipmentType)
              }
              defaultValue="DRY_VAN"
              value={watch('equipmentType') || 'DRY_VAN'}
            >
              <SelectTrigger className={isCreateMode ? "h-8 text-sm" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRY_VAN">Dry Van</SelectItem>
                <SelectItem value="REEFER">Reefer</SelectItem>
                <SelectItem value="FLATBED">Flatbed</SelectItem>
                <SelectItem value="STEP_DECK">Step Deck</SelectItem>
                <SelectItem value="LOWBOY">Lowboy</SelectItem>
                <SelectItem value="TANKER">Tanker</SelectItem>
                <SelectItem value="CONESTOGA">Conestoga</SelectItem>
                <SelectItem value="POWER_ONLY">Power Only</SelectItem>
                <SelectItem value="HOTSHOT">Hotshot</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </>
    );
  }

  function renderPickupFields() {
    return (
      <>
        <div className="space-y-1.5">
          <Label htmlFor="pickupLocation" className={isCreateMode ? "text-xs" : ""}>
            Location Name {!isMultiStop && '*'}
          </Label>
          <Input
            id="pickupLocation"
            placeholder="ABC Warehouse"
            className={isCreateMode ? "h-8 text-sm" : ""}
            {...register('pickupLocation')}
          />
          {errors.pickupLocation && (
            <p className="text-xs text-destructive">
              {errors.pickupLocation.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pickupAddress" className={isCreateMode ? "text-xs" : ""}>
            Address {!isMultiStop && '*'}
          </Label>
          <Input
            id="pickupAddress"
            placeholder="123 Main St"
            className={isCreateMode ? "h-8 text-sm" : ""}
            {...register('pickupAddress')}
          />
        </div>

        <div className={isCreateMode ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-4"}>
          <div className="space-y-1.5">
            <Label htmlFor="pickupCity" className={isCreateMode ? "text-xs" : ""}>
              City {!isMultiStop && '*'}
            </Label>
            <Input
              id="pickupCity"
              placeholder="Dallas"
              className={isCreateMode ? "h-8 text-sm" : ""}
              {...register('pickupCity')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pickupState" className={isCreateMode ? "text-xs" : ""}>
              State {!isMultiStop && '*'}
            </Label>
            <Input
              id="pickupState"
              placeholder="TX"
              maxLength={2}
              className={isCreateMode ? "h-8 text-sm" : ""}
              {...register('pickupState')}
            />
            {errors.pickupState && (
              <p className="text-xs text-destructive">
                {errors.pickupState.message}
              </p>
            )}
          </div>
          {isCreateMode && (
            <div className="space-y-1.5">
              <Label htmlFor="pickupZip" className="text-xs">ZIP {!isMultiStop && '*'}</Label>
              <Input
                id="pickupZip"
                placeholder="75001"
                className="h-8 text-sm"
                {...register('pickupZip')}
              />
              {errors.pickupZip && (
                <p className="text-xs text-destructive">
                  {errors.pickupZip.message}
                </p>
              )}
            </div>
          )}
        </div>

        {!isCreateMode && (
          <div className="space-y-2">
            <Label htmlFor="pickupZip">ZIP</Label>
            <Input
              id="pickupZip"
              placeholder="75001"
              {...register('pickupZip')}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="pickupDate" className={isCreateMode ? "text-xs" : ""}>
            Pickup Date {!isMultiStop && '*'}
          </Label>
          <Input
            id="pickupDate"
            type="datetime-local"
            className={isCreateMode ? "h-8 text-sm" : ""}
            {...register('pickupDate')}
          />
        </div>
      </>
    );
  }

  function renderDeliveryFields() {
    return (
      <>
        <div className="space-y-1.5">
          <Label htmlFor="deliveryLocation" className={isCreateMode ? "text-xs" : ""}>
            Location Name {!isMultiStop && '*'}
          </Label>
          <Input
            id="deliveryLocation"
            placeholder="XYZ Distribution"
            className={isCreateMode ? "h-8 text-sm" : ""}
            {...register('deliveryLocation')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="deliveryAddress" className={isCreateMode ? "text-xs" : ""}>
            Address {!isMultiStop && '*'}
          </Label>
          <Input
            id="deliveryAddress"
            placeholder="456 Delivery Ave"
            className={isCreateMode ? "h-8 text-sm" : ""}
            {...register('deliveryAddress')}
          />
        </div>

        <div className={isCreateMode ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-4"}>
          <div className="space-y-1.5">
            <Label htmlFor="deliveryCity" className={isCreateMode ? "text-xs" : ""}>
              City {!isMultiStop && '*'}
            </Label>
            <Input
              id="deliveryCity"
              placeholder="Houston"
              className={isCreateMode ? "h-8 text-sm" : ""}
              {...register('deliveryCity')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deliveryState" className={isCreateMode ? "text-xs" : ""}>
              State {!isMultiStop && '*'}
            </Label>
            <Input
              id="deliveryState"
              placeholder="TX"
              maxLength={2}
              className={isCreateMode ? "h-8 text-sm" : ""}
              {...register('deliveryState')}
            />
            {errors.deliveryState && (
              <p className="text-xs text-destructive">
                {errors.deliveryState.message}
              </p>
            )}
          </div>
          {isCreateMode && (
            <div className="space-y-1.5">
              <Label htmlFor="deliveryZip" className="text-xs">ZIP {!isMultiStop && '*'}</Label>
              <Input
                id="deliveryZip"
                placeholder="77001"
                className="h-8 text-sm"
                {...register('deliveryZip')}
              />
              {errors.deliveryZip && (
                <p className="text-xs text-destructive">
                  {errors.deliveryZip.message}
                </p>
              )}
            </div>
          )}
        </div>

        {!isCreateMode && (
          <div className="space-y-2">
            <Label htmlFor="deliveryZip">ZIP</Label>
            <Input
              id="deliveryZip"
              placeholder="77001"
              {...register('deliveryZip')}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="deliveryDate" className={isCreateMode ? "text-xs" : ""}>
            Delivery Date {!isMultiStop && '*'}
          </Label>
          <Input
            id="deliveryDate"
            type="datetime-local"
            className={isCreateMode ? "h-8 text-sm" : ""}
            {...register('deliveryDate')}
          />
        </div>
      </>
    );
  }

  function renderDetailsFields() {
    return (
      <>
        <div className={isCreateMode ? "grid grid-cols-1 md:grid-cols-3 gap-3" : "grid grid-cols-2 gap-4"}>
          <div className="space-y-1.5">
            <Label htmlFor="weight" className={isCreateMode ? "text-xs" : ""}>Weight (lbs) *</Label>
            <Input
              id="weight"
              type="number"
              placeholder="45000"
              className={isCreateMode ? "h-8 text-sm" : ""}
              {...register('weight', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pieces" className={isCreateMode ? "text-xs" : ""}>Pieces</Label>
            <Input
              id="pieces"
              type="number"
              placeholder="20"
              className={isCreateMode ? "h-8 text-sm" : ""}
              {...register('pieces', { valueAsNumber: true })}
            />
          </div>
          {isCreateMode && (
            <div className="space-y-1.5">
              <Label htmlFor="commodity" className="text-xs">Commodity</Label>
              <Input
                id="commodity"
                placeholder="Electronics"
                className="h-8 text-sm"
                {...register('commodity')}
              />
            </div>
          )}
        </div>

        {!isCreateMode && (
          <div className="space-y-2">
            <Label htmlFor="commodity">Commodity</Label>
            <Input
              id="commodity"
              placeholder="Electronics"
              {...register('commodity')}
            />
          </div>
        )}

        <div className={isCreateMode ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "grid grid-cols-2 gap-4"}>
          <div className="space-y-1.5">
            <Label htmlFor="revenue" className={isCreateMode ? "text-xs" : ""}>Revenue ($) *</Label>
            <Input
              id="revenue"
              type="number"
              step="0.01"
              placeholder={isCreateMode ? "2500.00" : "1500.00"}
              className={isCreateMode ? "h-8 text-sm" : ""}
              {...register('revenue', { valueAsNumber: true })}
            />
          </div>
          {isCreateMode ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="trailerNumber" className="text-xs">Trailer Number</Label>
                <span className="text-[10px] text-muted-foreground">
                  Type to search
                </span>
              </div>
              <TrailerCombobox
                value={watch('trailerNumber') || ''}
                onValueChange={(value) => setValue('trailerNumber', value, { shouldValidate: true })}
                placeholder="Search trailer by number..."
                className="h-8 text-sm"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="driverPay">Driver Pay ($)</Label>
              <Input
                id="driverPay"
                type="number"
                step="0.01"
                placeholder="500.00"
                {...register('driverPay', { valueAsNumber: true })}
              />
            </div>
          )}
        </div>

        {isCreateMode ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loadedMiles" className="text-xs">
                Loaded Miles
                {loadedMiles !== undefined && loadedMiles !== null && !isNaN(loadedMiles) && (
                  <span className="text-xs text-muted-foreground ml-1 font-normal">({Math.round(loadedMiles)} mi)</span>
                )}
              </Label>
              <Input
                id="loadedMiles"
                type="number"
                step="0.1"
                value={loadedMiles !== undefined && loadedMiles !== null && !isNaN(loadedMiles) ? loadedMiles : ''}
                placeholder="Auto-calculated"
                className="h-8 text-sm"
                {...register('loadedMiles', {
                  valueAsNumber: true,
                  setValueAs: (v) => {
                    if (v === '' || v === null || v === undefined) return undefined;
                    const num = parseFloat(v);
                    return isNaN(num) ? undefined : num;
                  }
                })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emptyMiles" className="text-xs">
                Empty Miles
                {emptyMiles !== undefined && emptyMiles !== null && !isNaN(emptyMiles) && (
                  <span className="text-xs text-muted-foreground ml-1 font-normal">({Math.round(emptyMiles)} mi)</span>
                )}
              </Label>
              <Input
                id="emptyMiles"
                type="number"
                step="0.1"
                value={emptyMiles !== undefined && emptyMiles !== null && !isNaN(emptyMiles) ? emptyMiles : ''}
                placeholder="Auto-calculated"
                className="h-8 text-sm"
                {...register('emptyMiles', {
                  valueAsNumber: true,
                  setValueAs: (v) => {
                    if (v === '' || v === null || v === undefined) return undefined;
                    const num = parseFloat(v);
                    return isNaN(num) ? undefined : num;
                  }
                })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totalMiles" className="text-xs">
                Total Miles
                {totalMiles !== undefined && totalMiles !== null && !isNaN(totalMiles) && (
                  <span className="text-xs text-muted-foreground ml-1 font-normal">({Math.round(totalMiles)} mi)</span>
                )}
              </Label>
              <div className="flex gap-1.5">
                <Input
                  id="totalMiles"
                  type="number"
                  step="0.1"
                  value={totalMiles !== undefined && totalMiles !== null && !isNaN(totalMiles) ? totalMiles : ''}
                  placeholder="Auto-calculated"
                  className="h-8 text-sm"
                  {...register('totalMiles', {
                    valueAsNumber: true,
                    setValueAs: (v) => {
                      if (v === '' || v === null || v === undefined) return undefined;
                      const num = parseFloat(v);
                      return isNaN(num) ? undefined : num;
                    }
                  })}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={calculateMileage}
                  disabled={isCalculatingMiles}
                  title="Calculate mileage"
                  className="h-8 px-2"
                >
                  {isCalculatingMiles ? (
                    <Sparkles className="h-3 w-3 animate-spin" />
                  ) : (
                    <MapPin className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuelAdvance">Fuel Advance ($)</Label>
                <Input
                  id="fuelAdvance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('fuelAdvance', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalMiles">Total Miles</Label>
                <Input
                  id="totalMiles"
                  type="number"
                  step="0.1"
                  placeholder="1200.5"
                  {...register('totalMiles', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loadedMiles">Loaded Miles</Label>
                <Input
                  id="loadedMiles"
                  type="number"
                  step="0.1"
                  placeholder="1000.0"
                  {...register('loadedMiles', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trailerNumber">Trailer Number</Label>
                <Input
                  id="trailerNumber"
                  placeholder="TRL-001"
                  {...register('trailerNumber')}
                />
              </div>
            </div>
          </>
        )}

        <div className={isCreateMode ? "flex items-center space-x-2 pt-1" : "flex items-center space-x-2"}>
          <input
            type="checkbox"
            id="hazmat"
            {...register('hazmat')}
            className={isCreateMode ? "rounded border-gray-300" : "h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"}
          />
          <Label htmlFor="hazmat" className={isCreateMode ? "cursor-pointer text-xs" : "cursor-pointer"}>
            Hazmat Load
          </Label>
        </div>

        {!isCreateMode && (
          <div className="space-y-2">
            <Label htmlFor="dispatchNotes">Dispatch Notes</Label>
            <textarea
              id="dispatchNotes"
              rows={3}
              placeholder="Any special instructions for dispatch..."
              {...register('dispatchNotes')}
              className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        )}
      </>
    );
  }
}

