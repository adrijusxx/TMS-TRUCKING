'use client';

import { use } from 'react';
import IncidentForm from '@/components/safety/incidents/IncidentForm';
import InvestigationWorkflow from '@/components/safety/investigations/InvestigationWorkflow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Incidents', href: '/dashboard/safety/incidents' },
        { label: `Incident #${id}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Incident Details</h1>
        </div>
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Incident Details</TabsTrigger>
            <TabsTrigger value="investigation">Investigation</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <IncidentForm
              initialData={{ id }}
              onSuccess={() => router.push('/dashboard/safety/incidents')}
            />
          </TabsContent>
          <TabsContent value="investigation">
            <InvestigationWorkflow incidentId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

