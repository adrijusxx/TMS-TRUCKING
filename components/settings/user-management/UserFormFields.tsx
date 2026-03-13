'use client';

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
import type { UseFormReturn } from 'react-hook-form';
import { type UserFormData, type CustomRole, ROLE_OPTIONS } from './types';
import McAccessSelector from './McAccessSelector';

interface UserFormFieldsProps {
  form: UseFormReturn<UserFormData>;
  mcNumbers: any[];
  customRoles: CustomRole[];
  mode: 'create' | 'edit';
  /** For edit mode: the user being edited (needed for tempPassword display) */
  editingUser?: any;
  /** Prefix for HTML ids to avoid conflicts when both forms are in DOM */
  idPrefix: string;
}

export default function UserFormFields({
  form,
  mcNumbers,
  customRoles,
  mode,
  editingUser,
  idPrefix,
}: UserFormFieldsProps) {
  const selectedRole = form.watch('role');

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-firstName`}>First Name *</Label>
          <Input id={`${idPrefix}-firstName`} {...form.register('firstName')} />
          {form.formState.errors.firstName && (
            <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-lastName`}>Last Name *</Label>
          <Input id={`${idPrefix}-lastName`} {...form.register('lastName')} />
          {form.formState.errors.lastName && (
            <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`}>Email *</Label>
        <Input id={`${idPrefix}-email`} type="email" {...form.register('email')} />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
        {mode === 'edit' && (
          <p className="text-xs text-muted-foreground">
            Changing email will require the user to sign in with the new email
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-password`}>Password {mode === 'create' ? '*' : ''}</Label>
        <Input
          id={`${idPrefix}-password`}
          type="password"
          placeholder={mode === 'edit' ? 'Enter new password to reset (leave blank to keep current)' : undefined}
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        )}
        {mode === 'edit' && editingUser?.tempPassword && (
          <div className="p-3 bg-muted rounded-md border">
            <p className="text-xs font-medium mb-1">Current Password (Admin View):</p>
            <p className="text-sm font-mono bg-background p-2 rounded border">{editingUser.tempPassword}</p>
            <p className="text-xs text-muted-foreground mt-1">
              This password will be cleared after the user logs in successfully.
            </p>
          </div>
        )}
        {mode === 'edit' && !editingUser?.tempPassword && (
          <p className="text-xs text-muted-foreground">
            Enter a new password to reset it (minimum 8 characters). Password will be visible here after setting.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-phone`}>Phone</Label>
        <Input id={`${idPrefix}-phone`} type="tel" {...form.register('phone')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-role`}>Role *</Label>
        <Select value={selectedRole} onValueChange={(value) => form.setValue('role', value as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.role && (
          <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
        )}
      </div>

      {customRoles.length > 0 && (
        <div className="space-y-2">
          <Label>Custom Role (optional)</Label>
          <Select
            value={form.watch('roleId') || '__none__'}
            onValueChange={(v) => form.setValue('roleId', v === '__none__' ? null : v)}
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
        form={form}
        mcNumbers={mcNumbers}
        selectedRole={selectedRole}
        idPrefix={idPrefix}
      />

      {mode === 'edit' && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${idPrefix}-isActive`}
            checked={form.watch('isActive')}
            onCheckedChange={(checked) => form.setValue('isActive', checked as boolean)}
          />
          <Label htmlFor={`${idPrefix}-isActive`} className="font-normal cursor-pointer">Active</Label>
        </div>
      )}
    </>
  );
}
