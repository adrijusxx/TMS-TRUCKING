'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Settings2, Upload } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import AdvancedFilters, { FilterOption } from '@/components/filters/AdvancedFilters';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';
import type { SortField, SortDirection, ColumnVisibility, CustomRole } from './user-management/types';
import { fetchUsers, fetchMcNumbers, deleteUser } from './user-management/api';
import UserList from './user-management/UserList';
import UserEditor, { UserEditDialog } from './user-management/UserEditor';
import UserBulkActions from './user-management/UserBulkActions';

interface UserManagementProps {
  title?: string;
  description?: string;
}

export default function UserManagement({
  title = 'Team Management',
  description = 'Manage all employees in one comprehensive table'
}: UserManagementProps = {}) {
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>({
    checkbox: true,
    name: true,
    email: true,
    password: true,
    phone: true,
    role: true,
    mcAccess: true,
    status: true,
    lastLogin: true,
    actions: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', searchQuery, advancedFilters, page, sortField, sortDirection],
    queryFn: () => fetchUsers({
      search: searchQuery || undefined,
      page,
      limit: 1000,
      ...advancedFilters,
      sortBy: sortField || undefined,
      sortOrder: sortDirection || undefined,
      excludeDrivers: true,
    }),
  });

  const { data: mcNumbersData } = useQuery({
    queryKey: ['mc-numbers'],
    queryFn: fetchMcNumbers,
  });

  const mcNumbers = mcNumbersData?.data || [];

  const { data: customRolesData } = useQuery<{ success: boolean; data: CustomRole[] }>({
    queryKey: ['custom-roles'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/settings/roles'));
      if (!res.ok) return { success: false, data: [] };
      return res.json();
    },
  });
  const customRoles = customRolesData?.data || [];

  const filterOptions: FilterOption[] = [
    {
      field: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { value: 'all', label: 'All Roles' },
        { value: 'ADMIN', label: 'Admin' },
        { value: 'DISPATCHER', label: 'Dispatcher' },
        { value: 'ACCOUNTANT', label: 'Accountant' },
        { value: 'DRIVER', label: 'Driver' },
        { value: 'HR', label: 'HR' },
        { value: 'SAFETY', label: 'Safety' },
        { value: 'CUSTOMER', label: 'Customer' },
      ],
    },
    {
      field: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
  ];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const handleDeleteClick = (userId: string) => {
    setDeletingUserId(userId);
    setIsDeleteDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDeleteDialogOpen(false);
      setDeletingUserId(null);
      toast.success('User deleted successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  let users = data?.data || [];

  // Client-side sorting fallback
  if (sortField && sortDirection && users.length > 0) {
    users = [...users].sort((a: any, b: any) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const columnNames: { key: keyof ColumnVisibility; label: string }[] = [
    { key: 'checkbox', label: 'Checkbox' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'password', label: 'Password' },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role' },
    { key: 'mcAccess', label: 'MC Access' },
    { key: 'status', label: 'Status' },
    { key: 'lastLogin', label: 'Last Login' },
    { key: 'actions', label: 'Actions' },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <ImportSheet
              entityType="users"
              onImportComplete={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
            >
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportSheet>
            <ExportDialog entityType="users" />
            <UserEditor mcNumbers={mcNumbers} customRoles={customRoles} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">
          Drivers are managed in the <a href="/dashboard/drivers" className="text-primary hover:underline">Drivers Dashboard</a>
        </p>

        {/* Search and Filters */}
        <div className="space-y-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <AdvancedFilters
                filters={filterOptions}
                onApply={setAdvancedFilters}
                onClear={() => setAdvancedFilters({})}
                initialValues={advancedFilters}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {columnNames.map(({ key, label }) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={visibleColumns[key]}
                      onCheckedChange={(checked) =>
                        setVisibleColumns({ ...visibleColumns, [key]: checked })
                      }
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Results count */}
        {!isLoading && (
          <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
            <span>
              Showing {users.length} user{users.length !== 1 ? 's' : ''}
              {selectedIds.length > 0 && (
                <span className="ml-2 font-medium text-foreground">
                  ({selectedIds.length} selected)
                </span>
              )}
            </span>
          </div>
        )}

        <UserList
          users={users}
          mcNumbers={mcNumbers}
          isLoading={isLoading}
          selectedIds={selectedIds}
          visibleColumns={visibleColumns}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onToggleSelectAll={(checked) =>
            setSelectedIds(checked ? users.map((u: any) => u.id) : [])
          }
          onToggleSelectUser={(userId, checked) =>
            setSelectedIds(checked
              ? [...selectedIds, userId]
              : selectedIds.filter(id => id !== userId)
            )
          }
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />

        <UserBulkActions
          selectedIds={selectedIds}
          mcNumbers={mcNumbers}
          onClearSelection={() => setSelectedIds([])}
        />
      </CardContent>

      {/* Edit Dialog */}
      <UserEditDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingUser={editingUser}
        mcNumbers={mcNumbers}
        customRoles={customRoles}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingUser(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will deactivate and delete the user. This action cannot be undone.
              The user will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUserId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUserId && deleteMutation.mutate(deletingUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
