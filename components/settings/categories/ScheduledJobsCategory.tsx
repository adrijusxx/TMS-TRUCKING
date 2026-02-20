'use client';

import ScheduledJobsSettings from '@/components/settings/ScheduledJobsSettings';

export default function ScheduledJobsCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Scheduled Jobs</h2>
        <p className="text-muted-foreground">
          View and manage automated background tasks like CRM lead syncing, follow-up reminders, and system automation
        </p>
      </div>

      <ScheduledJobsSettings />
    </div>
  );
}
