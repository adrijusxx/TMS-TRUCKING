'use client';

import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Truck } from 'lucide-react';
import CompanySettings from '@/components/settings/CompanySettings';
import CompanyBrandingSettings from '@/components/settings/CompanyBrandingSettings';
import McSettingsDetail from '@/components/settings/McSettingsDetail';

async function fetchCompanyData() {
  const response = await fetch(apiUrl('/api/settings/company'));
  if (!response.ok) throw new Error('Failed to fetch company data');
  return response.json();
}

export default function CompanyOrganizationCategory() {
  const { data, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: fetchCompanyData,
  });

  const mcNumbers = data?.data?.mcNumbers || [];

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading organization details...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Company & Organization</h2>
        <p className="text-muted-foreground">
          Manage your company information, branding, and multi-MC configurations.
        </p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-transparent p-0 mb-6">
          <TabsTrigger
            value="company"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border px-4 py-2"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Company Global
          </TabsTrigger>

          {mcNumbers.map((mc: any) => (
            <TabsTrigger
              key={mc.id}
              value={mc.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border px-4 py-2"
            >
              <Truck className="w-4 h-4 mr-2" />
              MC {mc.number}
              {mc.isDefault && <span className="ml-2 text-[10px] bg-background/20 px-1.5 rounded-full">Default</span>}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="company" className="space-y-8 animate-in fade-in-50">
          <CompanySettings />
          <CompanyBrandingSettings />
        </TabsContent>

        {mcNumbers.map((mc: any) => (
          <TabsContent key={mc.id} value={mc.id} className="animate-in fade-in-50">
            <McSettingsDetail mc={mc} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}





