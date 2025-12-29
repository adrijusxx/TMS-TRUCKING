'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Search } from 'lucide-react';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import DriverPersonalInfoTab from './DriverEditTabs/DriverPersonalInfoTab';
import DriverComplianceTab from './DriverEditTabs/DriverComplianceTab';
import DriverWorkDetailsTab from './DriverEditTabs/DriverWorkDetailsTab';
import DriverFinancialPayrollTab from './DriverEditTabs/DriverFinancialPayrollTab';

interface DriverEditFormProps {
  driver: any;
  trucks: Array<{ id: string; truckNumber: string }>;
  trailers: Array<{ id: string; trailerNumber: string }>;
  dispatchers: Array<{ id: string; firstName: string; lastName: string }>;
  users: Array<{ id: string; firstName: string; lastName: string; role: string }>;
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

export default function DriverEditForm({
  driver,
  trucks,
  trailers,
  dispatchers,
  users,
}: DriverEditFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Get initial tab from URL query parameter
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      // Map old tab names to new ones
      if (tabParam === 'financials' || tabParam === 'accounting') {
        return 'financial';
      }
      return tabParam || 'personal';
    }
    return 'personal';
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [formDataRef, setFormDataRef] = useState<any>(null);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateDriver(driver.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', driver.id] });
      toast.success('Driver updated successfully');
      // Stay on same page after save
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/drivers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-semibold">{driver.user.firstName} {driver.user.lastName}</h2>
            <p className="text-sm text-muted-foreground">Driver #{driver.driverNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search other drivers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          <Button
            type="submit"
            form="driver-edit-form"
            disabled={updateMutation.isPending}
            onClick={() => {
              // Trigger save for all tabs via event system
              const event = new CustomEvent('driver-form-save');
              window.dispatchEvent(event);
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save'}
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

        <TabsContent value="personal" className="space-y-4">
          <DriverPersonalInfoTab
            driver={driver}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <DriverComplianceTab
            driver={driver}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="work" className="space-y-4">
          <DriverWorkDetailsTab
            driver={driver}
            trucks={trucks}
            trailers={trailers}
            dispatchers={dispatchers}
            users={users}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <DriverFinancialPayrollTab
            driver={driver}
            onSave={handleSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

