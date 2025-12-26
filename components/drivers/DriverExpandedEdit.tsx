'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Save, X, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import DriverPersonalInfoTab from './DriverEditTabs/DriverPersonalInfoTab';
import DriverComplianceTab from './DriverEditTabs/DriverComplianceTab';
import DriverWorkDetailsTab from './DriverEditTabs/DriverWorkDetailsTab';
import DriverFinancialPayrollTab from './DriverEditTabs/DriverFinancialPayrollTab';
import { useMutation } from '@tanstack/react-query';

interface DriverExpandedEditProps {
  driverId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

async function fetchFullDriver(driverId: string) {
  const response = await fetch(apiUrl(`/api/drivers/${driverId}`));
  if (!response.ok) throw new Error('Failed to fetch driver');
  return response.json();
}

async function fetchTrucks() {
  const response = await fetch(apiUrl('/api/trucks?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch trucks');
  const result = await response.json();
  return result.data || [];
}

async function fetchTrailers() {
  const response = await fetch(apiUrl('/api/trailers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch trailers');
  const result = await response.json();
  return result.data || [];
}

async function fetchDispatchers() {
  const response = await fetch(apiUrl('/api/settings/users?role=DISPATCHER&limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch dispatchers');
  const result = await response.json();
  return result.data || [];
}

async function fetchUsers() {
  const response = await fetch(apiUrl('/api/settings/users?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch users');
  const result = await response.json();
  return result.data || [];
}

async function updateDriver(driverId: string, data: any) {
  const response = await fetch(apiUrl(`/api/drivers/${driverId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update driver');
  }
  return response.json();
}

export default function DriverExpandedEdit({ driverId, onSave, onCancel }: DriverExpandedEditProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('personal');
  const [formDataRef, setFormDataRef] = useState<any>(null);

  // Fetch full driver data
  const { data: driverData, isLoading: isLoadingDriver } = useQuery({
    queryKey: ['driver', driverId, 'full'],
    queryFn: () => fetchFullDriver(driverId),
    enabled: !!driverId,
  });

  // Fetch related data
  // Fetch related data
  const { data: trucks = [] } = useQuery({
    queryKey: ['trucks'],
    queryFn: fetchTrucks,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: trailers = [] } = useQuery({
    queryKey: ['trailers'],
    queryFn: fetchTrailers,
    staleTime: 5 * 60 * 1000,
  });

  const { data: dispatchers = [] } = useQuery({
    queryKey: ['dispatchers'],
    queryFn: fetchDispatchers,
    staleTime: 5 * 60 * 1000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,
  });

  const driver = driverData?.data;

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateDriver(driverId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', driverId] });
      queryClient.invalidateQueries({ queryKey: ['driver', driverId, 'full'] });
      toast.success('Driver updated successfully');
      onSave?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update driver');
    },
  });

  const handleSave = (formData: any) => {
    setFormDataRef(formData);
    updateMutation.mutate(formData);
  };

  // Listen for save event from tabs
  useEffect(() => {
    const handleFormSave = () => {
      if (formDataRef) {
        updateMutation.mutate(formDataRef);
      }
    };
    window.addEventListener('driver-form-save', handleFormSave);
    return () => window.removeEventListener('driver-form-save', handleFormSave);
  }, [formDataRef, updateMutation]);

  if (isLoadingDriver) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Driver not found
      </div>
    );
  }

  return (
    <div className="bg-background border-t border-l-4 border-l-primary">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b sticky top-0 bg-background z-10">
          <div>
            <h3 className="text-lg font-semibold">
              {driver.user?.firstName} {driver.user?.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">Driver #{driver.driverNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={updateMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={updateMutation.isPending}
              onClick={() => {
                const event = new CustomEvent('driver-form-save');
                window.dispatchEvent(event);
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="work">Work Details</TabsTrigger>
            <TabsTrigger value="financial">Financial & Payroll</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-4">
            <DriverPersonalInfoTab
              driver={driver}
              onSave={handleSave}
            />
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4 mt-4">
            <DriverComplianceTab
              driver={driver}
              onSave={handleSave}
            />
          </TabsContent>

          <TabsContent value="work" className="space-y-4 mt-4">
            <DriverWorkDetailsTab
              driver={driver}
              trucks={trucks.map((t: any) => ({ id: t.id, truckNumber: t.truckNumber }))}
              trailers={trailers.map((t: any) => ({ id: t.id, trailerNumber: t.trailerNumber }))}
              dispatchers={dispatchers.map((d: any) => ({
                id: d.id,
                firstName: d.firstName,
                lastName: d.lastName,
              }))}
              users={users.map((u: any) => ({
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role,
              }))}
              onSave={handleSave}
            />
          </TabsContent>

          <TabsContent value="financial" className="space-y-4 mt-4">
            <DriverFinancialPayrollTab
              driver={driver}
              onSave={handleSave}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

