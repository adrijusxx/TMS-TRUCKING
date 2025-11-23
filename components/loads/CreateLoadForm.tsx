'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createLoadSchema, type CreateLoadInput } from '@/lib/validations/load';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadType, EquipmentType } from '@prisma/client';
import { ArrowLeft, Sparkles, X, FileText, Upload, MapPin, Plus, User, Truck, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import AILoadImporter from './AILoadImporter';
import LoadStopsDisplay from './LoadStopsDisplay';
import EditableLoadStops from './EditableLoadStops';
import AddStopDialog from './AddStopDialog';
import CreateCustomerDialog from '@/components/customers/CreateCustomerDialog';
import CustomerCombobox from '@/components/customers/CustomerCombobox';
import DocumentUpload from '@/components/documents/DocumentUpload';
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
  // Admin can see all drivers, dispatchers and others only see drivers for their MC number
  const url = (isAdmin)
    ? apiUrl('/api/drivers?limit=1000&status=AVAILABLE')
    : (mcNumber)
      ? apiUrl(`/api/drivers?limit=1000&status=AVAILABLE&mcNumber=${encodeURIComponent(mcNumber)}`)
      : apiUrl('/api/drivers?limit=1000&status=AVAILABLE');
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch drivers');
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

export default function CreateLoadForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isAddStopDialogOpen, setIsAddStopDialogOpen] = useState(false);
  const [createdLoadId, setCreatedLoadId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isCalculatingMiles, setIsCalculatingMiles] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'pickup', 'delivery', 'details'])); // All sections expanded by default

  // Get current user's MC number from session
  const currentMcNumber = session?.user?.mcNumber || null;
  const userRole = session?.user?.role;
  const isAdmin = userRole === 'ADMIN';
  const isDispatcher = userRole === 'DISPATCHER';
  // Dispatchers and admins can reassign drivers, but dispatchers are restricted to their MC number
  const canReassignDriver = isAdmin || isDispatcher;

  const { data: customersData, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers', currentMcNumber, canReassignDriver, isAdmin],
    queryFn: () => fetchDrivers(currentMcNumber, canReassignDriver, isAdmin),
    enabled: !!session, // Only fetch when session is available
  });

  const customers = customersData?.data || [];
  const drivers = driversData?.data || [];

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CreateLoadInput>({
    resolver: zodResolver(createLoadSchema) as any,
    defaultValues: {
      loadType: 'FTL',
      equipmentType: 'DRY_VAN',
      hazmat: false,
      fuelAdvance: 0,
      customerId: '', // Initialize customerId as empty string (not undefined)
    },
  });

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

  // Calculate mileage function
  const calculateMileage = async () => {
    try {
      setIsCalculatingMiles(true);
      setError(null);

      if (isMultiStop && stops && stops.length > 0) {
        // Multi-stop load calculation
        const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
        
        // Validate all stops have city and state
        const invalidStops = sortedStops.filter(
          stop => !stop.city || !stop.state
        );
        
        if (invalidStops.length > 0) {
          throw new Error('All stops must have city and state for mileage calculation');
        }

        let loadedMiles = 0;
        let emptyMiles = 0;

        // Calculate distances between consecutive stops
        for (let i = 0; i < sortedStops.length - 1; i++) {
          const currentStop = sortedStops[i];
          const nextStop = sortedStops[i + 1];
          
          const distance = await calculateDistance(
            { city: currentStop.city, state: currentStop.state },
            { city: nextStop.city, state: nextStop.state }
          );

          // Deadhead (empty miles): When truck is empty between delivery and next pickup
          // Loaded miles: All other segments (pickup to delivery, delivery to delivery if multiple deliveries, pickup to pickup if multiple pickups)
          if (currentStop.stopType === 'DELIVERY' && nextStop.stopType === 'PICKUP') {
            // Truck is empty - this is deadhead
            emptyMiles += distance;
          } else {
            // Truck is carrying cargo - this is loaded miles
            // Cases: PICKUP to PICKUP (multiple pickups), PICKUP to DELIVERY, DELIVERY to DELIVERY (multiple deliveries)
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
        // Single-stop load calculation
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

  // Auto-calculate mileage when stops or location fields are populated
  useEffect(() => {
    // Skip if already calculating
    if (isCalculatingMiles) return;
    
    // Check if miles are already set (avoid unnecessary calculations)
    const hasMiles = (loadedMiles !== undefined && loadedMiles !== null && !isNaN(loadedMiles)) ||
                     (emptyMiles !== undefined && emptyMiles !== null && !isNaN(emptyMiles)) ||
                     (totalMiles !== undefined && totalMiles !== null && !isNaN(totalMiles));
    
    if (hasMiles) return; // Skip if miles are already calculated

    // Auto-calculate for multi-stop loads
    if (stops && stops.length > 1) {
      const allValid = stops.every((s: any) => s.city && s.state);
      if (allValid) {
        // Small delay to ensure form is ready
        const timer = setTimeout(() => {
          calculateMileage().catch((err) => {
            console.error('Auto-calculation failed:', err);
          });
        }, 1500);
        return () => clearTimeout(timer);
      }
    } 
    // Auto-calculate for single-stop loads
    else if (pickupCity && pickupState && deliveryCity && deliveryState && (!stops || stops.length === 0)) {
      const timer = setTimeout(() => {
        calculateMileage().catch((err) => {
          console.error('Auto-calculation failed:', err);
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, pickupCity, pickupState, deliveryCity, deliveryState, loadedMiles, emptyMiles, totalMiles, isCalculatingMiles]);

  // Helper function to calculate distance between two locations
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

      // Extract distance in miles from the matrix result
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

  const createMutation = useMutation({
    mutationFn: createLoad,
    onSuccess: async (data) => {
      const loadId = data.data.id;
      
      // Upload any pending files after load is created
      if (pendingFiles.length > 0) {
        try {
          await Promise.all(
            pendingFiles.map(async (file) => {
              const formData = new FormData();
              formData.append('file', file);
              formData.append('loadId', loadId);
              formData.append('type', 'RATE_CONFIRMATION');
              formData.append('fileName', file.name);
              formData.append('title', file.name); // Title is required
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
      router.push(`/dashboard/loads/${loadId}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const onSubmit = async (data: CreateLoadInput) => {
    setError(null);
    
    // Validate customerId is present
    if (!data.customerId || data.customerId.trim() === '') {
      setError('Please select a customer before submitting');
      toast.error('Customer is required');
      return;
    }
    
    // Normalize and validate stops if present
    if (data.stops && Array.isArray(data.stops) && data.stops.length > 0) {
      console.log('Original stops data:', JSON.stringify(data.stops, null, 2));
      const normalizedStops = data.stops.map((stop: any) => {
        // Ensure all required fields are present and properly formatted
        const normalized: any = {
          stopType: stop.stopType,
          sequence: stop.sequence,
          address: stop.address?.trim() || '',
          city: stop.city?.trim() || '',
          state: stop.state?.trim().toUpperCase().slice(0, 2) || '',
          zip: stop.zip?.trim() || '',
        };
        
        // Add optional fields if they exist
        if (stop.company) normalized.company = stop.company.trim();
        if (stop.phone) normalized.phone = stop.phone.trim();
        if (stop.contactName) normalized.contactName = stop.contactName.trim();
        if (stop.contactPhone) normalized.contactPhone = stop.contactPhone.trim();
        if (stop.notes) normalized.notes = stop.notes.trim();
        if (stop.specialInstructions) normalized.specialInstructions = stop.specialInstructions.trim();
        if (stop.items) normalized.items = stop.items;
        if (stop.totalPieces) normalized.totalPieces = stop.totalPieces;
        if (stop.totalWeight) normalized.totalWeight = stop.totalWeight;
        
        // Normalize dates - convert Date objects to ISO strings if needed
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
      
      // Validate each stop has required fields
      const invalidStops = normalizedStops.filter(
        (stop: any) => !stop.address || !stop.city || !stop.state || stop.state.length !== 2 || !stop.zip || stop.zip.length < 5
      );
      
      if (invalidStops.length > 0) {
        const invalidSequences = invalidStops.map((s: any) => s.sequence).join(', ');
        setError(`Stops ${invalidSequences} are missing required fields (address, city, state, zip)`);
        toast.error(`Please complete all required fields for stops: ${invalidSequences}`);
        return;
      }
      
      // Replace stops with normalized version
      data.stops = normalizedStops;
      console.log('Normalized stops data:', JSON.stringify(normalizedStops, null, 2));
    }
    
    console.log('Form submitted with data:', {
      loadNumber: data.loadNumber,
      customerId: data.customerId,
      stopsCount: data.stops?.length || 0,
      hasPickup: !!data.pickupLocation,
      hasDelivery: !!data.deliveryLocation,
    });
    try {
      createMutation.mutate(data as CreateLoadInput);
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    }
  };

  const handleDataExtracted = async (data: Partial<CreateLoadInput>, pdfFile?: File) => {
    // If AI imported a PDF, add it to pending files to attach after load creation
    if (pdfFile) {
      setPendingFiles((prev) => [...prev, pdfFile]);
      toast.info(`PDF file "${pdfFile.name}" will be attached after load creation`);
    }
    
    console.log('AI data extracted:', {
      loadNumber: data.loadNumber,
      customerId: data.customerId,
      stopsCount: data.stops?.length || 0,
      weight: data.weight,
      revenue: data.revenue,
      equipmentType: data.equipmentType,
      loadType: data.loadType,
      commodity: data.commodity,
      pieces: data.pieces,
      totalMiles: data.totalMiles,
    });
    
    // Refresh customers list if a customer was matched or created
    if (data.customerId) {
      console.log('Refetching customers to ensure customer is in list...');
      await refetchCustomers();
      // Invalidate and refetch to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      // Wait longer for the customers to be available and query to update
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Auto-calculate miles if AI provided mileage data
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
      // Auto-calculate mileage for multi-stop loads if not provided
      // Wait for stops to be set in form before calculating
      setTimeout(() => {
        const currentStops = watch('stops');
        if (currentStops && currentStops.length > 1) {
          // Verify all stops have city and state
          const allValid = currentStops.every((s: any) => s.city && s.state);
          if (allValid) {
            calculateMileage().catch(console.error);
          }
        }
      }, 1000);
    } else if (data.pickupCity && data.pickupState && data.deliveryCity && data.deliveryState && !data.stops) {
      // Auto-calculate mileage for single-stop loads if not provided
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

    // Set customerId first if available (before other fields)
    if (data.customerId) {
      // Get the most up-to-date customer list
      const updatedCustomers = queryClient.getQueryData(['customers']) as any;
      const allCustomers = updatedCustomers?.data || customersData?.data || customers;
      const customerExists = allCustomers.some((c: any) => c.id === data.customerId);
      
      console.log('Setting customerId:', data.customerId);
      console.log('Customer exists in list:', customerExists);
      console.log('Total customers in list:', allCustomers.length);
      
      if (customerExists) {
        setValue('customerId', data.customerId, { shouldValidate: false });
        console.log('✓ Successfully set customerId:', data.customerId);
      } else {
        // If customer doesn't exist in list yet, try one more refetch
        console.warn('Customer ID not found in customers list, attempting one more refetch...');
        await refetchCustomers();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const retryCustomers = queryClient.getQueryData(['customers']) as any;
        const retryAllCustomers = retryCustomers?.data || [];
        const retryExists = retryAllCustomers.some((c: any) => c.id === data.customerId);
        
        if (retryExists) {
          setValue('customerId', data.customerId, { shouldValidate: false });
          console.log('✓ Successfully set customerId after retry:', data.customerId);
        } else {
          // Set it anyway - the backend has it, so it should work
          setValue('customerId', data.customerId, { shouldValidate: false });
          console.warn('⚠ Set customerId anyway (not in list but exists in backend):', data.customerId);
          toast.info('Customer selected. If not visible in dropdown, please refresh the page.');
        }
      }
    }
    
    // Set load number
    if (data.loadNumber) {
      setValue('loadNumber', data.loadNumber, { shouldValidate: false });
    }
    
    // Set load type and equipment type
    if (data.loadType) {
      setValue('loadType', data.loadType as LoadType, { shouldValidate: false });
    } else {
      setValue('loadType', 'FTL', { shouldValidate: false });
    }
    
    if (data.equipmentType) {
      setValue('equipmentType', data.equipmentType as EquipmentType, { shouldValidate: false });
    } else {
      setValue('equipmentType', 'DRY_VAN', { shouldValidate: false });
    }
    
    // Set numeric fields
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
    
    if (data.pallets !== undefined && data.pallets !== null) {
      const pallets = typeof data.pallets === 'string' ? parseInt(data.pallets) : data.pallets;
      if (!isNaN(pallets) && pallets > 0) {
        setValue('pallets', pallets, { shouldValidate: false });
      }
    }
    
    if (data.totalMiles !== undefined && data.totalMiles !== null) {
      const totalMiles = typeof data.totalMiles === 'string' ? parseFloat(data.totalMiles) : data.totalMiles;
      if (!isNaN(totalMiles) && totalMiles > 0) {
        setValue('totalMiles', totalMiles, { shouldValidate: false });
      }
    }
    
    if (data.driverPay !== undefined && data.driverPay !== null) {
      const driverPay = typeof data.driverPay === 'string' ? parseFloat(data.driverPay) : data.driverPay;
      if (!isNaN(driverPay) && driverPay > 0) {
        setValue('driverPay', driverPay, { shouldValidate: false });
      }
    }
    
    // Set text fields
    if (data.commodity) {
      setValue('commodity', data.commodity, { shouldValidate: false });
    }
    
    if (data.temperature) {
      setValue('temperature', data.temperature, { shouldValidate: false });
    }
    
    if (data.dispatchNotes) {
      setValue('dispatchNotes', data.dispatchNotes, { shouldValidate: false });
    }
    
    // Set hazmat
    if (data.hazmat !== undefined) {
      const hazmatValue = typeof data.hazmat === 'boolean' ? data.hazmat : data.hazmat === 'true' || data.hazmat === true;
      setValue('hazmat', hazmatValue, { shouldValidate: false });
    } else {
      setValue('hazmat', false, { shouldValidate: false });
    }
    
    // Set fuel advance
    if (data.fuelAdvance !== undefined && data.fuelAdvance !== null) {
      const fuelAdvance = typeof data.fuelAdvance === 'string' ? parseFloat(data.fuelAdvance) : data.fuelAdvance;
      if (!isNaN(fuelAdvance) && fuelAdvance >= 0) {
        setValue('fuelAdvance', fuelAdvance, { shouldValidate: false });
      }
    } else {
      setValue('fuelAdvance', 0, { shouldValidate: false });
    }
    
    // Set stops for multi-stop loads
    if (data.stops && Array.isArray(data.stops) && data.stops.length > 0) {
      setValue('stops', data.stops, { shouldValidate: false });
      
      // Extract first pickup and last delivery for route display and form fields
      const pickups = data.stops.filter((s: any) => s.stopType === 'PICKUP').sort((a: any, b: any) => a.sequence - b.sequence);
      const deliveries = data.stops.filter((s: any) => s.stopType === 'DELIVERY').sort((a: any, b: any) => a.sequence - b.sequence);
      
      // Populate pickup fields from first pickup stop
      if (pickups.length > 0) {
        const firstPickup = pickups[0];
        if (firstPickup.company) setValue('pickupLocation', firstPickup.company, { shouldValidate: false });
        if (firstPickup.address) setValue('pickupAddress', firstPickup.address, { shouldValidate: false });
        if (firstPickup.city) setValue('pickupCity', firstPickup.city, { shouldValidate: false });
        if (firstPickup.state) setValue('pickupState', firstPickup.state, { shouldValidate: false });
        if (firstPickup.zip) setValue('pickupZip', firstPickup.zip, { shouldValidate: false });
        
        // Format pickup date for datetime-local input
        if (firstPickup.earliestArrival) {
          try {
            const pickupDate = new Date(firstPickup.earliestArrival);
            const year = pickupDate.getFullYear();
            const month = String(pickupDate.getMonth() + 1).padStart(2, '0');
            const day = String(pickupDate.getDate()).padStart(2, '0');
            const hours = String(pickupDate.getHours()).padStart(2, '0');
            const minutes = String(pickupDate.getMinutes()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
            setValue('pickupDate', formattedDate, { shouldValidate: false });
          } catch (e) {
            console.warn('Failed to format pickup date:', e);
          }
        }
      }
      
      // Populate delivery fields from last delivery stop
      if (deliveries.length > 0) {
        const lastDelivery = deliveries[deliveries.length - 1];
        if (lastDelivery.company) setValue('deliveryLocation', lastDelivery.company, { shouldValidate: false });
        if (lastDelivery.address) setValue('deliveryAddress', lastDelivery.address, { shouldValidate: false });
        if (lastDelivery.city) setValue('deliveryCity', lastDelivery.city, { shouldValidate: false });
        if (lastDelivery.state) setValue('deliveryState', lastDelivery.state, { shouldValidate: false });
        if (lastDelivery.zip) setValue('deliveryZip', lastDelivery.zip, { shouldValidate: false });
        
        // Format delivery date for datetime-local input
        if (lastDelivery.latestArrival) {
          try {
            const deliveryDate = new Date(lastDelivery.latestArrival);
            const year = deliveryDate.getFullYear();
            const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
            const day = String(deliveryDate.getDate()).padStart(2, '0');
            const hours = String(deliveryDate.getHours()).padStart(2, '0');
            const minutes = String(deliveryDate.getMinutes()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
            setValue('deliveryDate', formattedDate, { shouldValidate: false });
          } catch (e) {
            console.warn('Failed to format delivery date:', e);
          }
        }
      }
    } else {
      // Single-stop load - set pickup/delivery fields if available
      if (data.pickupLocation) setValue('pickupLocation', data.pickupLocation, { shouldValidate: false });
      if (data.pickupAddress) setValue('pickupAddress', data.pickupAddress, { shouldValidate: false });
      if (data.pickupCity) setValue('pickupCity', data.pickupCity, { shouldValidate: false });
      if (data.pickupState) setValue('pickupState', data.pickupState, { shouldValidate: false });
      if (data.pickupZip) setValue('pickupZip', data.pickupZip, { shouldValidate: false });
      if (data.pickupDate) setValue('pickupDate', data.pickupDate, { shouldValidate: false });
      if (data.deliveryLocation) setValue('deliveryLocation', data.deliveryLocation, { shouldValidate: false });
      if (data.deliveryAddress) setValue('deliveryAddress', data.deliveryAddress, { shouldValidate: false });
      if (data.deliveryCity) setValue('deliveryCity', data.deliveryCity, { shouldValidate: false });
      if (data.deliveryState) setValue('deliveryState', data.deliveryState, { shouldValidate: false });
      if (data.deliveryZip) setValue('deliveryZip', data.deliveryZip, { shouldValidate: false });
      if (data.deliveryDate) setValue('deliveryDate', data.deliveryDate, { shouldValidate: false });
    }
    
    setIsAIDialogOpen(false);
  };

  // Handle driver selection - auto-populate truck and trailer
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

  // Handle customer creation
  const handleCustomerCreated = async (customerId: string) => {
    // Invalidate and refetch customers query
    await queryClient.invalidateQueries({ queryKey: ['customers'] });
    const result = await refetchCustomers();
    
    // Wait a bit for the query cache to update
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get the latest customers from the query cache
    const latestCustomers = result.data?.data || customersData?.data || [];
    const customerExists = latestCustomers.some((c: any) => c.id === customerId);
    
    if (customerExists) {
      setValue('customerId', customerId, { shouldValidate: true });
      toast.success('Customer created and selected');
    } else {
      // Try one more refetch if not found
      const retryResult = await refetchCustomers();
      const retryCustomers = retryResult.data?.data || [];
      if (retryCustomers.some((c: any) => c.id === customerId)) {
        setValue('customerId', customerId, { shouldValidate: true });
        toast.success('Customer created and selected');
      } else {
        // If still not found, set it anyway (it might be a timing issue)
        // Ensure customerId is a valid string before setting
        if (customerId && typeof customerId === 'string' && customerId.trim() !== '') {
          setValue('customerId', customerId, { shouldValidate: true });
          toast.success('Customer created. If not visible, please refresh the page.');
        } else {
          toast.error('Customer created but could not be selected. Please select it manually from the dropdown.');
        }
      }
    }
  };

  // Handle adding a new stop manually
  const handleAddStop = (stop: Omit<any, 'sequence'>) => {
    const currentStops = watch('stops') || [];
    const nextSequence = currentStops.length > 0 
      ? Math.max(...currentStops.map((s: any) => s.sequence)) + 1 
      : 1;
    
    // Ensure all required fields are present and convert Date to string
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

  // Auto-set MC number from session on mount
  useEffect(() => {
    if (currentMcNumber) {
      const currentMcValue = watch('mcNumber');
      if (!currentMcValue || currentMcValue !== currentMcNumber) {
        setValue('mcNumber', currentMcNumber, { shouldValidate: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMcNumber]);

  return (
    <div className="space-y-4 pb-6">
      {/* AI Import Dialog */}
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

      {/* Header Section with Compact Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/loads">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <p className="text-sm text-muted-foreground">
              Enter load details to create a new shipment
            </p>
          </div>
        </div>
        
        {/* Compact Quick Actions */}
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
                  e.target.value = ''; // Reset input
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
      </div>

      {/* Pending Files List - Compact */}
      {pendingFiles.length > 0 && (
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

        {/* Display validation errors */}
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
                      // Handle nested errors (like stops[0].address)
                      if (key.startsWith('stops') && error && typeof error === 'object' && 'message' in error) {
                        return (
                          <li key={key} className="text-destructive/90">
                            <span className="font-medium">{key}:</span> {error.message || 'Invalid'}
                          </li>
                        );
                      }
                      // Handle array errors
                      if (key === 'stops' && Array.isArray(error)) {
                        return error.map((err: any, idx: number) => (
                          <li key={`${key}-${idx}`} className="text-destructive/90">
                            <span className="font-medium">Stop {idx + 1}:</span> {err?.message || JSON.stringify(err)}
                          </li>
                        ));
                      }
                      return (
                        <li key={key} className="text-destructive/90">
                          <span className="font-medium">{key}:</span> {error?.message || (typeof error === 'string' ? error : 'Invalid')}
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
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
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
            </CardContent>
          </Card>
        )}


        {/* Customer Creation Dialog */}
        <CreateCustomerDialog
          open={isCustomerDialogOpen}
          onOpenChange={setIsCustomerDialogOpen}
          onCustomerCreated={handleCustomerCreated}
          quickCreate={true}
        />

        {/* Add Stop Dialog */}
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

        <div className="grid gap-3 md:grid-cols-2">
        {/* Basic Info */}
        <Card className="shadow-sm">
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
                 <div className="space-y-1.5">
                   <Label htmlFor="loadNumber" className="text-xs">Load Number *</Label>
                   <Input
                     id="loadNumber"
                     placeholder="LOAD-2024-001"
                     className="h-8 text-sm"
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
                     <Button
                       type="button"
                       variant="ghost"
                       size="sm"
                       onClick={() => setIsCustomerDialogOpen(true)}
                       className="h-6 text-xs px-2"
                     >
                       <Plus className="h-3 w-3 mr-1" />
                       New
                     </Button>
                   </div>
                   <CustomerCombobox
                     key={`customer-${customers.length}-${watch('customerId')}`}
                     value={watch('customerId') || ''}
                     onValueChange={(value) => {
                       if (value && value.trim() !== '') {
                         setValue('customerId', value, { shouldValidate: true });
                         console.log('Customer selected via combobox:', value);
                       } else {
                         setValue('customerId', '', { shouldValidate: true });
                       }
                     }}
                     onNewCustomer={() => setIsCustomerDialogOpen(true)}
                     placeholder="Search customer by name, number, or email..."
                     className="h-8 text-sm"
                     customers={customers}
                   />
                   {errors.customerId && (
                     <p className="text-xs text-destructive">
                       {errors.customerId.message}
                     </p>
                   )}
                 </div>

                 {currentMcNumber && (
                   <div className="space-y-1">
                     <Label className="text-xs">MC Number</Label>
                     <div className="p-1.5 bg-muted rounded text-xs">
                       {currentMcNumber}
                     </div>
                   </div>
                 )}

                 <div className="space-y-1.5">
                   <Label htmlFor="driverId" className="text-xs">
                     Driver {canReassignDriver && !isAdmin && '(MC only)'}
                   </Label>
                   {canReassignDriver ? (
                     <Select
                       value={watch('driverId') || ''}
                       onValueChange={handleDriverChange}
                     >
                       <SelectTrigger className="h-8 text-sm">
                         <SelectValue placeholder="Select driver (optional)" />
                       </SelectTrigger>
                       <SelectContent>
                         {drivers.map((driver: any) => (
                           <SelectItem key={driver.id} value={driver.id}>
                             {driver.user?.firstName} {driver.user?.lastName} ({driver.driverNumber})
                             {isAdmin && driver.mcNumber && ` - MC: ${typeof driver.mcNumber === 'object' ? driver.mcNumber.number : driver.mcNumber}`}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
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

                 <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1.5">
                     <Label htmlFor="loadType" className="text-xs">Load Type *</Label>
                     <Select
                       onValueChange={(value) =>
                         setValue('loadType', value as LoadType)
                       }
                       defaultValue="FTL"
                     >
                       <SelectTrigger className="h-8 text-sm">
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
                     <Label htmlFor="equipmentType" className="text-xs">Equipment Type *</Label>
                     <Select
                       onValueChange={(value) =>
                         setValue('equipmentType', value as EquipmentType)
                       }
                       defaultValue="DRY_VAN"
                     >
                       <SelectTrigger className="h-8 text-sm">
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
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

         {/* Pickup Information */}
         <Card className="shadow-sm">
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
             <div className="space-y-1.5">
               <Label htmlFor="pickupLocation" className="text-xs">Location Name {!isMultiStop && '*'}</Label>
               <Input
                 id="pickupLocation"
                 placeholder="ABC Warehouse"
                 className="h-8 text-sm"
                 {...register('pickupLocation')}
               />
               {errors.pickupLocation && (
                 <p className="text-xs text-destructive">
                   {errors.pickupLocation.message}
                 </p>
               )}
             </div>

             <div className="space-y-1.5">
               <Label htmlFor="pickupAddress" className="text-xs">Address {!isMultiStop && '*'}</Label>
               <Input
                 id="pickupAddress"
                 placeholder="123 Main St"
                 className="h-8 text-sm"
                 {...register('pickupAddress')}
               />
             </div>

             <div className="grid grid-cols-3 gap-2">
               <div className="space-y-1.5">
                 <Label htmlFor="pickupCity" className="text-xs">City {!isMultiStop && '*'}</Label>
                 <Input
                   id="pickupCity"
                   placeholder="Dallas"
                   className="h-8 text-sm"
                   {...register('pickupCity')}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label htmlFor="pickupState" className="text-xs">State {!isMultiStop && '*'}</Label>
                 <Input
                   id="pickupState"
                   placeholder="TX"
                   maxLength={2}
                   className="h-8 text-sm"
                   {...register('pickupState')}
                 />
                 {errors.pickupState && (
                   <p className="text-xs text-destructive">
                     {errors.pickupState.message}
                   </p>
                 )}
               </div>
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
             </div>

             <div className="space-y-1.5">
               <Label htmlFor="pickupDate" className="text-xs">Pickup Date {!isMultiStop && '*'}</Label>
               <Input
                 id="pickupDate"
                 type="datetime-local"
                 className="h-8 text-sm"
                 {...register('pickupDate')}
               />
             </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

         {/* Delivery Information */}
         <Card className="shadow-sm">
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
             <div className="space-y-1.5">
               <Label htmlFor="deliveryLocation" className="text-xs">Location Name {!isMultiStop && '*'}</Label>
               <Input
                 id="deliveryLocation"
                 placeholder="XYZ Distribution"
                 className="h-8 text-sm"
                 {...register('deliveryLocation')}
               />
             </div>

             <div className="space-y-1.5">
               <Label htmlFor="deliveryAddress" className="text-xs">Address {!isMultiStop && '*'}</Label>
               <Input
                 id="deliveryAddress"
                 placeholder="456 Delivery Ave"
                 className="h-8 text-sm"
                 {...register('deliveryAddress')}
               />
             </div>

             <div className="grid grid-cols-3 gap-2">
               <div className="space-y-1.5">
                 <Label htmlFor="deliveryCity" className="text-xs">City {!isMultiStop && '*'}</Label>
                 <Input
                   id="deliveryCity"
                   placeholder="Houston"
                   className="h-8 text-sm"
                   {...register('deliveryCity')}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label htmlFor="deliveryState" className="text-xs">State {!isMultiStop && '*'}</Label>
                 <Input
                   id="deliveryState"
                   placeholder="TX"
                   maxLength={2}
                   className="h-8 text-sm"
                   {...register('deliveryState')}
                 />
                 {errors.deliveryState && (
                   <p className="text-xs text-destructive">
                     {errors.deliveryState.message}
                   </p>
                 )}
               </div>
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
             </div>

             <div className="space-y-1.5">
               <Label htmlFor="deliveryDate" className="text-xs">Delivery Date {!isMultiStop && '*'}</Label>
               <Input
                 id="deliveryDate"
                 type="datetime-local"
                 className="h-8 text-sm"
                 {...register('deliveryDate')}
               />
             </div>
               </CardContent>
             </CollapsibleContent>
           </Collapsible>
         </Card>

         {/* Load Details & Financial - Now beside Delivery */}
         <Card className="shadow-sm">
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
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               <div className="space-y-1.5">
                 <Label htmlFor="weight" className="text-xs">Weight (lbs) *</Label>
                 <Input
                   id="weight"
                   type="number"
                   placeholder="45000"
                   className="h-8 text-sm"
                   {...register('weight', { valueAsNumber: true })}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label htmlFor="pieces" className="text-xs">Pieces</Label>
                 <Input
                   id="pieces"
                   type="number"
                   placeholder="20"
                   className="h-8 text-sm"
                   {...register('pieces', { valueAsNumber: true })}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label htmlFor="commodity" className="text-xs">Commodity</Label>
                 <Input
                   id="commodity"
                   placeholder="Electronics"
                   className="h-8 text-sm"
                   {...register('commodity')}
                 />
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               <div className="space-y-1.5">
                 <Label htmlFor="revenue" className="text-xs">Revenue ($) *</Label>
                 <Input
                   id="revenue"
                   type="number"
                   step="0.01"
                   placeholder="2500.00"
                   className="h-8 text-sm"
                   {...register('revenue', { valueAsNumber: true })}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label htmlFor="trailerNumber" className="text-xs">Trailer Number</Label>
                 <Input
                   id="trailerNumber"
                   placeholder="TRL-001"
                   className="h-8 text-sm"
                   {...register('trailerNumber')}
                 />
               </div>
             </div>

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

             <div className="flex items-center space-x-2 pt-1">
               <input
                 type="checkbox"
                 id="hazmat"
                 {...register('hazmat')}
                 className="rounded border-gray-300"
               />
               <Label htmlFor="hazmat" className="cursor-pointer text-xs">
                 Hazmat Load
               </Label>
             </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
        </div>

         {/* Error message at bottom before submit buttons */}
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
           <Link href="/dashboard/loads">
             <Button type="button" variant="outline" size="sm">
               Cancel
             </Button>
           </Link>
           <Button 
             type="submit" 
             size="sm"
             disabled={isSubmitting || createMutation.isPending}
           >
             {isSubmitting || createMutation.isPending
               ? 'Creating...'
               : 'Create Load'}
           </Button>
         </div>
      </form>
    </div>
  );
}

