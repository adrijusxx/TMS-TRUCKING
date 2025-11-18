'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
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
} from 'lucide-react';
import { toast } from 'sonner';
import LoadAssignmentDialog from '@/components/dispatch/LoadAssignmentDialog';
import LoadStopsDisplay from './LoadStopsDisplay';
import DocumentUpload from '@/components/documents/DocumentUpload';
import LoadMap from './LoadMap';
import { usePermissions } from '@/hooks/usePermissions';
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
  const response = await fetch(`/api/loads/${loadId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete load');
  }
  return response.json();
}

async function deleteDocument(documentId: string) {
  const response = await fetch(`/api/documents/${documentId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete document');
  }
  return response.json();
}

export default function LoadDetail({ load, availableDrivers = [], availableTrucks = [] }: LoadDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

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
        <div className="flex items-center gap-4">
          <Link href="/dashboard/loads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{load.loadNumber}</h1>
            <p className="text-muted-foreground">
              Load Details & Tracking
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColors[load.status as LoadStatus]}>
            {formatStatus(load.status)}
          </Badge>
          {can('loads.edit') && (
            <Link href={`/dashboard/loads/${load.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          {can('loads.delete') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
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

      {/* Main Content Grid */}
      <div className="space-y-6">
        {/* Top Row - Key Information */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Customer Name</p>
                <p className="font-medium">{load.customer.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Customer Number</p>
                <p className="font-medium text-sm">{load.customer.customerNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium text-sm">{load.customer.type}</p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(load.revenue)}
              </p>
              {load.driverPay !== null && load.driverPay !== undefined && (
                <p className="text-sm text-muted-foreground mt-1">
                  Driver Pay: {formatCurrency(load.driverPay)}
                </p>
              )}
              {load.profit && (
                <p className="text-sm text-emerald-600 font-semibold mt-1">
                  Profit: {formatCurrency(load.profit)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Load Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Load Type</p>
                <p className="font-medium text-sm">{load.loadType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Equipment</p>
                <p className="font-medium text-sm">
                  {load.equipmentType.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Weight</p>
                <p className="font-medium text-sm">
                  {load.weight?.toLocaleString()} lbs
                </p>
              </div>
              {load.pieces && (
                <div>
                  <p className="text-xs text-muted-foreground">Pieces</p>
                  <p className="font-medium text-sm">{load.pieces}</p>
                </div>
              )}
              {load.hazmat && (
                <Badge variant="destructive" className="mt-2">HAZMAT</Badge>
              )}
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {load.driver ? (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Driver</p>
                    <p className="font-medium text-sm">
                      {load.driver.user.firstName} {load.driver.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{load.driver.driverNumber}</p>
                  </div>
                  {load.truck && (
                    <div>
                      <p className="text-xs text-muted-foreground">Truck</p>
                      <p className="font-medium text-sm">{load.truck.truckNumber}</p>
                    </div>
                  )}
                  {load.trailerNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground">Trailer</p>
                      <p className="font-medium text-sm">{load.trailerNumber}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Not assigned</p>
                  {can('loads.assign') && (
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
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle Row - Route and Map */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Route Map */}
          {(load.stops && load.stops.length > 0) ||
          (load.pickupCity && load.pickupState && load.deliveryCity && load.deliveryState) ? (
            <LoadMap load={load} />
          ) : null}

        {/* Route Info */}
        {load.stops && load.stops.length > 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Multi-Stop Route ({load.stops.length} stops)
              </CardTitle>
              <CardDescription>This load has multiple pickup and delivery stops</CardDescription>
            </CardHeader>
            <CardContent>
              <LoadStopsDisplay stops={load.stops} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Route Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {load.pickupLocation || load.pickupCity ? (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Pickup Location</p>
                  {load.pickupLocation && (
                    <p className="font-medium mb-1">{load.pickupLocation}</p>
                  )}
                  {(load.pickupAddress || load.pickupCity) && (
                    <p className="text-sm">
                      {load.pickupAddress && `${load.pickupAddress}, `}
                      {load.pickupCity && `${load.pickupCity}, `}
                      {load.pickupState} {load.pickupZip}
                    </p>
                  )}
                  {load.pickupDate && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Pickup Date: {formatDateTime(load.pickupDate)}
                    </p>
                  )}
                </div>
              ) : null}
              {load.deliveryLocation || load.deliveryCity ? (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Delivery Location</p>
                  {load.deliveryLocation && (
                    <p className="font-medium mb-1">{load.deliveryLocation}</p>
                  )}
                  {(load.deliveryAddress || load.deliveryCity) && (
                    <p className="text-sm">
                      {load.deliveryAddress && `${load.deliveryAddress}, `}
                      {load.deliveryCity && `${load.deliveryCity}, `}
                      {load.deliveryState} {load.deliveryZip}
                    </p>
                  )}
                  {load.deliveryDate && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Delivery Date: {formatDateTime(load.deliveryDate)}
                    </p>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
        </div>

        {/* Bottom Row - Additional Information */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {/* Mileage & Distance */}
        {(load.loadedMiles || load.emptyMiles || load.totalMiles) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Mileage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {load.loadedMiles !== null && load.loadedMiles !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Loaded Miles</p>
                  <p className="font-medium">{load.loadedMiles.toFixed(1)} mi</p>
                </div>
              )}
              {load.emptyMiles !== null && load.emptyMiles !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Deadhead (Empty) Miles</p>
                  <p className="font-medium">{load.emptyMiles.toFixed(1)} mi</p>
                </div>
              )}
              {load.totalMiles !== null && load.totalMiles !== undefined && (
                <div className="border-t pt-2">
                  <p className="text-sm text-muted-foreground">Total Miles</p>
                  <p className="text-lg font-semibold">{load.totalMiles.toFixed(1)} mi</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Details */}
        {(load.trailerNumber || load.pallets || load.temperature || load.dispatchNotes) && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {load.trailerNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Trailer Number</p>
                  <p className="font-medium">{load.trailerNumber}</p>
                </div>
              )}
              {load.pallets !== null && load.pallets !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Pallets</p>
                  <p className="font-medium">{load.pallets}</p>
                </div>
              )}
              {load.temperature !== null && load.temperature !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="font-medium">{load.temperature}°F</p>
                </div>
              )}
              {load.dispatchNotes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dispatch Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{load.dispatchNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        </div>

        {/* Full Width Sections */}
        <div className="space-y-6">
          {/* Status History */}
          {load.statusHistory && load.statusHistory.length > 0 && (
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {load.statusHistory.map((history: any) => (
                  <div
                    key={history.id}
                    className="flex items-start gap-4 pb-3 border-b last:border-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={statusColors[history.status as LoadStatus]}
                        >
                          {formatStatus(history.status)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(history.createdAt)}
                        </span>
                      </div>
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
                ))}
              </div>
            </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
              {can('documents.upload') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                >
                  {showDocumentUpload ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Document
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showDocumentUpload && (
              <div className="mb-4">
                <DocumentUpload
                  loadId={load.id}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['load', load.id] });
                    setShowDocumentUpload(false);
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
                        title="View"
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
                        title="Download"
                      >
                        Download
                      </Button>
                      {can('documents.delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDocumentToDelete(doc.id)}
                          title="Delete"
                          className="text-destructive hover:text-destructive"
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
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowDocumentUpload(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            )}
          </CardContent>
          </Card>
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
    </div>
  );
}

