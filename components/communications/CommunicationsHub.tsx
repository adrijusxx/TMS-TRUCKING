'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard, Phone, MessageSquare, Voicemail, Users, History,
} from 'lucide-react';
import QuickActions from './QuickActions';
import ActiveCallsPanel from './ActiveCallsPanel';
import CdrTable from './CdrTable';
import SmsComposer from './SmsComposer';
import VoicemailList from './VoicemailList';
import ContactsSyncPanel from './ContactsSyncPanel';

type TabValue = 'overview' | 'history' | 'sms' | 'voicemail' | 'contacts' | 'active';

export default function CommunicationsHub() {
  const [tab, setTab] = useState<TabValue>('overview');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Communications</h2>
        <p className="text-muted-foreground">
          Phone, SMS, voicemail, and call history — all in one place
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Call History
          </TabsTrigger>
          <TabsTrigger value="sms">
            <MessageSquare className="h-4 w-4 mr-2" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="voicemail" id="tab-voicemail">
            <Voicemail className="h-4 w-4 mr-2" />
            Voicemail
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="active">
            <Phone className="h-4 w-4 mr-2" />
            Active Calls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <QuickActions />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActiveCallsPanel pollInterval={10000} />
              <VoicemailList />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <CdrTable />
        </TabsContent>

        <TabsContent value="sms">
          <div className="max-w-lg">
            <SmsComposer />
          </div>
        </TabsContent>

        <TabsContent value="voicemail">
          <VoicemailList />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsSyncPanel />
        </TabsContent>

        <TabsContent value="active">
          <ActiveCallsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
