'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

interface EntityOption {
  value: string;
  label: string;
  description: string;
  apiEndpoint: string;
  entityType: string;
}

const ENTITY_OPTIONS: EntityOption[] = [
  {
    value: 'trucks',
    label: 'Trucks',
    description: 'Delete trucks from the system',
    apiEndpoint: '/api/trucks',
    entityType: 'trucks',
  },
  {
    value: 'drivers',
    label: 'Drivers',
    description: 'Delete drivers from the system',
    apiEndpoint: '/api/drivers',
    entityType: 'drivers',
  },
  {
    value: 'trailers',
    label: 'Trailers',
    description: 'Delete trailers from the system',
    apiEndpoint: '/api/trailers',
    entityType: 'trailers',
  },
  {
    value: 'loads',
    label: 'Loads',
    description: 'Delete loads from the system',
    apiEndpoint: '/api/loads',
    entityType: 'loads',
  },
  {
    value: 'customers',
    label: 'Customers',
    description: 'Delete customers (brokers) from the system',
    apiEndpoint: '/api/customers',
    entityType: 'customers',
  },
  {
    value: 'invoices',
    label: 'Invoices',
    description: 'Cancel invoices (only non-PAID/POSTED)',
    apiEndpoint: '/api/invoices',
    entityType: 'invoices',
  },
  {
    value: 'vendors',
    label: 'Vendors',
    description: 'Delete vendors from the system',
    apiEndpoint: '/api/vendors',
    entityType: 'vendors',
  },
  {
    value: 'locations',
    label: 'Locations',
    description: 'Delete locations from the system',
    apiEndpoint: '/api/locations',
    entityType: 'locations',
  },
];

interface EntityRecord {
  id: string;
  name?: string;
  label?: string;
  number?: string;
  [key: string]: any;
}

export default function DataManagementCategory() {
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteEverythingDialog, setShowDeleteEverythingDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteEverythingConfirmText, setDeleteEverythingConfirmText] = useState('');
  const queryClient = useQueryClient();
  const { isAdmin } = usePermissions();

  const entityOption = ENTITY_OPTIONS.find((opt) => opt.value === selectedEntity);

  // Fetch all records for the selected entity type with pagination
  const { data: records, isLoading, error } = useQuery<EntityRecord[]>({
    queryKey: ['bulk-delete-entities', selectedEntity],
    queryFn: async () => {
      if (!entityOption) return [];
      
      const allRecords: EntityRecord[] = [];
      let page = 1;
      const limit = 1000; // Fetch in large batches
      let hasMore = true;
      
      while (hasMore) {
        // Build query parameters
        const params = new URLSearchParams();
        params.set('limit', limit.toString());
        params.set('page', page.toString());
        
        // Always include deleted records for admin users in data management
        if (isAdmin) {
          params.set('includeDeleted', 'true');
        }
        
        // Construct the full URL
        const baseUrl = apiUrl(entityOption.apiEndpoint);
        const fullUrl = `${baseUrl}?${params.toString()}`;
        
        const response = await fetch(fullUrl);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Failed to fetch records: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error?.message || 'API returned an error');
        }
        
        const pageData = result.data || [];
        
        if (pageData.length > 0) {
          allRecords.push(...pageData);
          
          // Check if there are more pages
          const total = result.meta?.total || 0;
          const totalPages = result.meta?.totalPages || Math.ceil(total / limit);
          hasMore = page < totalPages && pageData.length === limit;
          page++;
        } else {
          hasMore = false;
        }
        
        // Safety limit: prevent infinite loops
        if (page > 100) {
          console.warn('Reached pagination safety limit');
          hasMore = false;
        }
      }
      
      console.log(`Fetched ${allRecords.length} records for ${entityOption.label}`);
      return allRecords;
    },
    enabled: !!selectedEntity && !!entityOption,
    retry: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!entityOption) throw new Error('No entity selected');
      
      const response = await fetch(apiUrl('/api/bulk-actions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: entityOption.entityType,
          action: 'delete',
          ids,
          hardDelete: true, // Permanently delete from system
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Bulk delete failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.data?.message || `Successfully deleted ${selectedIds.size} record(s)`);
      setSelectedIds(new Set());
      setConfirmText('');
      setShowDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: [entityOption?.entityType] });
      queryClient.invalidateQueries({ queryKey: ['bulk-delete-entities', selectedEntity] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Bulk delete failed');
    },
  });

  const deleteEverythingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(apiUrl('/api/admin/delete-everything'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmText: 'DELETE EVERYTHING',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Delete everything failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.data?.message || 'Successfully deleted all data');
      setDeleteEverythingConfirmText('');
      setShowDeleteEverythingDialog(false);
      // Invalidate all queries
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Delete everything failed');
    },
  });

  const handleDeleteEverything = () => {
    if (deleteEverythingConfirmText !== 'DELETE EVERYTHING') {
      toast.error('Please type "DELETE EVERYTHING" exactly to confirm');
      return;
    }
    deleteEverythingMutation.mutate();
  };

  const handleSelectAll = () => {
    if (!records) return;
    
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)));
    }
  };

  const handleDeleteAll = () => {
    if (!records || records.length === 0) {
      toast.error('No records available to delete');
      return;
    }
    // Select all records
    setSelectedIds(new Set(records.map((r) => r.id)));
    setShowDeleteDialog(true);
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteClick = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one record to delete');
      return;
    }
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm');
      return;
    }
    deleteMutation.mutate(Array.from(selectedIds));
  };

  const getRecordDisplayName = (record: EntityRecord): string => {
    // Try various common field names for display
    return (
      record.name ||
      record.label ||
      record.number ||
      record.truckNumber ||
      record.driverNumber ||
      record.trailerNumber ||
      record.loadNumber ||
      record.invoiceNumber ||
      record.unitNumber ||
      record.licenseNumber ||
      record.licensePlate ||
      record.companyName ||
      record.vendorName ||
      record.locationName ||
      record.id
    );
  };

  const allSelected = records && selectedIds.size === records.length && records.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Data Management</h2>
        <p className="text-muted-foreground">
          Bulk delete records from the system. This action is permanent and cannot be undone.
        </p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>⚠️ Hard Delete Warning</AlertTitle>
        <AlertDescription>
          <strong>This tool performs HARD DELETES</strong> - records will be <strong>permanently removed</strong> from the database, including soft-deleted records. 
          This action <strong>CANNOT BE UNDONE</strong>. All associated data will be permanently lost. 
          Make sure you have backups before proceeding.
        </AlertDescription>
      </Alert>

      {isAdmin && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Nuclear Option: Delete Everything
            </CardTitle>
            <CardDescription>
              Permanently delete ALL data from your company except Company and MC Number records.
              This will remove all loads, drivers, trucks, invoices, customers, and all other data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>EXTREME DANGER</AlertTitle>
              <AlertDescription>
                This will permanently delete <strong>EVERYTHING</strong> except:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Company records (preserved)</li>
                  <li>MC Number records (preserved)</li>
                  <li>Admin users (preserved for safety)</li>
                </ul>
                <strong className="block mt-2">This action CANNOT BE UNDONE!</strong>
              </AlertDescription>
            </Alert>
            <Button
              variant="destructive"
              size="lg"
              onClick={() => setShowDeleteEverythingDialog(true)}
              disabled={deleteEverythingMutation.isPending}
              className="w-full"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              {deleteEverythingMutation.isPending ? 'Deleting Everything...' : 'Delete Everything'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select Entity Type</CardTitle>
          <CardDescription>Choose the type of records you want to delete</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedEntity} onValueChange={(value) => {
            setSelectedEntity(value);
            setSelectedIds(new Set());
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select entity type" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedEntity && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 gap-2">
                <div className="flex items-center space-x-2 flex-1">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedIds.size > 0
                      ? `${selectedIds.size} of ${records?.length || 0} selected`
                      : `Select records to delete (${records?.length || 0} total)`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {records && records.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteAll}
                      disabled={deleteMutation.isPending || selectedIds.size === records.length}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All ({records.length})
                    </Button>
                  )}
                  {selectedIds.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteClick}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedIds.size})
                    </Button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading records...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Records</AlertTitle>
                    <AlertDescription>
                      {error instanceof Error ? error.message : 'Failed to load records. Please try again.'}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : records && records.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {records.map((record) => {
                    const isSelected = selectedIds.has(record.id);
                    const displayName = getRecordDisplayName(record);
                    const isDeleted = record.deletedAt !== null && record.deletedAt !== undefined;
                    const isInactive = record.isActive === false;
                    return (
                      <div
                        key={record.id}
                        className={`flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 border ${
                          isDeleted ? 'bg-destructive/5 border-destructive/20' : ''
                        } ${isInactive ? 'opacity-60' : ''}`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSelect(record.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate flex items-center gap-2">
                            {displayName}
                            {isDeleted && (
                              <span className="text-xs px-2 py-0.5 bg-destructive/20 text-destructive rounded">
                                Deleted
                              </span>
                            )}
                            {isInactive && !isDeleted && (
                              <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {record.status && `Status: ${record.status}`}
                            {record.status && record.id && ' • '}
                            {record.id && `ID: ${record.id.substring(0, 8)}...`}
                            {isDeleted && record.deletedAt && (
                              <span> • Deleted: {new Date(record.deletedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-2">
                    No records found for this entity type
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-destructive">
                ⚠️ PERMANENT DELETION WARNING ⚠️
              </p>
              <p className="font-semibold">
                You are about to <strong>PERMANENTLY DELETE</strong> {selectedIds.size} {entityOption?.label.toLowerCase() || 'record(s)'} from the system.
              </p>
              <p className="text-destructive">
                This will perform a <strong>HARD DELETE</strong> - records will be completely removed from the database, including soft-deleted records. This action <strong>CANNOT BE UNDONE</strong>.
              </p>
              <p>All associated data will be permanently removed. Make sure you have backups before proceeding.</p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mt-4">
                <p className="text-sm font-medium mb-2">To confirm, type "DELETE" below:</p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full px-3 py-2 border border-destructive/30 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setConfirmText('');
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={confirmText !== 'DELETE' || deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Everything Confirmation Dialog */}
      <AlertDialog open={showDeleteEverythingDialog} onOpenChange={setShowDeleteEverythingDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive text-xl">
              <AlertTriangle className="h-6 w-6" />
              ⚠️ DELETE EVERYTHING ⚠️
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4">
                <p className="font-bold text-destructive text-lg mb-2">
                  THIS WILL PERMANENTLY DELETE ALL DATA
                </p>
                <p className="mb-3">
                  You are about to permanently delete <strong>ALL DATA</strong> from your company including:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm mb-3">
                  <li>All Loads</li>
                  <li>All Drivers</li>
                  <li>All Trucks & Trailers</li>
                  <li>All Customers</li>
                  <li>All Invoices</li>
                  <li>All Settlements</li>
                  <li>All Documents</li>
                  <li>All Safety Records</li>
                  <li>All Maintenance Records</li>
                  <li>All Financial Data</li>
                  <li>And everything else...</li>
                </ul>
                <p className="font-semibold text-destructive">
                  The following will be PRESERVED:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Company records</li>
                  <li>MC Number records</li>
                  <li>Admin users</li>
                </ul>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-sm font-medium mb-2 text-destructive">
                  To confirm this EXTREME action, type <strong>"DELETE EVERYTHING"</strong> below:
                </p>
                <input
                  type="text"
                  value={deleteEverythingConfirmText}
                  onChange={(e) => setDeleteEverythingConfirmText(e.target.value)}
                  placeholder="Type DELETE EVERYTHING to confirm"
                  className="w-full px-3 py-2 border border-destructive/30 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This action is irreversible. Make absolutely sure you have backups before proceeding.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteEverythingDialog(false);
                setDeleteEverythingConfirmText('');
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEverything}
              disabled={deleteEverythingConfirmText !== 'DELETE EVERYTHING' || deleteEverythingMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEverythingMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting Everything...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Everything
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

