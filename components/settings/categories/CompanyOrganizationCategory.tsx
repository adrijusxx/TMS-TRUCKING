'use client';

import { Building2 } from 'lucide-react';
import CompanySettings from '@/components/settings/CompanySettings';
import CompanyBrandingSettings from '@/components/settings/CompanyBrandingSettings';
import SettingsCard from '@/components/settings/SettingsCard';

export default function CompanyOrganizationCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Company & Organization</h2>
        <p className="text-muted-foreground">
          Manage your company information, branding, and organizational settings
        </p>
      </div>

      <div className="space-y-6">
        <CompanySettings />

        <CompanyBrandingSettings />
      </div>
    </div>
  );
}





