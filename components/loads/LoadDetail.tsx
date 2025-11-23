'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate, formatDateTime, apiUrl } from '@/lib/utils';
import { LoadStatus, LoadType, EquipmentType } from '@prisma/client';
import {
  ArrowLeft,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Truck,
  FileText,
  History,
  Trash2,
  Edit,
  Plus,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  Save,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { toast } from 'sonner';
import LoadAssignmentDialog from '@/components/dispatch/LoadAssignmentDialog';
import LoadStopsDisplay from './LoadStopsDisplay';
import DocumentUpload from '@/components/documents/DocumentUpload';
import LoadMap from './LoadMap';
import LoadSegments from './LoadSegments';
import { usePermissions } from '@/hooks/usePermissions';
import DriverCombobox from '@/components/drivers/DriverCombobox';
import TruckCombobox from '@/components/trucks/TruckCombobox';
import TrailerCombobox from '@/components/trailers/TrailerCombobox';
import CustomerCombobox from '@/components/customers/CustomerCombobox';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

async function deleteDocument(documentId: string) {
  const response = await fetch(apiUrl(`/api/documents/${documentId}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete document');
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

export default function LoadDetail({ load, availableDrivers = [], availableTrucks = [] }: LoadDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic', 'financial'])
  );
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [showSegmentsDialog, setShowSegmentsDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  
  // Get MC parameter from URL for trailer search
  const mcParam = searchParams.get('mc') || null;
  
  // Form state for editable fields
  const [formData, setFormData] = useState({
    pickupLocation: load.pickupLocation || '',
    pickupAddress: load.pickupAddress || '',
    pickupCity: load.pickupCity || '',
    pickupState: load.pickupState || '',
    pickupZip: load.pickupZip || '',
    pickupDate: load.pickupDate ? new Date(load.pickupDate).toISOString().slice(0, 16) : '',
    deliveryLocation: load.deliveryLocation || '',
    deliveryAddress: load.deliveryAddress || '',
    deliveryCity: load.deliveryCity || '',
    deliveryState: load.deliveryState || '',
    deliveryZip: load.deliveryZip || '',
    deliveryDate: load.deliveryDate ? new Date(load.deliveryDate).toISOString().slice(0, 16) : '',
    trailerNumber: load.trailerNumber || '',
    truckId: load.truckId || '',
    driverId: load.driverId || '',
    customerId: load.customerId || '',
    equipmentType: load.equipmentType || '',
    weight: load.weight || '',
    pieces: load.pieces || '',
    commodity: load.commodity || '',
    pallets: load.pallets || '',
    temperature: load.temperature || '',
    dispatchNotes: load.dispatchNotes || '',
    loadedMiles: load.loadedMiles || '',
    emptyMiles: load.emptyMiles || '',
    totalMiles: load.totalMiles || '',
  });

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

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
    
    // Only include changed fields
    if (formData.pickupLocation !== (load.pickupLocation || '')) updatePayload.pickupLocation = formData.pickupLocation;
    if (formData.pickupAddress !== (load.pickupAddress || '')) updatePayload.pickupAddress = formData.pickupAddress;
    if (formData.pickupCity !== (load.pickupCity || '')) updatePayload.pickupCity = formData.pickupCity;
    if (formData.pickupState !== (load.pickupState || '')) updatePayload.pickupState = formData.pickupState;
    if (formData.pickupZip !== (load.pickupZip || '')) updatePayload.pickupZip = formData.pickupZip;
    if (formData.pickupDate && formData.pickupDate !== (load.pickupDate ? new Date(load.pickupDate).toISOString().slice(0, 16) : '')) {
      updatePayload.pickupDate = new Date(formData.pickupDate).toISOString();
    }
    
    if (formData.deliveryLocation !== (load.deliveryLocation || '')) updatePayload.deliveryLocation = formData.deliveryLocation;
    if (formData.deliveryAddress !== (load.deliveryAddress || '')) updatePayload.deliveryAddress = formData.deliveryAddress;
    if (formData.deliveryCity !== (load.deliveryCity || '')) updatePayload.deliveryCity = formData.deliveryCity;
    if (formData.deliveryState !== (load.deliveryState || '')) updatePayload.deliveryState = formData.deliveryState;
    if (formData.deliveryZip !== (load.deliveryZip || '')) updatePayload.deliveryZip = formData.deliveryZip;
    if (formData.deliveryDate && formData.deliveryDate !== (load.deliveryDate ? new Date(load.deliveryDate).toISOString().slice(0, 16) : '')) {
      updatePayload.deliveryDate = new Date(formData.deliveryDate).toISOString();
    }
    
    if (formData.trailerNumber !== (load.trailerNumber || '')) updatePayload.trailerNumber = formData.trailerNumber;
    if (formData.truckId !== (load.truckId || '')) updatePayload.truckId = formData.truckId || null;
    if (formData.driverId !== (load.driverId || '')) updatePayload.driverId = formData.driverId || null;
    if (formData.weight !== (load.weight || '')) updatePayload.weight = formData.weight ? Number(formData.weight) : null;
    if (formData.pieces !== (load.pieces || '')) updatePayload.pieces = formData.pieces ? Number(formData.pieces) : null;
    if (formData.commodity !== (load.commodity || '')) updatePayload.commodity = formData.commodity || null;
    if (formData.pallets !== (load.pallets || '')) updatePayload.pallets = formData.pallets ? Number(formData.pallets) : null;
    if (formData.temperature !== (load.temperature || '')) updatePayload.temperature = formData.temperature ? Number(formData.temperature) : null;
    if (formData.dispatchNotes !== (load.dispatchNotes || '')) updatePayload.dispatchNotes = formData.dispatchNotes || null;
    if (formData.loadedMiles !== (load.loadedMiles || '')) updatePayload.loadedMiles = formData.loadedMiles ? Number(formData.loadedMiles) : null;
    if (formData.emptyMiles !== (load.emptyMiles || '')) updatePayload.emptyMiles = formData.emptyMiles ? Number(formData.emptyMiles) : null;
    if (formData.totalMiles !== (load.totalMiles || '')) updatePayload.totalMiles = formData.totalMiles ? Number(formData.totalMiles) : null;
    if (formData.customerId !== (load.customerId || '')) updatePayload.customerId = formData.customerId || null;
    if (formData.equipmentType !== (load.equipmentType || '')) updatePayload.equipmentType = formData.equipmentType || null;
    
    if (Object.keys(updatePayload).length > 0) {
      updateMutation.mutate(updatePayload);
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

  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load', load.id] });
      toast.success('Document deleted successfully');
      setDocumentToDelete(null);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete document');
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

      {/* Main Content - Collapsible Sections */}
      <div className="space-y-4">
        {/* Route Map - Moved to top, compact with expand option */}
        {((load.stops && load.stops.length > 0) ||
          (load.pickupCity && load.pickupState && load.deliveryCity && load.deliveryState)) && (
          <Card className="shadow-sm">
            <CardHeader className="py-2.5 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-red-500/10 rounded">
                    <MapPin className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Route Map</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMapExpanded(!mapExpanded)}
                  className="h-7 text-xs"
                >
                  {mapExpanded ? (
                    <>
                      <Minimize2 className="h-3.5 w-3.5 mr-1.5" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3.5 w-3.5 mr-1.5" />
                      Expand
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-3 pb-3">
              <div className={mapExpanded ? 'h-[600px]' : 'h-[300px]'}>
                <LoadMap load={load} compact={!mapExpanded} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic Information & Financial */}
        <div className="grid gap-3 md:grid-cols-2">
          {/* Basic Information - Editable */}
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
                <CardContent className="space-y-3 pt-3 pb-3">
                  {/* Assignment (Truck/Trailer/Driver) - Moved to top */}
                  {can('loads.edit') && (
                    <div className="space-y-2 pb-2 border-b">
                      <Label className="text-xs font-semibold text-muted-foreground">Assignment</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="truckId" className="text-xs">Truck</Label>
                          <TruckCombobox
                            value={formData.truckId || ''}
                            onValueChange={(value) => setFormData({ ...formData, truckId: value })}
                            placeholder="Search truck..."
                            trucks={availableTrucks}
                          />
                        </div>
                        <div>
                          <Label htmlFor="trailerNumber" className="text-xs">Trailer</Label>
                          <TrailerCombobox
                            value={formData.trailerNumber || ''}
                            onValueChange={(value) => setFormData({ ...formData, trailerNumber: value })}
                            placeholder="Search trailer..."
                            mcParam={mcParam}
                          />
                        </div>
                        <div>
                          <Label htmlFor="driverId" className="text-xs">Driver</Label>
                          <DriverCombobox
                            value={formData.driverId || ''}
                            onValueChange={(value) => setFormData({ ...formData, driverId: value })}
                            placeholder="Search driver..."
                            drivers={availableDrivers}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {!can('loads.edit') && (
                    <div className="space-y-2 pb-2 border-b">
                      <Label className="text-xs font-semibold text-muted-foreground">Assignment</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {load.truck && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Truck</Label>
                            <p className="font-medium text-sm">#{load.truck.truckNumber}</p>
                          </div>
                        )}
                        {load.trailerNumber && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Trailer</Label>
                            <p className="font-medium text-sm">{load.trailerNumber}</p>
                          </div>
                        )}
                        {load.driver && (
                          <div className="col-span-2">
                            <Label className="text-xs text-muted-foreground">Driver</Label>
                            <p className="text-sm font-medium">
                              {load.driver.user.firstName} {load.driver.user.lastName} (#{load.driver.driverNumber})
                            </p>
                          </div>
                        )}
                        {!load.driver && can('loads.assign') && (
                          <div className="col-span-2">
                            <LoadAssignmentDialog
                              load={{
                                id: load.id,
                                loadNumber: load.loadNumber,
                                pickupCity: load.pickupCity || '',
                                pickupState: load.pickupState || '',
                                deliveryCity: load.deliveryCity || '',
                                deliveryState: load.deliveryState || '',
                              }}
                              availableDrivers={availableDrivers}
                              availableTrucks={availableTrucks}
                              onAssign={() => {
                                queryClient.invalidateQueries({ queryKey: ['loads'] });
                                queryClient.invalidateQueries({ queryKey: ['load', load.id] });
                                router.refresh();
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Load Type */}
                  <div className="pb-2 border-b">
                    <div>
                      <Label className="text-xs text-muted-foreground">Load Type</Label>
                      <p className="font-medium text-sm">{load.loadType}</p>
                    </div>
                  </div>

                  {/* Pickup Information */}
                  {can('loads.edit') && (
                    <div className="space-y-2 pb-2 border-b">
                      <Label className="text-xs font-semibold text-muted-foreground">Pickup</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <Label htmlFor="pickupLocation" className="text-xs">Location</Label>
                          <Input
                            id="pickupLocation"
                            value={formData.pickupLocation}
                            onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="Location name"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="pickupAddress" className="text-xs">Address</Label>
                          <Input
                            id="pickupAddress"
                            value={formData.pickupAddress}
                            onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="Street address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pickupCity" className="text-xs">City</Label>
                          <Input
                            id="pickupCity"
                            value={formData.pickupCity}
                            onChange={(e) => setFormData({ ...formData, pickupCity: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pickupState" className="text-xs">State</Label>
                          <Input
                            id="pickupState"
                            value={formData.pickupState}
                            onChange={(e) => setFormData({ ...formData, pickupState: e.target.value.toUpperCase().slice(0, 2) })}
                            className="h-7 text-xs"
                            placeholder="XX"
                            maxLength={2}
                          />
                        </div>
                        <div>
                          <Label htmlFor="pickupZip" className="text-xs">ZIP</Label>
                          <Input
                            id="pickupZip"
                            value={formData.pickupZip}
                            onChange={(e) => setFormData({ ...formData, pickupZip: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="ZIP code"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pickupDate" className="text-xs">Date & Time</Label>
                          <Input
                            id="pickupDate"
                            type="datetime-local"
                            value={formData.pickupDate}
                            onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {!can('loads.edit') && (load.pickupLocation || load.pickupCity) && (
                    <div className="space-y-2 pb-2 border-b">
                      <Label className="text-xs font-semibold text-muted-foreground">Pickup</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {load.pickupLocation && <p className="font-medium text-sm col-span-2">{load.pickupLocation}</p>}
                        {(load.pickupAddress || load.pickupCity) && (
                          <p className="text-xs text-muted-foreground col-span-2">
                            {load.pickupAddress && `${load.pickupAddress}, `}
                            {load.pickupCity && `${load.pickupCity}, `}
                            {load.pickupState} {load.pickupZip}
                          </p>
                        )}
                        {load.pickupDate && (
                          <p className="text-xs text-muted-foreground col-span-2 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(load.pickupDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delivery Information */}
                  {can('loads.edit') && (
                    <div className="space-y-2 pb-2 border-b">
                      <Label className="text-xs font-semibold text-muted-foreground">Delivery</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <Label htmlFor="deliveryLocation" className="text-xs">Location</Label>
                          <Input
                            id="deliveryLocation"
                            value={formData.deliveryLocation}
                            onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="Location name"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="deliveryAddress" className="text-xs">Address</Label>
                          <Input
                            id="deliveryAddress"
                            value={formData.deliveryAddress}
                            onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="Street address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="deliveryCity" className="text-xs">City</Label>
                          <Input
                            id="deliveryCity"
                            value={formData.deliveryCity}
                            onChange={(e) => setFormData({ ...formData, deliveryCity: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <Label htmlFor="deliveryState" className="text-xs">State</Label>
                          <Input
                            id="deliveryState"
                            value={formData.deliveryState}
                            onChange={(e) => setFormData({ ...formData, deliveryState: e.target.value.toUpperCase().slice(0, 2) })}
                            className="h-7 text-xs"
                            placeholder="XX"
                            maxLength={2}
                          />
                        </div>
                        <div>
                          <Label htmlFor="deliveryZip" className="text-xs">ZIP</Label>
                          <Input
                            id="deliveryZip"
                            value={formData.deliveryZip}
                            onChange={(e) => setFormData({ ...formData, deliveryZip: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="ZIP code"
                          />
                        </div>
                        <div>
                          <Label htmlFor="deliveryDate" className="text-xs">Date & Time</Label>
                          <Input
                            id="deliveryDate"
                            type="datetime-local"
                            value={formData.deliveryDate}
                            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {!can('loads.edit') && (load.deliveryLocation || load.deliveryCity) && (
                    <div className="space-y-2 pb-2 border-b">
                      <Label className="text-xs font-semibold text-muted-foreground">Delivery</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {load.deliveryLocation && <p className="font-medium text-sm col-span-2">{load.deliveryLocation}</p>}
                        {(load.deliveryAddress || load.deliveryCity) && (
                          <p className="text-xs text-muted-foreground col-span-2">
                            {load.deliveryAddress && `${load.deliveryAddress}, `}
                            {load.deliveryCity && `${load.deliveryCity}, `}
                            {load.deliveryState} {load.deliveryZip}
                          </p>
                        )}
                        {load.deliveryDate && (
                          <p className="text-xs text-muted-foreground col-span-2 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(load.deliveryDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Financial */}
          <Card className="shadow-sm">
            <Collapsible open={expandedSections.has('financial')} onOpenChange={() => toggleSection('financial')}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-2.5 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-green-500/10 rounded">
                        <DollarSign className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <CardTitle className="text-sm font-semibold">Financial</CardTitle>
                    </div>
                    {expandedSections.has('financial') ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-2.5 pt-3 pb-3">
                  {/* Customer - Moved from Basic Information */}
                  <div className="pb-2 border-b">
                    {can('loads.edit') ? (
                      <div>
                        <Label htmlFor="customerId" className="text-xs">Customer</Label>
                        <CustomerCombobox
                          value={formData.customerId || ''}
                          onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                          placeholder="Search customer..."
                          customers={[]} // Will fetch from API
                        />
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs text-muted-foreground">Customer</Label>
                        <p className="font-medium text-sm">{load.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{load.customer.customerNumber}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(load.revenue)}</p>
                  </div>
                  {load.driverPay !== null && load.driverPay !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Driver Pay</p>
                      <p className="font-medium text-sm">{formatCurrency(load.driverPay)}</p>
                    </div>
                  )}
                  {load.profit && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Profit</p>
                      <p className="font-medium text-sm text-emerald-600">{formatCurrency(load.profit)}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Mileage</Label>
                    {can('loads.edit') ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="loadedMiles" className="text-xs">Loaded Miles</Label>
                          <Input
                            id="loadedMiles"
                            type="number"
                            step="0.1"
                            value={formData.loadedMiles}
                            onChange={(e) => setFormData({ ...formData, loadedMiles: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="0.0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="emptyMiles" className="text-xs">Empty Miles</Label>
                          <Input
                            id="emptyMiles"
                            type="number"
                            step="0.1"
                            value={formData.emptyMiles}
                            onChange={(e) => setFormData({ ...formData, emptyMiles: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="0.0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="totalMiles" className="text-xs">Total Miles</Label>
                          <Input
                            id="totalMiles"
                            type="number"
                            step="0.1"
                            value={formData.totalMiles}
                            onChange={(e) => setFormData({ ...formData, totalMiles: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="0.0"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {load.loadedMiles !== null && load.loadedMiles !== undefined && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Loaded Miles:</span>
                            <span className="font-medium">{load.loadedMiles.toFixed(1)} mi</span>
                          </div>
                        )}
                        {load.emptyMiles !== null && load.emptyMiles !== undefined && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Empty Miles:</span>
                            <span className="font-medium">{load.emptyMiles.toFixed(1)} mi</span>
                          </div>
                        )}
                        {load.totalMiles !== null && load.totalMiles !== undefined && (
                          <div className="flex justify-between text-xs pt-1 border-t">
                            <span className="text-muted-foreground font-medium">Total Miles:</span>
                            <span className="font-semibold">{load.totalMiles.toFixed(1)} mi</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Load Details - Moved to Financial section */}
                  <div className="pt-3 border-t space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Load Details</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {can('loads.edit') ? (
                        <>
                          <div>
                            <Label htmlFor="equipmentType" className="text-xs">Equipment</Label>
                            <Select
                              value={formData.equipmentType}
                              onValueChange={(value) => setFormData({ ...formData, equipmentType: value })}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="Select equipment type" />
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
                          <div>
                            <Label htmlFor="weight" className="text-xs">Weight (lbs)</Label>
                            <Input
                              id="weight"
                              type="number"
                              value={formData.weight}
                              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                              className="h-7 text-xs"
                              placeholder="Weight"
                            />
                          </div>
                          <div>
                            <Label htmlFor="pieces" className="text-xs">Pieces</Label>
                            <Input
                              id="pieces"
                              type="number"
                              value={formData.pieces}
                              onChange={(e) => setFormData({ ...formData, pieces: e.target.value })}
                              className="h-7 text-xs"
                              placeholder="Pieces"
                            />
                          </div>
                          <div>
                            <Label htmlFor="commodity" className="text-xs">Commodity</Label>
                            <Input
                              id="commodity"
                              value={formData.commodity}
                              onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                              className="h-7 text-xs"
                              placeholder="Commodity"
                            />
                          </div>
                          <div>
                            <Label htmlFor="pallets" className="text-xs">Pallets</Label>
                            <Input
                              id="pallets"
                              type="number"
                              value={formData.pallets}
                              onChange={(e) => setFormData({ ...formData, pallets: e.target.value })}
                              className="h-7 text-xs"
                              placeholder="Pallets"
                            />
                          </div>
                          {((formData.equipmentType || load.equipmentType) === 'REEFER' || formData.temperature) && (
                            <div>
                              <Label htmlFor="temperature" className="text-xs">Temperature (°F)</Label>
                              <Input
                                id="temperature"
                                type="number"
                                value={formData.temperature}
                                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                                className="h-7 text-xs"
                                placeholder="Temperature"
                              />
                            </div>
                          )}
                          {load.hazmat && (
                            <Badge variant="destructive" className="mt-1">HAZMAT</Badge>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            <Label className="text-xs text-muted-foreground">Equipment</Label>
                            <p className="font-medium text-sm">{load.equipmentType.replace(/_/g, ' ')}</p>
                          </div>
                          {load.weight && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Weight</Label>
                              <p className="font-medium text-sm">{load.weight.toLocaleString()} lbs</p>
                            </div>
                          )}
                          {load.pieces && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Pieces</Label>
                              <p className="font-medium text-sm">{load.pieces}</p>
                            </div>
                          )}
                          {load.commodity && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Commodity</Label>
                              <p className="font-medium text-sm">{load.commodity}</p>
                            </div>
                          )}
                          {load.pallets && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Pallets</Label>
                              <p className="font-medium text-sm">{load.pallets}</p>
                            </div>
                          )}
                          {load.temperature && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Temperature</Label>
                              <p className="font-medium text-sm">{load.temperature}°F</p>
                            </div>
                          )}
                          {load.hazmat && (
                            <Badge variant="destructive" className="mt-1">HAZMAT</Badge>
                          )}
                        </>
                      )}
                    </div>
                    {can('loads.edit') && (
                      <div className="col-span-2">
                        <Label htmlFor="dispatchNotes" className="text-xs">Dispatch Notes</Label>
                        <textarea
                          id="dispatchNotes"
                          value={formData.dispatchNotes}
                          onChange={(e) => setFormData({ ...formData, dispatchNotes: e.target.value })}
                          className="w-full min-h-[60px] p-2 text-xs border rounded-md resize-none"
                          placeholder="Dispatch notes..."
                        />
                      </div>
                    )}
                    {!can('loads.edit') && load.dispatchNotes && (
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Dispatch Notes</Label>
                        <p className="text-xs whitespace-pre-wrap mt-1">{load.dispatchNotes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>


        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {load.statusHistory && load.statusHistory.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistoryDialog(true)}
              className="h-8 text-xs"
            >
              <History className="h-3.5 w-3.5 mr-1.5" />
              Status History ({load.statusHistory.length})
            </Button>
          )}
          {load.segments && load.segments.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSegmentsDialog(true)}
              className="h-8 text-xs"
            >
              <Truck className="h-3.5 w-3.5 mr-1.5" />
              Load Segments ({load.segments.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDocumentsDialog(true)}
            className="h-8 text-xs"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Documents ({load.documents?.length || 0})
          </Button>
        </div>

      </div>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (documentToDelete) {
                  deleteDocumentMutation.mutate(documentToDelete);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDocumentMutation.isPending}
            >
              {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Status History
            </DialogTitle>
            <DialogDescription>
              View all status changes for this load
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {load.statusHistory && load.statusHistory.length > 0 ? (
              load.statusHistory.map((history: any) => (
                <div
                  key={history.id}
                  className="flex items-start gap-4 p-3 border rounded-lg"
                >
                  <Badge
                    variant="outline"
                    className={statusColors[history.status as LoadStatus]}
                  >
                    {formatStatus(history.status)}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(history.createdAt)}
                    </p>
                    {history.notes && (
                      <p className="text-sm mt-1">{history.notes}</p>
                    )}
                    {history.location && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Location: {history.location}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No status history available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Segments Dialog */}
      <Dialog open={showSegmentsDialog} onOpenChange={setShowSegmentsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Load Segments
            </DialogTitle>
            <DialogDescription>
              Manage load segments and assignments
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <LoadSegments
              loadId={load.id}
              segments={load.segments || []}
              availableDrivers={availableDrivers}
              availableTrucks={availableTrucks}
              canEdit={can('loads.edit')}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog open={showDocumentsDialog} onOpenChange={setShowDocumentsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </DialogTitle>
            <DialogDescription>
              Manage documents for this load
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {can('documents.upload') && (
              <div className="pb-4 border-b">
                <DocumentUpload
                  loadId={load.id}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['load', load.id] });
                    router.refresh();
                  }}
                />
              </div>
            )}
            {load.documents && load.documents.length > 0 ? (
              <div className="space-y-3">
                {load.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{doc.title || doc.fileName}</p>
                          <Badge variant="outline" className="text-xs">
                            {doc.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{doc.fileName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                        className="h-8 text-xs"
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = doc.fileUrl;
                          link.download = doc.fileName;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="h-8 text-xs"
                      >
                        Download
                      </Button>
                      {can('documents.delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDocumentToDelete(doc.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No documents attached to this load</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

