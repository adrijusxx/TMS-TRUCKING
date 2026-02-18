'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import IncidentForm from '@/components/safety/incidents/IncidentForm';
import InvestigationWorkflow from '@/components/safety/investigations/InvestigationWorkflow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { apiUrl } from '@/lib/utils';

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: incident } = useQuery({
    queryKey: ['incident', id, 'breadcrumb'],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/safety/incidents/${id}`));
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json;
    },
  });

  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Incidents', href: '/dashboard/safety/incidents' },
        { label: incident?.incidentNumber ? `Incident #${incident.incidentNumber}` : 'Incident Details' }
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
