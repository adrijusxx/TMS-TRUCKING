'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Map,
  FileText,
  Radio,
  DollarSign,
  Settings,
  CheckCircle2,
  Clock,
  XCircle,
  Sheet,
  Database,
  Phone,
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  href: string;
  status: 'active' | 'available' | 'coming-soon' | 'not-configured';
  category: 'communications' | 'gps' | 'finance' | 'data';
  features?: string[];
}

const integrations: Integration[] = [
  // Communications
  {
    id: 'netsapiens',
    name: 'NetSapiens PBX',
    description: 'Business phone system with click-to-call, SMS, voicemail, call recordings, and CDR',
    icon: Phone,
    href: '/dashboard/settings/integrations/netsapiens',
    status: 'not-configured',
    category: 'communications',
    features: [
      'Click-to-call from TMS',
      'Call history (CDR)',
      'SMS messaging',
      'Voicemail access',
      'Call recordings',
    ]
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'AI-powered driver communication with automatic case creation and intelligent auto-responses',
    icon: MessageSquare,
    href: '/dashboard/settings/integrations/telegram',
    status: 'available',
    category: 'communications',
    features: [
      'AI-powered breakdown detection',
      'Automatic case creation',
      'Smart auto-responses',
      'Multi-language support',
      'Photo analysis'
    ]
  },

  // GPS / Telematics
  {
    id: 'samsara',
    name: 'Samsara',
    description: 'Fleet telematics, GPS tracking, and ELD integration for real-time vehicle monitoring',
    icon: Radio,
    href: '/dashboard/settings/integrations/samsara',
    status: 'not-configured',
    category: 'gps',
    features: [
      'Real-time GPS tracking',
      'ELD compliance',
      'HOS data sync',
      'Vehicle diagnostics',
      'Driver safety scores'
    ]
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Distance calculation, route planning, and traffic-aware routing',
    icon: Map,
    href: '/dashboard/settings/integrations/google-maps',
    status: 'active',
    category: 'gps',
    features: [
      'Automatic mileage calculation',
      'Multi-stop route planning',
      'Traffic-aware routing',
      'Deadhead distance tracking'
    ]
  },

  // Finance
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Accounting integration for invoice sync and expense management',
    icon: DollarSign,
    href: '/dashboard/settings/integrations/quickbooks',
    status: 'not-configured',
    category: 'finance',
    features: [
      'Invoice sync to QuickBooks',
      'Expense import',
      'Two-way data sync',
      'Automatic reconciliation'
    ]
  },

  // Data Import
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Import CRM leads and data from Google Sheets with automatic sync',
    icon: Sheet,
    href: '/dashboard/settings/integrations/google-sheets',
    status: 'not-configured',
    category: 'data',
    features: [
      'CRM lead import',
      'Automatic data sync',
      'Column mapping',
      'Incremental imports'
    ]
  },
];

const categoryInfo = {
  communications: {
    title: 'Communications',
    description: 'Driver communication and messaging integrations',
    icon: MessageSquare,
  },
  gps: {
    title: 'GPS & Telematics',
    description: 'Fleet tracking, ELD, and route optimization',
    icon: Radio,
  },
  finance: {
    title: 'Finance & Accounting',
    description: 'Accounting, invoicing, and financial integrations',
    icon: DollarSign,
  },
  data: {
    title: 'Data Import',
    description: 'Import data from external sources',
    icon: Database,
  },
};

export default function IntegrationsSettings() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'communications' | 'gps' | 'finance' | 'data'>('all');

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'available':
        return (
          <Badge variant="secondary">
            <Settings className="h-3 w-3 mr-1" />
            Available
          </Badge>
        );
      case 'coming-soon':
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Coming Soon
          </Badge>
        );
      case 'not-configured':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Not Configured
          </Badge>
        );
    }
  };

  const filteredIntegrations = activeCategory === 'all'
    ? integrations
    : integrations.filter(i => i.category === activeCategory);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground">Connect third-party services to enhance your TMS functionality</p>
      </div>

      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="communications">
            <MessageSquare className="h-4 w-4 mr-2" />
            Communications
          </TabsTrigger>
          <TabsTrigger value="gps">
            <Radio className="h-4 w-4 mr-2" />
            GPS
          </TabsTrigger>
          <TabsTrigger value="finance">
            <DollarSign className="h-4 w-4 mr-2" />
            Finance
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="h-4 w-4 mr-2" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-6">
          {activeCategory !== 'all' && (
            <Card className="bg-muted/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {React.createElement(categoryInfo[activeCategory as keyof typeof categoryInfo].icon, {
                    className: "h-6 w-6 text-primary"
                  })}
                  <div>
                    <CardTitle>{categoryInfo[activeCategory as keyof typeof categoryInfo].title}</CardTitle>
                    <CardDescription>{categoryInfo[activeCategory as keyof typeof categoryInfo].description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredIntegrations.map((integration) => (
              <Link
                key={integration.id}
                href={integration.href}
                className={integration.status === 'coming-soon' ? 'pointer-events-none' : ''}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <integration.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                        </div>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                    <CardDescription className="mt-2">{integration.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {integration.features && integration.features.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Key Features:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {integration.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-primary hover:underline flex items-center gap-1">
                        {integration.status === 'available' ? 'Configure →' :
                          integration.status === 'active' ? 'Manage →' :
                            integration.status === 'coming-soon' ? 'Learn more' : 'Set up →'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
