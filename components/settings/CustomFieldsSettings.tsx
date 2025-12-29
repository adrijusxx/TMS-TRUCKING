'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, GripVertical, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const customFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  label: z.string().min(1, 'Field label is required'),
  type: z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'TEXTAREA', 'EMAIL', 'PHONE', 'URL']),
  entityType: z.enum(['LOAD', 'DRIVER', 'CUSTOMER', 'TRUCK', 'TRAILER', 'INVOICE']),
  required: z.boolean(),
  defaultValue: z.string().optional(),
  options: z.array(z.string()).optional(), // For SELECT type
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  isActive: z.boolean(),
});

type CustomField = z.infer<typeof customFieldSchema> & { id?: string };

async function fetchCustomFields() {
  const response = await fetch(apiUrl('/api/settings/custom-fields'));
  if (!response.ok) throw new Error('Failed to fetch custom fields');
  return response.json();
}

async function createCustomField(data: CustomField) {
  const response = await fetch(apiUrl('/api/settings/custom-fields'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create custom field');
  }
  return response.json();
}

async function updateCustomField(id: string, data: Partial<CustomField>) {
  const response = await fetch(apiUrl(`/api/settings/custom-fields/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update custom field');
  }
  return response.json();
}

async function deleteCustomField(id: string) {
  const response = await fetch(apiUrl(`/api/settings/custom-fields/${id}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete custom field');
  }
  return response.json();
}

export default function CustomFieldsSettings() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: fieldsData, isLoading } = useQuery({
    queryKey: ['custom-fields'],
    queryFn: fetchCustomFields,
  });

  const fields: CustomField[] = fieldsData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CustomField>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      name: '',
      label: '',
      type: 'TEXT',
      entityType: 'LOAD',
      required: false,
      defaultValue: '',
      options: [],
      placeholder: '',
      helpText: '',
      isActive: true,
    },
  });

  const fieldType = watch('type');
  const [optionInput, setOptionInput] = useState('');

  const createMutation = useMutation({
    mutationFn: createCustomField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      toast.success('Custom field created successfully');
      setIsDialogOpen(false);
      reset();
      setEditingField(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomField> }) =>
      updateCustomField(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      toast.success('Custom field updated successfully');
      setIsDialogOpen(false);
      reset();
      setEditingField(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      toast.success('Custom field deleted successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    reset({
      ...field,
      options: field.options || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this custom field?')) {
      deleteMutation.mutate(id);
    }
  };

  const addOption = () => {
    if (!optionInput.trim()) return;
    const currentOptions = watch('options') || [];
    setValue('options', [...currentOptions, optionInput.trim()]);
    setOptionInput('');
  };

  const removeOption = (index: number) => {
    const currentOptions = watch('options') || [];
    setValue('options', currentOptions.filter((_, i) => i !== index));
  };

  const onSubmit = (data: CustomField) => {
    setError(null);
    if (editingField?.id) {
      updateMutation.mutate({ id: editingField.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingField(null);
    reset();
    setError(null);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  const fieldTypeLabels: Record<string, string> = {
    TEXT: 'Text',
    NUMBER: 'Number',
    DATE: 'Date',
    BOOLEAN: 'Yes/No',
    SELECT: 'Dropdown',
    TEXTAREA: 'Text Area',
    EMAIL: 'Email',
    PHONE: 'Phone',
    URL: 'URL',
  };

  const entityTypeLabels: Record<string, string> = {
    LOAD: 'Load',
    DRIVER: 'Driver',
    CUSTOMER: 'Customer',
    TRUCK: 'Truck',
    TRAILER: 'Trailer',
    INVOICE: 'Invoice',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Custom Fields</h2>
          <p className="text-muted-foreground">
            Create custom fields to capture additional information
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingField ? 'Edit Custom Field' : 'Create Custom Field'}
              </DialogTitle>
              <DialogDescription>
                Define a custom field that will appear in forms
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Field Name *</Label>
                  <Input
                    id="name"
                    placeholder="customFieldName"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Internal identifier (no spaces, camelCase)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label">Field Label *</Label>
                  <Input
                    id="label"
                    placeholder="Custom Field Label"
                    {...register('label')}
                  />
                  {errors.label && (
                    <p className="text-sm text-destructive">{errors.label.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Display name shown to users
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="entityType">Entity Type *</Label>
                  <Select
                    value={watch('entityType')}
                    onValueChange={(value: any) => setValue('entityType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(entityTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Field Type *</Label>
                  <Select
                    value={watch('type')}
                    onValueChange={(value: any) => setValue('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(fieldTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder Text</Label>
                <Input
                  id="placeholder"
                  placeholder="Enter placeholder text..."
                  {...register('placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="helpText">Help Text</Label>
                <Input
                  id="helpText"
                  placeholder="Additional information for users"
                  {...register('helpText')}
                />
              </div>

              {fieldType === 'SELECT' && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="flex gap-2">
                    <Input
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addOption();
                        }
                      }}
                      placeholder="Add option..."
                    />
                    <Button type="button" onClick={addOption}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {watch('options')?.map((option, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {option}
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="defaultValue">Default Value</Label>
                <Input
                  id="defaultValue"
                  {...register('defaultValue')}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={watch('required')}
                  onCheckedChange={(checked) => setValue('required', checked)}
                />
                <Label htmlFor="required" className="cursor-pointer">
                  Required field
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={watch('isActive')}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active (visible in forms)
                </Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingField
                    ? 'Update Field'
                    : 'Create Field'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Custom Fields List */}
      <div className="grid gap-4">
        {fields.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Custom Fields</h3>
              <p className="text-muted-foreground mb-4">
                Create your first custom field to capture additional information
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Field
              </Button>
            </CardContent>
          </Card>
        ) : (
          fields.map((field) => (
            <Card key={field.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{field.label}</h3>
                      <Badge variant="outline">{entityTypeLabels[field.entityType]}</Badge>
                      <Badge variant="secondary">{fieldTypeLabels[field.type]}</Badge>
                      {field.required && (
                        <Badge variant="destructive">Required</Badge>
                      )}
                      {!field.isActive && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Name: <code className="text-xs">{field.name}</code>
                    </p>
                    {field.helpText && (
                      <p className="text-sm text-muted-foreground">{field.helpText}</p>
                    )}
                    {field.options && field.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {field.options.map((opt, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {opt}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(field)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => field.id && handleDelete(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}





