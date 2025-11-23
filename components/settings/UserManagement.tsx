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
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { formatDate, apiUrl } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ImportDialog from '@/components/import-export/ImportDialog';
import ExportDialog from '@/components/import-export/ExportDialog';
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
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER', 'HR', 'SAFETY']),
  isActive: z.boolean().optional(),
  mcNumberId: z.string().min(1, 'MC number is required'),
});

type UserFormData = z.infer<typeof userSchema>;

async function fetchUsers(roleFilter?: 'DISPATCHER' | 'EMPLOYEES' | 'ADMIN' | 'DRIVER' | 'ACCOUNTANT' | 'SAFETY' | 'HR' | 'FLEET' | null) {
  const url = roleFilter 
    ? `/api/settings/users?role=${roleFilter === 'EMPLOYEES' ? 'EMPLOYEES' : roleFilter}`
    : '/api/settings/users';
  const response = await fetch(apiUrl(url));
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

async function fetchMcNumbers() {
  const response = await fetch(apiUrl('/api/mc-numbers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch MC numbers');
  return response.json();
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
  roleFilter?: 'DISPATCHER' | 'EMPLOYEES' | 'ADMIN' | 'DRIVER' | 'ACCOUNTANT' | 'SAFETY' | 'HR' | 'FLEET' | null;
  title?: string;
  description?: string;
}

export default function UserManagement({ 
  roleFilter = null, 
  title = 'User Management',
  description = 'Manage users and their roles in your organization'
}: UserManagementProps = {}) {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', roleFilter],
    queryFn: () => fetchUsers(roleFilter),
  });

  const { data: mcNumbersData } = useQuery({
    queryKey: ['mc-numbers'],
    queryFn: fetchMcNumbers,
  });

  const mcNumbers = mcNumbersData?.data || [];

  // Create form
  const createForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: roleFilter === 'DISPATCHER' ? 'DISPATCHER' 
        : roleFilter === 'ACCOUNTANT' ? 'ACCOUNTANT'
        : roleFilter === 'DRIVER' ? 'DRIVER'
        : roleFilter === 'ADMIN' ? 'ADMIN'
        : roleFilter === 'SAFETY' ? 'ADMIN'
        : roleFilter === 'HR' ? 'ADMIN'
        : roleFilter === 'EMPLOYEES' ? 'ACCOUNTANT' 
        : 'DISPATCHER',
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
      queryClient.invalidateQueries({ queryKey: ['users', roleFilter] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
      queryClient.invalidateQueries({ queryKey: ['users', roleFilter] });
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
      queryClient.invalidateQueries({ queryKey: ['users', roleFilter] });
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
    createMutation.mutate(data);
  };

  const onEditSubmit = async (data: UserFormData) => {
    if (!editingUser) return;
    setError(null);
    updateMutation.mutate({ userId: editingUser.id, data });
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    editForm.reset({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive,
      password: '',
      mcNumberId: user.mcNumberId || null,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (userId: string) => {
    setDeletingUserId(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingUserId) return;
    deleteMutation.mutate(deletingUserId);
  };

  const users = data?.data || [];

  return (
    <Card>
      <CardHeader>
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
            <ImportDialog entityType={
              roleFilter === 'DISPATCHER' ? 'dispatchers' 
              : roleFilter === 'ACCOUNTANT' ? 'employees'
              : roleFilter === 'ADMIN' ? 'employees'
              : roleFilter === 'FLEET' ? 'employees'
              : roleFilter === 'DRIVER' ? 'drivers'
              : roleFilter === 'SAFETY' ? 'employees'
              : roleFilter === 'HR' ? 'employees'
              : roleFilter === 'EMPLOYEES' ? 'employees' 
              : 'users'
            } />
            <ExportDialog entityType={
              roleFilter === 'DISPATCHER' ? 'dispatchers'
              : roleFilter === 'ACCOUNTANT' ? 'employees'
              : roleFilter === 'ADMIN' ? 'employees'
              : roleFilter === 'FLEET' ? 'employees'
              : roleFilter === 'DRIVER' ? 'drivers'
              : roleFilter === 'SAFETY' ? 'employees'
              : roleFilter === 'HR' ? 'employees'
              : roleFilter === 'EMPLOYEES' ? 'employees'
              : 'users'
            } />
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

                  {(selectedRole === 'DISPATCHER' || selectedRole === 'ACCOUNTANT' || selectedRole === 'ADMIN' || selectedRole === 'DRIVER' || selectedRole === 'HR' || selectedRole === 'SAFETY') && (
                    <McNumberSelector
                      value={createForm.watch('mcNumberId')}
                      onValueChange={(mcNumberId) => createForm.setValue('mcNumberId', mcNumberId, { shouldValidate: true })}
                      required
                      error={createForm.formState.errors.mcNumberId?.message}
                    />
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
        {isLoading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>MC Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={roleColors[user.role] || ''}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.mcNumber ? (
                        <Badge variant="outline">
                          {user.mcNumber.companyName} (MC {user.mcNumber.number})
                        </Badge>
                      ) : user.driver?.mcNumber ? (
                        <Badge variant="outline">
                          MC {typeof user.driver.mcNumber === 'object' ? user.driver.mcNumber.number : user.driver.mcNumber}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isActive ? 'default' : 'secondary'}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin
                        ? formatDate(user.lastLogin)
                        : 'Never'}
                    </TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                disabled
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Enter new password or leave blank"
                {...editForm.register('password')}
              />
              {editForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.password.message}
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

            {(editSelectedRole === 'DISPATCHER' || editSelectedRole === 'ACCOUNTANT' || editSelectedRole === 'ADMIN' || editSelectedRole === 'DRIVER' || editSelectedRole === 'HR' || editSelectedRole === 'SAFETY') && (
              <McNumberSelector
                value={editForm.watch('mcNumberId')}
                onValueChange={(mcNumberId) => editForm.setValue('mcNumberId', mcNumberId, { shouldValidate: true })}
                required
                error={editForm.formState.errors.mcNumberId?.message}
              />
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
    </Card>
  );
}
