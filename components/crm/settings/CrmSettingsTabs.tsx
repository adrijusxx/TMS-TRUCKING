'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RecruiterVisibilitySettings from './RecruiterVisibilitySettings';
import LeadDefaultsSettings from './LeadDefaultsSettings';
import RecruiterAssignmentSettings from './RecruiterAssignmentSettings';
import RecruiterGoalsSettings from './RecruiterGoalsSettings';
import SLAConfigEditor from './SLAConfigEditor';
import FollowUpReminderSettings from './FollowUpReminderSettings';
import LeadAgingSettings from './LeadAgingSettings';
import DuplicateDetectionSettings from './DuplicateDetectionSettings';
import CrmNotificationSettings from './CrmNotificationSettings';

interface CrmSettingsTabsProps {
    integrationSlot: React.ReactNode;
}

export default function CrmSettingsTabs({ integrationSlot }: CrmSettingsTabsProps) {
    return (
        <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
                <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                <TabsTrigger value="data-quality">Data Quality</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
                <RecruiterVisibilitySettings />
                <LeadDefaultsSettings />
            </TabsContent>

            <TabsContent value="assignment" className="space-y-4">
                <RecruiterAssignmentSettings />
                <RecruiterGoalsSettings />
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-4">
                <SLAConfigEditor />
                <FollowUpReminderSettings />
                <LeadAgingSettings />
            </TabsContent>

            <TabsContent value="data-quality" className="space-y-4">
                <DuplicateDetectionSettings />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
                <CrmNotificationSettings />
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
                {integrationSlot}
            </TabsContent>
        </Tabs>
    );
}
