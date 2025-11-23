'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Hash, Settings } from 'lucide-react';
import CompanySettings from '@/components/settings/CompanySettings';
import CompanyBrandingSettings from '@/components/settings/CompanyBrandingSettings';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                <CardTitle>MC Numbers</CardTitle>
              </div>
            </div>
            <CardDescription>
              Manage Motor Carrier (MC) numbers for your company
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Configure and manage MC numbers used for regulatory compliance
              </p>
              <Link href="/dashboard/mc-numbers">
                <Button variant="outline">
                  Manage MC Numbers
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Default Configurations</CardTitle>
              </div>
            </div>
            <CardDescription>
              Set default values and configurations for new records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Configure default settings for loads, invoices, and other entities
              </p>
              <Link href="/dashboard/settings/customizations/defaults">
                <Button variant="outline">
                  Configure Defaults
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

