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
import { ArrowLeft, Sparkles, X, FileText, Upload, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import AILoadImporter from './AILoadImporter';
import LoadStopsDisplay from './LoadStopsDisplay';
import EditableLoadStops from './EditableLoadStops';
import DocumentUpload from '@/components/documents/DocumentUpload';
import { apiUrl } from '@/lib/utils';

async function fetchCustomers() {
  const response = await fetch(apiUrl('/api/customers'));
  if (!response.ok) throw new Error('Failed to fetch customers');
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
  const [error, setError] = useState<string | null>(null);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [createdLoadId, setCreatedLoadId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isCalculatingMiles, setIsCalculatingMiles] = useState(false);

  const { data: customersData, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const customers = customersData?.data || [];

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
    },
  });

  // Watch for stops to determine if this is a multi-stop load
  const stops = watch('stops');
  const isMultiStop = stops && Array.isArray(stops) && stops.length > 0;
  
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
    
    // Refresh customers list if a new customer was created
    if (data.customerId) {
      await refetchCustomers();
      // Wait a bit for the customers to be available
      await new Promise(resolve => setTimeout(resolve, 300));
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
      // Verify customer exists in the updated list
      const updatedCustomers = queryClient.getQueryData(['customers']) as any;
      const allCustomers = updatedCustomers?.data || customersData?.data || customers;
      const customerExists = allCustomers.some((c: any) => c.id === data.customerId);
      
      if (customerExists) {
        setValue('customerId', data.customerId, { shouldValidate: false });
        console.log('Set customerId:', data.customerId);
      } else {
        console.warn('Customer ID not found in customers list:', data.customerId);
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

  return (
    <div className="space-y-6">
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

      {/* AI Import Button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Quick Import</h3>
              <p className="text-sm text-muted-foreground">
                Upload a rate confirmation PDF to auto-fill the form
              </p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsAIDialogOpen(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Import from PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Attach Files</CardTitle>
          <CardDescription>
            Upload rate confirmation, BOL, POD, or other documents to attach to this load
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUpload
            loadId={undefined} // Will be set after load creation
            onFileSelected={(file) => {
              setPendingFiles((prev) => [...prev, file]);
            }}
          />
          {pendingFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Files to attach after creation:</p>
              {pendingFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/loads">
            <Button type="button" variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold">Load Information</h2>
            <p className="text-sm text-muted-foreground">
              Basic details about the shipment
            </p>
          </div>
        </div>

        {/* Display validation errors */}
        {Object.keys(errors).length > 0 && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            <strong>Validation Errors:</strong>
            <ul className="list-disc list-inside mt-2">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>
                  {key}: {error?.message || 'Invalid'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Multi-Stop Display */}
        {isMultiStop && stops && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Multi-Stop Load ({stops.length} stops)</CardTitle>
              <CardDescription>
                This load has multiple stops. Click Edit on any stop to modify details. Single pickup/delivery fields are not required for multi-stop loads.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditableLoadStops
                stops={stops as any}
                onChange={(updatedStops) => {
                  // Ensure earliestArrival and latestArrival are strings
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
                compact={stops.length > 3}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Load number and customer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loadNumber">Load Number *</Label>
              <Input
                id="loadNumber"
                placeholder="LOAD-2024-001"
                {...register('loadNumber')}
              />
              {errors.loadNumber && (
                <p className="text-sm text-destructive">
                  {errors.loadNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerId">Customer *</Label>
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
              {errors.customerId && (
                <p className="text-sm text-destructive">
                  {errors.customerId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loadType">Load Type *</Label>
                <Select
                  onValueChange={(value) =>
                    setValue('loadType', value as LoadType)
                  }
                  defaultValue="FTL"
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="equipmentType">Equipment Type *</Label>
                <Select
                  onValueChange={(value) =>
                    setValue('equipmentType', value as EquipmentType)
                  }
                  defaultValue="DRY_VAN"
                >
                  <SelectTrigger>
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
        </Card>

        {/* Pickup Information - Show but mark as optional for multi-stop loads */}
        <Card>
          <CardHeader>
            <CardTitle>Pickup Information {isMultiStop && '(Optional for multi-stop loads)'}</CardTitle>
            <CardDescription>
              {isMultiStop 
                ? 'Single pickup details (optional - stops are used for multi-stop loads)'
                : 'Origin details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickupLocation">Location Name {!isMultiStop && '*'}</Label>
              <Input
                id="pickupLocation"
                placeholder="ABC Warehouse"
                {...register('pickupLocation')}
              />
              {errors.pickupLocation && (
                <p className="text-sm text-destructive">
                  {errors.pickupLocation.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupAddress">Address {!isMultiStop && '*'}</Label>
              <Input
                id="pickupAddress"
                placeholder="123 Main St"
                {...register('pickupAddress')}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupCity">City {!isMultiStop && '*'}</Label>
                <Input
                  id="pickupCity"
                  placeholder="Dallas"
                  {...register('pickupCity')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupState">State {!isMultiStop && '*'}</Label>
                <Input
                  id="pickupState"
                  placeholder="TX"
                  maxLength={2}
                  {...register('pickupState')}
                />
                {errors.pickupState && (
                  <p className="text-sm text-destructive">
                    {errors.pickupState.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupZip">ZIP {!isMultiStop && '*'}</Label>
                <Input
                  id="pickupZip"
                  placeholder="75001"
                  {...register('pickupZip')}
                />
                {errors.pickupZip && (
                  <p className="text-sm text-destructive">
                    {errors.pickupZip.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupDate">Pickup Date {!isMultiStop && '*'}</Label>
              <Input
                id="pickupDate"
                type="datetime-local"
                {...register('pickupDate')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupContact">Contact Name</Label>
                <Input
                  id="pickupContact"
                  placeholder="John Doe"
                  {...register('pickupContact')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupPhone">Contact Phone</Label>
                <Input
                  id="pickupPhone"
                  type="tel"
                  placeholder="555-0100"
                  {...register('pickupPhone')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information - Show but mark as optional for multi-stop loads */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Information {isMultiStop && '(Optional for multi-stop loads)'}</CardTitle>
            <CardDescription>
              {isMultiStop 
                ? 'Single delivery details (optional - stops are used for multi-stop loads)'
                : 'Destination details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryLocation">Location Name {!isMultiStop && '*'}</Label>
              <Input
                id="deliveryLocation"
                placeholder="XYZ Distribution"
                {...register('deliveryLocation')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Address {!isMultiStop && '*'}</Label>
              <Input
                id="deliveryAddress"
                placeholder="456 Delivery Ave"
                {...register('deliveryAddress')}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryCity">City {!isMultiStop && '*'}</Label>
                <Input
                  id="deliveryCity"
                  placeholder="Houston"
                  {...register('deliveryCity')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryState">State {!isMultiStop && '*'}</Label>
                <Input
                  id="deliveryState"
                  placeholder="TX"
                  maxLength={2}
                  {...register('deliveryState')}
                />
                {errors.deliveryState && (
                  <p className="text-sm text-destructive">
                    {errors.deliveryState.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryZip">ZIP {!isMultiStop && '*'}</Label>
                <Input
                  id="deliveryZip"
                  placeholder="77001"
                  {...register('deliveryZip')}
                />
                {errors.deliveryZip && (
                  <p className="text-sm text-destructive">
                    {errors.deliveryZip.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Delivery Date {!isMultiStop && '*'}</Label>
              <Input
                id="deliveryDate"
                type="datetime-local"
                {...register('deliveryDate')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryContact">Contact Name</Label>
                <Input
                  id="deliveryContact"
                  placeholder="Jane Smith"
                  {...register('deliveryContact')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryPhone">Contact Phone</Label>
                <Input
                  id="deliveryPhone"
                  type="tel"
                  placeholder="555-0200"
                  {...register('deliveryPhone')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Load Details & Financial */}
        <Card>
          <CardHeader>
            <CardTitle>Load Details & Financial</CardTitle>
            <CardDescription>Specifications and pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs) *</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="45000"
                  {...register('weight', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pieces">Pieces</Label>
                <Input
                  id="pieces"
                  type="number"
                  placeholder="20"
                  {...register('pieces', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commodity">Commodity</Label>
              <Input
                id="commodity"
                placeholder="Electronics"
                {...register('commodity')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="revenue">Revenue ($) *</Label>
                <Input
                  id="revenue"
                  type="number"
                  step="0.01"
                  placeholder="2500.00"
                  {...register('revenue', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverPay">Driver Pay ($)</Label>
                <Input
                  id="driverPay"
                  type="number"
                  step="0.01"
                  placeholder="1800.00"
                  {...register('driverPay', { 
                    valueAsNumber: true,
                    setValueAs: (v) => {
                      if (v === '' || v === null || v === undefined) return undefined;
                      const num = parseFloat(v);
                      return isNaN(num) ? undefined : num;
                    }
                  })}
                />
                {errors.driverPay && (
                  <p className="text-sm text-destructive">
                    {errors.driverPay.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loadedMiles">Loaded Miles</Label>
                <Input
                  id="loadedMiles"
                  type="number"
                  step="0.1"
                  placeholder="Auto-calculated"
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
              <div className="space-y-2">
                <Label htmlFor="emptyMiles">Empty Miles (Deadhead)</Label>
                <Input
                  id="emptyMiles"
                  type="number"
                  step="0.1"
                  placeholder="Auto-calculated"
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalMiles">Total Miles</Label>
                <div className="flex gap-2">
                  <Input
                    id="totalMiles"
                    type="number"
                    step="0.1"
                    placeholder="Auto-calculated"
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
                    onClick={calculateMileage}
                    disabled={isCalculatingMiles}
                    title="Calculate mileage based on stops"
                  >
                    {isCalculatingMiles ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 mr-2" />
                        Calculate
                      </>
                    )}
                  </Button>
                </div>
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hazmat"
                {...register('hazmat')}
                className="rounded border-gray-300"
              />
              <Label htmlFor="hazmat" className="cursor-pointer">
                Hazmat Load
              </Label>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Error message at bottom before submit buttons */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Link href="/dashboard/loads">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={isSubmitting || createMutation.isPending}
            onClick={(e) => {
              // Log form state before submission
              const formData = watch();
              console.log('Button clicked, form data:', {
                loadNumber: formData.loadNumber,
                customerId: formData.customerId,
                stopsCount: formData.stops?.length || 0,
                weight: formData.weight,
                revenue: formData.revenue,
                errors: Object.keys(errors),
              });
            }}
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

