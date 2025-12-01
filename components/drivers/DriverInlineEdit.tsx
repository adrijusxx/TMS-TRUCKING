'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import DriverPersonalInfoTab from './DriverEditTabs/DriverPersonalInfoTab';
import DriverComplianceTab from './DriverEditTabs/DriverComplianceTab';
import DriverWorkDetailsTab from './DriverEditTabs/DriverWorkDetailsTab';
import DriverFinancialPayrollTab from './DriverEditTabs/DriverFinancialPayrollTab';

interface DriverInlineEditProps {
  row: {
    id: string;
    driverNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    status?: DriverStatus;
    employeeStatus?: EmployeeStatus;
    assignmentStatus?: AssignmentStatus;
    mcNumberId?: string | null;
    mcNumber?: { id: string; number: string } | null;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
    };
  };
  onSave?: () => void;
  onCancel?: () => void;
}

async function fetchFullDriver(driverId: string) {
  const response = await fetch(apiUrl(`/api/drivers/${driverId}`));
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Failed to fetch driver' } }));
    throw new Error(error.error?.message || `Failed to fetch driver: ${response.status}`);
  }
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Driver not found');
  }
  return result;
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

export default function DriverInlineEdit({ row, onSave, onCancel }: DriverInlineEditProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('personal');
  const formDataRef = useRef<any>({});

  // Fetch full driver data
  const { data: driverData, isLoading: isLoadingDriver, error: driverError } = useQuery({
    queryKey: ['driver', row.id, 'inline'],
    queryFn: () => fetchFullDriver(row.id),
    enabled: !!row.id,
    staleTime: 0, // Always fetch fresh data for editing
    retry: 3, // Retry up to 3 times for new drivers (might need time to be fully committed)
    retryDelay: (attemptIndex) => Math.min(500 * (attemptIndex + 1), 2000), // Exponential backoff: 500ms, 1000ms, 1500ms, max 2000ms
  });

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
    mutationFn: (data: any) => updateDriver(row.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', row.id] });
      queryClient.invalidateQueries({ queryKey: ['driver', row.id, 'inline'] });
      toast.success('Driver updated successfully');
      onSave?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update driver');
    },
  });

  const handleSave = (formData: any, tabName: string) => {
    formDataRef.current = {
      ...formDataRef.current,
      [tabName]: formData,
    };
  };

  // Listen for save event from tabs - collect all form data
  useEffect(() => {
    let saveTimeout: NodeJS.Timeout;
    
    const handleFormSave = () => {
      // Clear any pending save
      if (saveTimeout) clearTimeout(saveTimeout);
      
      // Reset form data collection
      formDataRef.current = {};
      
      // Trigger all forms to submit - this will call handleSave for each tab
      const forms = [
        document.getElementById('driver-personal-info-form') as HTMLFormElement,
        document.getElementById('driver-compliance-form') as HTMLFormElement,
        document.getElementById('driver-work-details-form') as HTMLFormElement,
        document.getElementById('driver-financial-payroll-form') as HTMLFormElement,
      ];

      // Submit all forms - they will call onSave which updates formDataRef
      forms.forEach(form => {
        if (form) {
          form.requestSubmit();
        }
      });

      // Wait for all forms to submit and update formDataRef, then save
      saveTimeout = setTimeout(() => {
        // Merge all tab data
        const allData = {
          ...(formDataRef.current.personal || {}),
          ...(formDataRef.current.compliance || {}),
          ...(formDataRef.current.work || {}),
          ...(formDataRef.current.financial || {}),
        };

        // Only save if we have data
        if (Object.keys(allData).length > 0) {
          updateMutation.mutate(allData);
          // Clear form data after save
          formDataRef.current = {};
        } else {
          toast.error('No changes to save');
        }
      }, 300);
    };
    
    window.addEventListener('driver-form-save', handleFormSave);
    return () => {
      window.removeEventListener('driver-form-save', handleFormSave);
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [updateMutation]);

  if (isLoadingDriver) {
    return (
      <Card className="m-4 border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (driverError) {
    return (
      <Card className="m-4 border-l-4 border-l-red-500">
        <CardContent className="pt-6">
          <div className="p-4 text-center">
            <p className="text-red-600 font-semibold mb-2">Error loading driver</p>
            <p className="text-sm text-muted-foreground">
              {driverError instanceof Error ? driverError.message : 'Failed to fetch driver data'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Driver ID: {row.id}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!driver) {
    return (
      <Card className="m-4 border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="p-4 text-center text-muted-foreground">
            Driver not found
            <p className="text-xs mt-2">Driver ID: {row.id}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="m-4 border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b">
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
                onSave={(data) => handleSave(data, 'personal')}
              />
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4 mt-4">
              <DriverComplianceTab
                driver={driver}
                onSave={(data) => handleSave(data, 'compliance')}
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
                onSave={(data) => handleSave(data, 'work')}
              />
            </TabsContent>

            <TabsContent value="financial" className="space-y-4 mt-4">
              <DriverFinancialPayrollTab
                driver={driver}
                onSave={(data) => handleSave(data, 'financial')}
              />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}

