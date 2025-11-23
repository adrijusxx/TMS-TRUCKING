'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Palette, FileText } from 'lucide-react';
import GeneralSettings from '@/components/settings/GeneralSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import CustomFieldsSettings from '@/components/settings/CustomFieldsSettings';

export default function SystemConfigCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">System Configuration</h2>
        <p className="text-muted-foreground">
          Configure general system settings, appearance, and custom fields
        </p>
      </div>

      <div className="space-y-6">
        <GeneralSettings />
        <AppearanceSettings />
        <CustomFieldsSettings />
      </div>
    </div>
  );
}

