'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import { Edit, Trash2, Search, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import McNumberForm from './McNumberForm';

interface McNumber {
  id: string;
  companyName: string;
  type: 'CARRIER' | 'BROKER';
  companyPhone: string | null;
  owner: string | null;
  isDefault: boolean;
  usdot: string | null;
  notes: string | null;
  number: string;
  createdAt: Date;
  updatedAt: Date;
}

interface McNumberListProps {
  searchQuery?: string;
  page?: number;
  limit?: number;
}

async function fetchMcNumbers(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);

  const response = await fetch(apiUrl(`/api/mc-numbers?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch MC numbers');
  return response.json();
}

async function deleteMcNumber(id: string) {
  const response = await fetch(apiUrl(`/api/mc-numbers/${id}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete MC number');
  }
  return response.json();
}

export default function McNumberList({
  searchQuery = '',
  page = 1,
  limit = 20,
}: McNumberListProps) {
  const queryClient = useQueryClient();
  const { isAdmin } = usePermissions();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingMcNumber, setEditingMcNumber] = useState<McNumber | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mcNumberToDelete, setMcNumberToDelete] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['mc-numbers', page, searchQuery, limit],
    queryFn: () => fetchMcNumbers({ page, limit, search: searchQuery }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMcNumber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mc-numbers'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] }); // Refresh MC switcher
      toast.success('MC number deleted successfully');
      setSelectedIds([]);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const mcNumbers: McNumber[] = data?.data || [];
  const pagination = data?.pagination;

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleEdit = (mcNumber: McNumber) => {
    if (!isAdmin) {
      toast.error('Only administrators can edit MC numbers');
      return;
    }
    setEditingMcNumber(mcNumber);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      toast.error('Only administrators can delete MC numbers');
      return;
    }
    setMcNumberToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (mcNumberToDelete) {
      deleteMutation.mutate(mcNumberToDelete);
      setDeleteDialogOpen(false);
      setMcNumberToDelete(null);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? mcNumbers.map((m) => m.id) : []);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading MC numbers...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading MC numbers
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    mcNumbers.length > 0 &&
                    selectedIds.length === mcNumbers.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleSort('id')}
                >
                  ID
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleSort('companyName')}
                >
                  Company name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleSort('type')}
                >
                  Type
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Company phone</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleSort('isDefault')}
                >
                  Default
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Usdot</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleSort('number')}
                >
                  Number
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mcNumbers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  No MC numbers found
                </TableCell>
              </TableRow>
            ) : (
              mcNumbers.map((mcNumber) => (
                <TableRow key={mcNumber.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(mcNumber.id)}
                      onCheckedChange={(checked) =>
                        handleSelect(mcNumber.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>{mcNumber.id.slice(-4)}</TableCell>
                  <TableCell className="font-medium">
                    {mcNumber.companyName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {mcNumber.type.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{mcNumber.companyPhone || '-'}</TableCell>
                  <TableCell>{mcNumber.owner || '-'}</TableCell>
                  <TableCell>
                    {mcNumber.isDefault ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>{mcNumber.usdot || '-'}</TableCell>
                  <TableCell>{mcNumber.notes || '-'}</TableCell>
                  <TableCell className="font-medium">
                    {mcNumber.number}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(mcNumber)}
                            title="Edit MC Number"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(mcNumber.id)}
                            title="Delete MC Number"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      {!isAdmin && (
                        <span className="text-xs text-muted-foreground">Admin only</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to{' '}
            {Math.min(page * limit, pagination.total)} of {pagination.total}{' '}
            entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => {
                // Handle page change - this would be passed as a prop
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => {
                // Handle page change - this would be passed as a prop
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Form Dialog */}
      <McNumberForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingMcNumber(null);
          }
        }}
        mcNumber={editingMcNumber}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete MC Number</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this MC number? This action cannot be undone.
              The MC number will be soft-deleted and hidden from the list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMcNumberToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
