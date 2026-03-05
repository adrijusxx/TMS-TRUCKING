'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Palette, FileText, Gauge } from 'lucide-react';
import GeneralSettings from '@/components/settings/GeneralSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import CustomFieldsSettings from '@/components/settings/CustomFieldsSettings';
import OperationalMetricsSettings from '@/components/settings/OperationalMetricsSettings';

export default function SystemConfigCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">System Configuration</h2>
        <p className="text-muted-foreground">
          Configure regional settings (timezone, date format, currency), default values, appearance preferences, and custom fields that extend your data model. Changes here affect the entire organization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <CardTitle>General</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <GeneralSettings />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Operational Metrics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <OperationalMetricsSettings />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Appearance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <AppearanceSettings />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Custom Fields</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CustomFieldsSettings />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
