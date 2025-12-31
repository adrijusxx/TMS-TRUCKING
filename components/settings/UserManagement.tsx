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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Plus, Edit, Trash2, Search, Settings2, Upload, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDate, apiUrl } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ImportSheet from '@/components/import-export/ImportSheet';
import ExportDialog from '@/components/import-export/ExportDialog';
import AdvancedFilters, { FilterOption } from '@/components/filters/AdvancedFilters';
import BulkActionBar from '@/components/import-export/BulkActionBar';
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

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.union([
    z.string().min(8, 'Password must be at least 8 characters'),
    z.literal(''),
  ]).optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER', 'HR', 'SAFETY', 'FLEET']),
  isActive: z.boolean().optional(),
  mcNumberId: z.string().optional(), // Will be auto-set from mcAccess if not provided
  mcAccess: z.array(z.string()).optional(), // Array of MC IDs user can access (empty = all for ADMIN)
}).refine((data) => {
  // For non-ADMIN roles, mcAccess must have at least one MC
  if (data.role !== 'ADMIN' && data.mcAccess !== undefined && (!data.mcAccess || data.mcAccess.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'At least one MC number must be selected',
  path: ['mcAccess'],
});

type UserFormData = z.infer<typeof userSchema>;

async function fetchUsers(params?: {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  excludeDrivers?: boolean;
  role?: string;
  [key: string]: any;
}) {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set('search', params.search);
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
  if (params?.excludeDrivers) queryParams.set('excludeDrivers', 'true');
  if (params?.role) queryParams.set('role', params.role);

  // Add advanced filters
  Object.keys(params || {}).forEach((key) => {
    if (!['search', 'page', 'limit', 'sortBy', 'sortOrder', 'excludeDrivers', 'role'].includes(key) && params?.[key]) {
      queryParams.set(key, params[key].toString());
    }
  });

  const url = queryParams.toString()
    ? `/api/settings/users?${queryParams}`
    : '/api/settings/users';
  const response = await fetch(apiUrl(url));
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

async function fetchMcNumbers() {
  const response = await fetch(apiUrl('/api/mc-numbers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch MC numbers');
  const data = await response.json();
  // Ensure we return the data in the expected format
  if (data.success && data.data) {
    return data;
  }
  // Fallback if response format is different
  return { success: true, data: Array.isArray(data) ? data : data.data || [] };
}

async function createUser(data: UserFormData) {
  // Remove password if empty, and remove isActive from create
  const { isActive, password, ...createData } = data;
  const payload = password && password.length > 0 ? { ...createData, password } : createData;

  const response = await fetch(apiUrl('/api/settings/users'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create user');
  }
  return response.json();
}

async function updateUser(userId: string, data: Partial<UserFormData>) {
  // Remove password if empty
  const payload = { ...data };
  if (!payload.password || payload.password.length === 0) {
    delete payload.password;
  }

  const response = await fetch(apiUrl(`/api/settings/users/${userId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update user');
  }
  return response.json();
}

async function deleteUser(userId: string) {
  const response = await fetch(apiUrl(`/api/settings/users/${userId}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete user');
  }
  return response.json();
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  DISPATCHER: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  ACCOUNTANT: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  HR: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
  SAFETY: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  FLEET: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  DRIVER: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  CUSTOMER: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
};

interface UserManagementProps {
  title?: string;
  description?: string;
}

type SortField = 'firstName' | 'lastName' | 'email' | 'role' | 'isActive' | 'lastLogin' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function UserManagement({
  title = 'Team Management',
  description = 'Manage all employees in one comprehensive table'
}: UserManagementProps = {}) {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [bulkEditMcAccess, setBulkEditMcAccess] = useState<string[]>([]);
  const [bulkEditRole, setBulkEditRole] = useState<string>('none');
  const [bulkEditStatus, setBulkEditStatus] = useState<string>('none');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  // Drivers are now managed in HR - always exclude them from team management

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    checkbox: true,
    name: true,
    email: true,
    password: true, // Show password column for admins
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
      limit: 1000, // Show all users for Excel-like experience
      ...advancedFilters,
      sortBy: sortField || undefined,
      sortOrder: sortDirection || undefined,
      excludeDrivers: true, // Drivers are managed in HR, not Settings
    }),
  });

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction: asc -> desc -> null
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

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />;
    }
    return <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const { data: mcNumbersData } = useQuery({
    queryKey: ['mc-numbers'],
    queryFn: fetchMcNumbers,
  });

  const mcNumbers = mcNumbersData?.data || [];

  // Filter options for AdvancedFilters
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

  // Row selection handlers
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(users.map((user: any) => user.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, userId]);
    } else {
      setSelectedIds(selectedIds.filter(id => id !== userId));
    }
  };

  // Bulk edit handler
  const handleBulkEdit = async (updates: Partial<UserFormData>) => {
    if (selectedIds.length === 0) return;

    try {
      // Process updates with individual error handling
      const results = await Promise.allSettled(
        selectedIds.map(id => updateUser(id, updates))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      // Get failed user IDs for better error reporting
      const failedIds: string[] = [];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          failedIds.push(selectedIds[index]);
        }
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });

      if (failed === 0) {
        toast.success(`Updated ${successful} user(s) successfully`);
        setSelectedIds([]);
        setIsBulkEditDialogOpen(false);
      } else if (successful > 0) {
        toast.warning(
          `Updated ${successful} user(s), but ${failed} failed. Some users may not exist or belong to a different company.`,
          { duration: 5000 }
        );
        // Remove successfully updated IDs from selection
        const successfulIds = selectedIds.filter((_, index) =>
          results[index].status === 'fulfilled'
        );
        setSelectedIds(failedIds);
        setIsBulkEditDialogOpen(false);
      } else {
        toast.error(
          `Failed to update users. They may not exist or belong to a different company.`,
          { duration: 5000 }
        );
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update users');
    }
  };

  // Create form
  const createForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'DISPATCHER',
      isActive: true,
    },
  });

  // Edit form
  const editForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const selectedRole = createForm.watch('role');
  const editSelectedRole = editForm.watch('role');

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['mc-numbers'] }); // Refresh MC numbers list
      setIsCreateDialogOpen(false);
      createForm.reset();
      setError(null);
      toast.success('User created successfully');
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<UserFormData> }) =>
      updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      editForm.reset();
      setError(null);
      toast.success('User updated successfully');
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

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

  const onCreateSubmit = async (data: UserFormData) => {
    setError(null);

    // Auto-set mcNumberId from first MC in mcAccess if not set
    const submitData = { ...data };
    if (submitData.mcAccess && submitData.mcAccess.length > 0 && !submitData.mcNumberId) {
      submitData.mcNumberId = submitData.mcAccess[0];
    }

    createMutation.mutate(submitData);
  };

  const onEditSubmit = async (data: UserFormData) => {
    if (!editingUser) return;
    setError(null);

    // Auto-set mcNumberId from first MC in mcAccess if not set
    const submitData: Partial<UserFormData> = { ...data };
    if (submitData.mcAccess && submitData.mcAccess.length > 0 && !submitData.mcNumberId) {
      submitData.mcNumberId = submitData.mcAccess[0];
    }

    // Remove password from submit data if it's empty (to keep current password)
    if (submitData.password === '' || !submitData.password) {
      delete submitData.password;
    }

    updateMutation.mutate({ userId: editingUser.id, data: submitData });
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    // Initialize mcAccess from user's mcAccess or default to their mcNumberId
    const initialMcAccess = user.mcAccess && user.mcAccess.length > 0
      ? user.mcAccess
      : (user.mcNumberId ? [user.mcNumberId] : []);

    editForm.reset({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive,
      password: '',
      mcNumberId: user.mcNumberId || (initialMcAccess.length > 0 ? initialMcAccess[0] : null),
      mcAccess: initialMcAccess,
    });
    setIsEditDialogOpen(true);
    // Refresh user data to get latest tempPassword
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const handleDeleteClick = (userId: string) => {
    setDeletingUserId(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingUserId) return;
    deleteMutation.mutate(deletingUserId);
  };

  let users = data?.data || [];

  // Client-side sorting as fallback if API doesn't support it
  if (sortField && sortDirection && users.length > 0) {
    users = [...users].sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle nested fields
      if (sortField === 'firstName') {
        aVal = a.firstName || '';
        bVal = b.firstName || '';
      } else if (sortField === 'lastName') {
        aVal = a.lastName || '';
        bVal = b.lastName || '';
      }

      // Handle null/undefined
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      // Compare
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>
              {description}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <ImportSheet
              entityType="users"
              onImportComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['users'] });
              }}
            >
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </ImportSheet>
            <ExportDialog entityType="users" />
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to your organization
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" {...createForm.register('firstName')} />
                      {createForm.formState.errors.firstName && (
                        <p className="text-sm text-destructive">
                          {createForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" {...createForm.register('lastName')} />
                      {createForm.formState.errors.lastName && (
                        <p className="text-sm text-destructive">
                          {createForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" {...createForm.register('email')} />
                    {createForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {createForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      {...createForm.register('password')}
                    />
                    {createForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {createForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" {...createForm.register('phone')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={selectedRole}
                      onValueChange={(value) => createForm.setValue('role', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="DISPATCHER">Dispatcher</SelectItem>
                        <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="SAFETY">Safety</SelectItem>
                        <SelectItem value="FLEET">Fleet/Breakdown</SelectItem>
                        <SelectItem value="DRIVER">Driver</SelectItem>
                        <SelectItem value="CUSTOMER">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                    {createForm.formState.errors.role && (
                      <p className="text-sm text-destructive">
                        {createForm.formState.errors.role.message}
                      </p>
                    )}
                  </div>

                  {(selectedRole === 'DISPATCHER' || selectedRole === 'ACCOUNTANT' || selectedRole === 'ADMIN' || selectedRole === 'DRIVER' || selectedRole === 'HR' || selectedRole === 'SAFETY' || selectedRole === 'FLEET') && (
                    <div className="space-y-2">
                      <Label>MC Access *</Label>
                      <p className="text-xs text-muted-foreground">
                        {selectedRole === 'ADMIN'
                          ? 'Leave empty for access to all MCs, or select specific MCs'
                          : 'Select which MC numbers this user can access'}
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                        {mcNumbers.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No MC numbers available</p>
                        ) : (
                          mcNumbers.map((mc: any) => {
                            const currentAccess = createForm.watch('mcAccess') || [];
                            const isSelected = currentAccess.includes(mc.id);
                            return (
                              <div key={mc.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`create-mc-access-${mc.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      const newAccess = [...currentAccess, mc.id];
                                      createForm.setValue('mcAccess', newAccess, { shouldValidate: true });
                                      // Auto-set mcNumberId to first selected MC if not set
                                      if (!createForm.watch('mcNumberId')) {
                                        createForm.setValue('mcNumberId', mc.id, { shouldValidate: true });
                                      }
                                    } else {
                                      const newAccess = currentAccess.filter((id: string) => id !== mc.id);
                                      createForm.setValue('mcAccess', newAccess, { shouldValidate: true });
                                      // If we removed the current mcNumberId, set it to the first remaining MC
                                      if (createForm.watch('mcNumberId') === mc.id && newAccess.length > 0) {
                                        createForm.setValue('mcNumberId', newAccess[0], { shouldValidate: true });
                                      }
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={`create-mc-access-${mc.id}`}
                                  className="font-normal cursor-pointer flex-1"
                                >
                                  {mc.companyName} (MC {mc.number})
                                </Label>
                              </div>
                            );
                          })
                        )}
                      </div>
                      {selectedRole === 'ADMIN' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentAccess = createForm.watch('mcAccess') || [];
                            if (currentAccess.length === 0) {
                              const allMcIds = mcNumbers.map((mc: any) => mc.id);
                              createForm.setValue('mcAccess', allMcIds, { shouldValidate: true });
                              // Set mcNumberId to first MC
                              if (allMcIds.length > 0) {
                                createForm.setValue('mcNumberId', allMcIds[0], { shouldValidate: true });
                              }
                            } else {
                              createForm.setValue('mcAccess', [], { shouldValidate: true });
                              // Keep mcNumberId as first MC if available
                              if (mcNumbers.length > 0) {
                                createForm.setValue('mcNumberId', mcNumbers[0].id, { shouldValidate: true });
                              }
                            }
                          }}
                        >
                          {createForm.watch('mcAccess')?.length === 0 ? 'Select All MCs' : 'Clear (All Access)'}
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createForm.formState.isSubmitting || createMutation.isPending}
                    >
                      {createForm.formState.isSubmitting || createMutation.isPending
                        ? 'Creating...'
                        : 'Create User'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Note about drivers */}
        <p className="text-xs text-muted-foreground mb-4">
          💡 Drivers are managed in the <a href="/dashboard/drivers" className="text-primary hover:underline">Drivers Dashboard</a>
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
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.checkbox}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, checkbox: checked })
                    }
                  >
                    Checkbox
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.name}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, name: checked })
                    }
                  >
                    Name
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.email}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, email: checked })
                    }
                  >
                    Email
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.password}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, password: checked })
                    }
                  >
                    Password
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.phone}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, phone: checked })
                    }
                  >
                    Phone
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.role}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, role: checked })
                    }
                  >
                    Role
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.mcAccess}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, mcAccess: checked })
                    }
                  >
                    MC Access
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.status}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, status: checked })
                    }
                  >
                    Status
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.lastLogin}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, lastLogin: checked })
                    }
                  >
                    Last Login
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.actions}
                    onCheckedChange={(checked) =>
                      setVisibleColumns({ ...visibleColumns, actions: checked })
                    }
                  >
                    Actions
                  </DropdownMenuCheckboxItem>
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

        {isLoading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        ) : (
          <div className="border rounded-lg overflow-auto max-h-[calc(100vh-300px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  {visibleColumns.checkbox && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === users.length && users.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.name && (
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => handleSort('firstName')}
                      >
                        Name
                        {getSortIcon('firstName')}
                      </Button>
                    </TableHead>
                  )}
                  {visibleColumns.email && (
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => handleSort('email')}
                      >
                        Email
                        {getSortIcon('email')}
                      </Button>
                    </TableHead>
                  )}
                  {visibleColumns.password && (
                    <TableHead>Password</TableHead>
                  )}
                  {visibleColumns.phone && (
                    <TableHead>Phone</TableHead>
                  )}
                  {visibleColumns.role && (
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => handleSort('role')}
                      >
                        Role
                        {getSortIcon('role')}
                      </Button>
                    </TableHead>
                  )}
                  {visibleColumns.mcAccess && <TableHead>MC Access</TableHead>}
                  {visibleColumns.status && (
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => handleSort('isActive')}
                      >
                        Status
                        {getSortIcon('isActive')}
                      </Button>
                    </TableHead>
                  )}
                  {visibleColumns.lastLogin && (
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => handleSort('lastLogin')}
                      >
                        Last Login
                        {getSortIcon('lastLogin')}
                      </Button>
                    </TableHead>
                  )}
                  {visibleColumns.actions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => {
                  // Combine mcAccess with primary mcNumberId to show all accessible MCs
                  const allMcIds = new Set<string>();

                  // Add primary MC if it exists
                  if (user.mcNumberId) {
                    allMcIds.add(user.mcNumberId);
                  }

                  // Add all MCs from mcAccess array
                  if (user.mcAccess && Array.isArray(user.mcAccess)) {
                    user.mcAccess.forEach((mcId: string) => allMcIds.add(mcId));
                  }

                  // Fallback: if no mcAccess but has mcNumber relation
                  if (allMcIds.size === 0 && user.mcNumber?.id) {
                    allMcIds.add(user.mcNumber.id);
                  }

                  const accessibleMcIds = Array.from(allMcIds);

                  return (
                    <TableRow key={user.id}>
                      {visibleColumns.checkbox && (
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(user.id)}
                            onCheckedChange={(checked) => toggleSelectUser(user.id, checked as boolean)}
                          />
                        </TableCell>
                      )}
                      {visibleColumns.name && (
                        <TableCell>
                          {user.firstName} {user.lastName}
                        </TableCell>
                      )}
                      {visibleColumns.email && (
                        <TableCell>{user.email}</TableCell>
                      )}
                      {visibleColumns.password && (
                        <TableCell>
                          {user.tempPassword ? (
                            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                              {user.tempPassword}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">••••••••</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.phone && (
                        <TableCell>{user.phone || '-'}</TableCell>
                      )}
                      {visibleColumns.role && (
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={roleColors[user.role] || ''}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.mcAccess && (
                        <TableCell>
                          {accessibleMcIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {accessibleMcIds.slice(0, 3).map((mcId: string) => {
                                const mc = mcNumbers.find((m: any) => m.id === mcId);
                                return mc ? (
                                  <Badge key={mcId} variant="secondary" className="text-xs">
                                    {mc.companyName} (MC {mc.number})
                                  </Badge>
                                ) : null;
                              })}
                              {accessibleMcIds.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{accessibleMcIds.length - 3} more
                                </Badge>
                              )}
                            </div>
                          ) : user.role === 'ADMIN' ? (
                            <Badge variant="outline" className="text-xs">
                              All MCs
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell>
                          <Badge
                            variant={user.isActive ? 'default' : 'secondary'}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.lastLogin && (
                        <TableCell>
                          {user.lastLogin
                            ? formatDate(user.lastLogin)
                            : 'Never'}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(user.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="sticky bottom-4 left-0 right-0 z-40 bg-white dark:bg-background border rounded-lg shadow-lg p-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox checked={true} onCheckedChange={() => setSelectedIds([])} />
                  <span className="text-sm font-medium">
                    {selectedIds.length} user{selectedIds.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                >
                  Clear
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setBulkEditMcAccess([]);
                    setBulkEditRole('none');
                    setBulkEditStatus('none');
                    setIsBulkEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Edit
                </Button>
                <BulkActionBar
                  selectedIds={selectedIds}
                  onClearSelection={() => setSelectedIds([])}
                  entityType="user"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input id="edit-firstName" {...editForm.register('firstName')} />
                {editForm.formState.errors.firstName && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name *</Label>
                <Input id="edit-lastName" {...editForm.register('lastName')} />
                {editForm.formState.errors.lastName && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                {...editForm.register('email')}
              />
              {editForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.email.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Changing email will require the user to sign in with the new email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">Password</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Enter new password to reset (leave blank to keep current)"
                {...editForm.register('password')}
              />
              {editForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.password.message}
                </p>
              )}
              {editingUser?.tempPassword && (
                <div className="p-3 bg-muted rounded-md border">
                  <p className="text-xs font-medium mb-1">Current Password (Admin View):</p>
                  <p className="text-sm font-mono bg-background p-2 rounded border">{editingUser.tempPassword}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This password will be cleared after the user logs in successfully.
                  </p>
                </div>
              )}
              {!editingUser?.tempPassword && (
                <p className="text-xs text-muted-foreground">
                  Enter a new password to reset it (minimum 8 characters). Password will be visible here after setting.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" type="tel" {...editForm.register('phone')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role *</Label>
              <Select
                value={editSelectedRole}
                onValueChange={(value) => editForm.setValue('role', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="DISPATCHER">Dispatcher</SelectItem>
                  <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="SAFETY">Safety</SelectItem>
                  <SelectItem value="FLEET">Fleet/Breakdown</SelectItem>
                  <SelectItem value="DRIVER">Driver</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>
              {editForm.formState.errors.role && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.role.message}
                </p>
              )}
            </div>

            {/* MC Access Management */}
            {(editSelectedRole === 'DISPATCHER' || editSelectedRole === 'ACCOUNTANT' || editSelectedRole === 'ADMIN' || editSelectedRole === 'DRIVER' || editSelectedRole === 'HR' || editSelectedRole === 'SAFETY' || editSelectedRole === 'FLEET') && (
              <div className="space-y-2">
                <Label>MC Access *</Label>
                <p className="text-xs text-muted-foreground">
                  {editSelectedRole === 'ADMIN'
                    ? 'Leave empty for access to all MCs, or select specific MCs'
                    : 'Select which MC numbers this user can access'}
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {mcNumbers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No MC numbers available</p>
                  ) : (
                    mcNumbers.map((mc: any) => {
                      const isSelected = editForm.watch('mcAccess')?.includes(mc.id) || false;
                      return (
                        <div key={mc.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`mc-access-${mc.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const currentAccess = editForm.watch('mcAccess') || [];
                              if (checked) {
                                const newAccess = [...currentAccess, mc.id];
                                editForm.setValue('mcAccess', newAccess, { shouldValidate: true });
                                // Auto-set mcNumberId to first selected MC if not set
                                if (!editForm.watch('mcNumberId')) {
                                  editForm.setValue('mcNumberId', mc.id, { shouldValidate: true });
                                }
                              } else {
                                const newAccess = currentAccess.filter((id: string) => id !== mc.id);
                                editForm.setValue('mcAccess', newAccess, { shouldValidate: true });
                                // If we removed the current mcNumberId, set it to the first remaining MC
                                if (editForm.watch('mcNumberId') === mc.id && newAccess.length > 0) {
                                  editForm.setValue('mcNumberId', newAccess[0], { shouldValidate: true });
                                }
                              }
                            }}
                          />
                          <Label
                            htmlFor={`mc-access-${mc.id}`}
                            className="font-normal cursor-pointer flex-1"
                          >
                            {mc.companyName} (MC {mc.number})
                          </Label>
                        </div>
                      );
                    })
                  )}
                </div>
                {editSelectedRole === 'ADMIN' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Toggle all access: empty array = all access for admins
                      const currentAccess = editForm.watch('mcAccess') || [];
                      if (currentAccess.length === 0) {
                        // Select all MCs
                        const allMcIds = mcNumbers.map((mc: any) => mc.id);
                        editForm.setValue('mcAccess', allMcIds, { shouldValidate: true });
                        // Set mcNumberId to first MC
                        if (allMcIds.length > 0) {
                          editForm.setValue('mcNumberId', allMcIds[0], { shouldValidate: true });
                        }
                      } else {
                        // Clear selection (all access)
                        editForm.setValue('mcAccess', [], { shouldValidate: true });
                        // Keep mcNumberId as first MC if available
                        if (mcNumbers.length > 0) {
                          editForm.setValue('mcNumberId', mcNumbers[0].id, { shouldValidate: true });
                        }
                      }
                    }}
                  >
                    {editForm.watch('mcAccess')?.length === 0 ? 'Select All MCs' : 'Clear (All Access)'}
                  </Button>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isActive"
                checked={editForm.watch('isActive')}
                onCheckedChange={(checked) => editForm.setValue('isActive', checked as boolean)}
              />
              <Label htmlFor="edit-isActive" className="font-normal cursor-pointer">
                Active
              </Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingUser(null);
                  editForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editForm.formState.isSubmitting || updateMutation.isPending}
              >
                {editForm.formState.isSubmitting || updateMutation.isPending
                  ? 'Saving...'
                  : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
            <AlertDialogCancel onClick={() => setDeletingUserId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={isBulkEditDialogOpen} onOpenChange={setIsBulkEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit Users</DialogTitle>
            <DialogDescription>
              Update {selectedIds.length} selected user(s)
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const updates: Partial<UserFormData> = {};

              // Add role if selected
              if (bulkEditRole && bulkEditRole !== 'none') {
                updates.role = bulkEditRole as any;
              }

              // Add status if selected
              if (bulkEditStatus && bulkEditStatus !== 'none') {
                updates.isActive = bulkEditStatus === 'true';
              }

              // Add MC Access if selected
              if (bulkEditMcAccess.length > 0) {
                updates.mcAccess = bulkEditMcAccess;
                // Auto-set mcNumberId to first MC
                updates.mcNumberId = bulkEditMcAccess[0];
              }

              // Check if there are any updates
              if (Object.keys(updates).length === 0) {
                toast.error('Please select at least one field to update');
                return;
              }

              handleBulkEdit(updates);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="bulk-role">Role (optional)</Label>
              <Select value={bulkEditRole} onValueChange={setBulkEditRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Keep current role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keep current role</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="DISPATCHER">Dispatcher</SelectItem>
                  <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="SAFETY">Safety</SelectItem>
                  <SelectItem value="FLEET">Fleet/Breakdown</SelectItem>
                  <SelectItem value="DRIVER">Driver</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-status">Status (optional)</Label>
              <Select value={bulkEditStatus} onValueChange={setBulkEditStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Keep current status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keep current status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>MC Access (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Select MC numbers to assign to all selected users. Leave empty to keep current MC access.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {mcNumbers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No MC numbers available</p>
                ) : (
                  mcNumbers.map((mc: any) => {
                    const isSelected = bulkEditMcAccess.includes(mc.id);
                    return (
                      <div key={mc.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`bulk-mc-access-${mc.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBulkEditMcAccess([...bulkEditMcAccess, mc.id]);
                            } else {
                              setBulkEditMcAccess(bulkEditMcAccess.filter((id: string) => id !== mc.id));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`bulk-mc-access-${mc.id}`}
                          className="font-normal cursor-pointer flex-1"
                        >
                          {mc.companyName} (MC {mc.number})
                        </Label>
                      </div>
                    );
                  })
                )}
              </div>
              {bulkEditMcAccess.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkEditMcAccess([])}
                >
                  Clear MC Selection
                </Button>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsBulkEditDialogOpen(false);
                  setBulkEditMcAccess([]);
                  setBulkEditRole('none');
                  setBulkEditStatus('none');
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Update {selectedIds.length} User(s)
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
