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
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Settings,
  DollarSign,
  Clock,
} from 'lucide-react';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
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

interface FactoringCompany {
  id: string;
  name: string;
  accountNumber?: string | null;
  reservePercentage: number;
  reserveHoldDays: number;
  apiProvider?: string | null;
  exportFormat?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  _count?: {
    invoices: number;
    customers: number;
  };
}

async function fetchFactoringCompanies() {
  const response = await fetch(apiUrl('/api/factoring-companies'));
  if (!response.ok) throw new Error('Failed to fetch factoring companies');
  return response.json();
}

export default function FactoringCompanyList() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<FactoringCompany | null>(null);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    accountNumber: '',
    reservePercentage: 10,
    reserveHoldDays: 90,
    apiProvider: '',
    apiEndpoint: '',
    apiKey: '',
    apiSecret: '',
    exportFormat: 'CSV',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });

  const { data, isLoading, error } = useQuery<{ success: boolean; data: FactoringCompany[] }>({
    queryKey: ['factoring-companies'],
    queryFn: fetchFactoringCompanies,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl('/api/factoring-companies'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create factoring company');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Factoring company created');
      queryClient.invalidateQueries({ queryKey: ['factoring-companies'] });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create factoring company');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(apiUrl(`/api/factoring-companies/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update factoring company');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Factoring company updated');
      queryClient.invalidateQueries({ queryKey: ['factoring-companies'] });
      setEditDialogOpen(false);
      setEditingCompany(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update factoring company');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(apiUrl(`/api/factoring-companies/${id}`), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete factoring company');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Factoring company deleted');
      queryClient.invalidateQueries({ queryKey: ['factoring-companies'] });
      setDeleteDialogOpen(false);
      setDeletingCompanyId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete factoring company');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      accountNumber: '',
      reservePercentage: 10,
      reserveHoldDays: 90,
      apiProvider: '',
      apiEndpoint: '',
      apiKey: '',
      apiSecret: '',
      exportFormat: 'CSV',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
    });
  };

  const handleEdit = (company: FactoringCompany) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      accountNumber: company.accountNumber || '',
      reservePercentage: company.reservePercentage,
      reserveHoldDays: company.reserveHoldDays,
      apiProvider: company.apiProvider || '',
      apiEndpoint: '',
      apiKey: '',
      apiSecret: '',
      exportFormat: company.exportFormat || 'CSV',
      contactName: company.contactName || '',
      contactEmail: company.contactEmail || '',
      contactPhone: company.contactPhone || '',
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (companyId: string) => {
    setDeletingCompanyId(companyId);
    setDeleteDialogOpen(true);
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingCompany) return;
    updateMutation.mutate({ id: editingCompany.id, data: formData });
  };

  const handleDeleteConfirm = () => {
    if (!deletingCompanyId) return;
    deleteMutation.mutate(deletingCompanyId);
  };

  const companies = data?.data || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Factoring Companies</h2>
          <p className="text-muted-foreground">Manage factoring company relationships</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Factoring Company
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Companies</p>
                <p className="text-2xl font-bold">{companies.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Companies</p>
                <p className="text-2xl font-bold text-green-600">
                  {companies.filter((c) => c.isActive).length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">
                  {companies.reduce((sum, c) => sum + (c._count?.invoices || 0), 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading factoring companies...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Error loading factoring companies. Please try again.
        </div>
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No factoring companies found</p>
              <p className="text-muted-foreground mb-4">
                Add your first factoring company to start managing factoring operations
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Factoring Company
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Reserve %</TableHead>
                <TableHead>Hold Days</TableHead>
                <TableHead>API Provider</TableHead>
                <TableHead>Export Format</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead>Customers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.accountNumber || '-'}</TableCell>
                  <TableCell>{company.reservePercentage}%</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {company.reserveHoldDays} days
                    </div>
                  </TableCell>
                  <TableCell>{company.apiProvider || '-'}</TableCell>
                  <TableCell>{company.exportFormat || '-'}</TableCell>
                  <TableCell>{company._count?.invoices || 0}</TableCell>
                  <TableCell>{company._count?.customers || 0}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        company.isActive
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }
                    >
                      {company.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(company)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(company.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Factoring Company</DialogTitle>
            <DialogDescription>
              Add a new factoring company to manage factoring operations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="RTS Financial"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="ACC-12345"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reservePercentage">Reserve Percentage (%)</Label>
                <Input
                  id="reservePercentage"
                  type="number"
                  step="0.1"
                  value={formData.reservePercentage}
                  onChange={(e) =>
                    setFormData({ ...formData, reservePercentage: parseFloat(e.target.value) || 10 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reserveHoldDays">Reserve Hold Days</Label>
                <Input
                  id="reserveHoldDays"
                  type="number"
                  value={formData.reserveHoldDays}
                  onChange={(e) =>
                    setFormData({ ...formData, reserveHoldDays: parseInt(e.target.value) || 90 })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiProvider">API Provider</Label>
              <Select
                value={formData.apiProvider}
                onValueChange={(value) => setFormData({ ...formData, apiProvider: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select API provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="RTS">RTS Financial</SelectItem>
                  <SelectItem value="TAFS">TAFS (Transportation Alliance Bank)</SelectItem>
                  <SelectItem value="FACTORING_SOLUTIONS">Factoring Solutions</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.apiProvider && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiEndpoint">API Endpoint</Label>
                  <Input
                    id="apiEndpoint"
                    value={formData.apiEndpoint}
                    onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                    placeholder="https://api.example.com/v1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiSecret">API Secret</Label>
                    <Input
                      id="apiSecret"
                      type="password"
                      value={formData.apiSecret}
                      onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="exportFormat">Export Format</Label>
              <Select
                value={formData.exportFormat}
                onValueChange={(value) => setFormData({ ...formData, exportFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="EDI">EDI</SelectItem>
                  <SelectItem value="Excel">Excel</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contact Information</Label>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="Contact Name"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Factoring Company</DialogTitle>
            <DialogDescription>
              Update factoring company information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Company Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-accountNumber">Account Number</Label>
                <Input
                  id="edit-accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-reservePercentage">Reserve Percentage (%)</Label>
                <Input
                  id="edit-reservePercentage"
                  type="number"
                  step="0.1"
                  value={formData.reservePercentage}
                  onChange={(e) =>
                    setFormData({ ...formData, reservePercentage: parseFloat(e.target.value) || 10 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reserveHoldDays">Reserve Hold Days</Label>
                <Input
                  id="edit-reserveHoldDays"
                  type="number"
                  value={formData.reserveHoldDays}
                  onChange={(e) =>
                    setFormData({ ...formData, reserveHoldDays: parseInt(e.target.value) || 90 })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-apiProvider">API Provider</Label>
              <Select
                value={formData.apiProvider}
                onValueChange={(value) => setFormData({ ...formData, apiProvider: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select API provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="RTS">RTS Financial</SelectItem>
                  <SelectItem value="TAFS">TAFS</SelectItem>
                  <SelectItem value="FACTORING_SOLUTIONS">Factoring Solutions</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.apiProvider && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-apiEndpoint">API Endpoint</Label>
                  <Input
                    id="edit-apiEndpoint"
                    value={formData.apiEndpoint}
                    onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-apiKey">API Key</Label>
                    <Input
                      id="edit-apiKey"
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-apiSecret">API Secret</Label>
                    <Input
                      id="edit-apiSecret"
                      type="password"
                      value={formData.apiSecret}
                      onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                    />
                  </div>
                </div>
            </>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-exportFormat">Export Format</Label>
              <Select
                value={formData.exportFormat}
                onValueChange={(value) => setFormData({ ...formData, exportFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="EDI">EDI</SelectItem>
                  <SelectItem value="Excel">Excel</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contact Information</Label>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="Contact Name"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.name || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Factoring Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this factoring company? This action cannot be undone.
              If the company has invoices or customers assigned, it will be marked as inactive instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

