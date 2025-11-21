'use client';

import { use } from 'react';
import IncidentForm from '@/components/safety/incidents/IncidentForm';
import InvestigationWorkflow from '@/components/safety/investigations/InvestigationWorkflow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="p-6">
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
  );
}

