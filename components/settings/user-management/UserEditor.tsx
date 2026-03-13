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
import { Plus, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { userSchema, type UserFormData, type CustomRole } from './types';
import { createUser, updateUser } from './api';
import UserFormFields from './UserFormFields';
import UserPermissionOverrides from '@/components/settings/roles/UserPermissionOverrides';

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

          <UserFormFields
            form={createForm}
            mcNumbers={mcNumbers}
            customRoles={customRoles}
            mode="create"
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user information</DialogDescription>
        </DialogHeader>
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
          )}

          <UserFormFields
            form={editForm}
            mcNumbers={mcNumbers}
            customRoles={customRoles}
            mode="edit"
            editingUser={editingUser}
            idPrefix="edit"
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { onClose(); editForm.reset(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={editForm.formState.isSubmitting || updateMutation.isPending}>
              {editForm.formState.isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        {editingUser && editingUser.role !== 'DRIVER' && editingUser.role !== 'CUSTOMER' && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between text-sm font-medium">
                Permission Overrides
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <UserPermissionOverrides
                userId={editingUser.id}
                userName={`${editingUser.firstName} ${editingUser.lastName}`}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </DialogContent>
    </Dialog>
  );
}
