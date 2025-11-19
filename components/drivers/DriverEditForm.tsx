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
import DriverMainTab from './DriverEditTabs/DriverMainTab';
import DriverDocumentsTab from './DriverEditTabs/DriverDocumentsTab';
import DriverMobileAppTab from './DriverEditTabs/DriverMobileAppTab';
import DriverRecruitingTab from './DriverEditTabs/DriverRecruitingTab';
import DriverAccountingTab from './DriverEditTabs/DriverAccountingTab';
import DriverSafetyTab from './DriverEditTabs/DriverSafetyTab';
import DriverAssetsTab from './DriverEditTabs/DriverAssetsTab';
import DriverStatisticsTab from './DriverEditTabs/DriverStatisticsTab';
import DriverLogHistoryTab from './DriverEditTabs/DriverLogHistoryTab';
import DriverTasksTab from './DriverEditTabs/DriverTasksTab';
import DriverOthersTab from './DriverEditTabs/DriverOthersTab';

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
  const [activeTab, setActiveTab] = useState('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [formDataRef, setFormDataRef] = useState<any>(null);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateDriver(driver.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', driver.id] });
      toast.success('Driver updated successfully');
      router.push(`/dashboard/drivers/${driver.id}`);
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
          <Link href={`/dashboard/drivers/${driver.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Update Driver</h1>
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
              // Trigger save for active tab if it's not the main form
              if (activeTab !== 'main') {
                const event = new CustomEvent('driver-form-save');
                window.dispatchEvent(event);
              }
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-11">
          <TabsTrigger value="main">Main</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="mobile">Mobile app login</TabsTrigger>
          <TabsTrigger value="recruiting">Recruiting</TabsTrigger>
          <TabsTrigger value="accounting">Accounting</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="log-history">Log History</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="others">Others</TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-4">
          <DriverMainTab
            driver={driver}
            trucks={trucks}
            trailers={trailers}
            dispatchers={dispatchers}
            users={users}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <DriverDocumentsTab driver={driver} />
        </TabsContent>

        <TabsContent value="mobile" className="space-y-4">
          <DriverMobileAppTab driver={driver} />
        </TabsContent>

        <TabsContent value="recruiting" className="space-y-4">
          <DriverRecruitingTab driver={driver} />
        </TabsContent>

        <TabsContent value="accounting" className="space-y-4">
          <DriverAccountingTab driver={driver} onSave={handleSave} />
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          <DriverSafetyTab driver={driver} />
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <DriverAssetsTab driver={driver} />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <DriverStatisticsTab driver={driver} />
        </TabsContent>

        <TabsContent value="log-history" className="space-y-4">
          <DriverLogHistoryTab driver={driver} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <DriverTasksTab driver={driver} />
        </TabsContent>

        <TabsContent value="others" className="space-y-4">
          <DriverOthersTab driver={driver} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

