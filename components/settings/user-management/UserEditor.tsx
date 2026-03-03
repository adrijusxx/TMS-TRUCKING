'use client';

import { Button } from '@/components/ui/button';
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
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { userSchema, type UserFormData, type CustomRole } from './types';
import { createUser, updateUser } from './api';
import McAccessSelector from './McAccessSelector';

interface UserEditorProps {
  mcNumbers: any[];
  customRoles: CustomRole[];
}

export default function UserEditor({ mcNumbers, customRoles }: UserEditorProps) {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'DISPATCHER',
      roleId: null,
      isActive: true,
    },
  });

  const selectedRole = createForm.watch('role');

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['mc-numbers'] });
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

  const onCreateSubmit = async (data: UserFormData) => {
    setError(null);
    const submitData = { ...data };
    if (submitData.mcAccess && submitData.mcAccess.length > 0 && !submitData.mcNumberId) {
      submitData.mcNumberId = submitData.mcAccess[0];
    }
    createMutation.mutate(submitData);
  };

  return (
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
          <DialogDescription>Add a new user to your organization</DialogDescription>
        </DialogHeader>
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" {...createForm.register('firstName')} />
              {createForm.formState.errors.firstName && (
                <p className="text-sm text-destructive">{createForm.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" {...createForm.register('lastName')} />
              {createForm.formState.errors.lastName && (
                <p className="text-sm text-destructive">{createForm.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...createForm.register('email')} />
            {createForm.formState.errors.email && (
              <p className="text-sm text-destructive">{createForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input id="password" type="password" {...createForm.register('password')} />
            {createForm.formState.errors.password && (
              <p className="text-sm text-destructive">{createForm.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" {...createForm.register('phone')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={selectedRole} onValueChange={(value) => createForm.setValue('role', value as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              <p className="text-sm text-destructive">{createForm.formState.errors.role.message}</p>
            )}
          </div>

          {customRoles.length > 0 && (
            <div className="space-y-2">
              <Label>Custom Role (optional)</Label>
              <Select
                value={createForm.watch('roleId') || '__none__'}
                onValueChange={(v) => createForm.setValue('roleId', v === '__none__' ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder="No custom role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No custom role</SelectItem>
                  {customRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Assign a custom role created in Settings &rarr; Roles
              </p>
            </div>
          )}

          <McAccessSelector
            form={createForm}
            mcNumbers={mcNumbers}
            selectedRole={selectedRole}
            idPrefix="create"
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createForm.formState.isSubmitting || createMutation.isPending}>
              {createForm.formState.isSubmitting || createMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Standalone edit dialog for editing an existing user */
interface UserEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: any;
  mcNumbers: any[];
  customRoles: CustomRole[];
  onClose: () => void;
}

export function UserEditDialog({
  isOpen,
  onOpenChange,
  editingUser,
  mcNumbers,
  customRoles,
  onClose,
}: UserEditDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const editForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const editSelectedRole = editForm.watch('role');

  // Reset form when editingUser changes
  const lastUserId = editForm.watch('email');
  if (editingUser && editingUser.email !== lastUserId) {
    const initialMcAccess = editingUser.mcAccess?.length > 0
      ? editingUser.mcAccess
      : (editingUser.mcNumberId ? [editingUser.mcNumberId] : []);
    editForm.reset({
      email: editingUser.email,
      firstName: editingUser.firstName,
      lastName: editingUser.lastName,
      phone: editingUser.phone || '',
      role: editingUser.role,
      roleId: editingUser.roleId || null,
      isActive: editingUser.isActive,
      password: '',
      mcNumberId: editingUser.mcNumberId || (initialMcAccess.length > 0 ? initialMcAccess[0] : null),
      mcAccess: initialMcAccess,
    });
  }

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<UserFormData> }) =>
      updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
      editForm.reset();
      setError(null);
      toast.success('User updated successfully');
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const onEditSubmit = async (data: UserFormData) => {
    if (!editingUser) return;
    setError(null);
    const submitData: Partial<UserFormData> = { ...data };
    if (submitData.mcAccess && submitData.mcAccess.length > 0 && !submitData.mcNumberId) {
      submitData.mcNumberId = submitData.mcAccess[0];
    }
    if (submitData.password === '' || !submitData.password) {
      delete submitData.password;
    }
    updateMutation.mutate({ userId: editingUser.id, data: submitData });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user information</DialogDescription>
        </DialogHeader>
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">First Name *</Label>
              <Input id="edit-firstName" {...editForm.register('firstName')} />
              {editForm.formState.errors.firstName && (
                <p className="text-sm text-destructive">{editForm.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Last Name *</Label>
              <Input id="edit-lastName" {...editForm.register('lastName')} />
              {editForm.formState.errors.lastName && (
                <p className="text-sm text-destructive">{editForm.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email *</Label>
            <Input id="edit-email" type="email" {...editForm.register('email')} />
            {editForm.formState.errors.email && (
              <p className="text-sm text-destructive">{editForm.formState.errors.email.message}</p>
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
              <p className="text-sm text-destructive">{editForm.formState.errors.password.message}</p>
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
            <Select value={editSelectedRole} onValueChange={(value) => editForm.setValue('role', value as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              <p className="text-sm text-destructive">{editForm.formState.errors.role.message}</p>
            )}
          </div>

          {customRoles.length > 0 && (
            <div className="space-y-2">
              <Label>Custom Role (optional)</Label>
              <Select
                value={editForm.watch('roleId') || '__none__'}
                onValueChange={(v) => editForm.setValue('roleId', v === '__none__' ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder="No custom role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No custom role</SelectItem>
                  {customRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Assign a custom role created in Settings &rarr; Roles
              </p>
            </div>
          )}

          <McAccessSelector
            form={editForm}
            mcNumbers={mcNumbers}
            selectedRole={editSelectedRole}
            idPrefix="edit"
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-isActive"
              checked={editForm.watch('isActive')}
              onCheckedChange={(checked) => editForm.setValue('isActive', checked as boolean)}
            />
            <Label htmlFor="edit-isActive" className="font-normal cursor-pointer">Active</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { onClose(); editForm.reset(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={editForm.formState.isSubmitting || updateMutation.isPending}>
              {editForm.formState.isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
