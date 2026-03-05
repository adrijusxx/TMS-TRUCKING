'use client';

import ScheduledJobsSettings from '@/components/settings/ScheduledJobsSettings';

export default function ScheduledJobsCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Scheduled Jobs</h2>
        <p className="text-muted-foreground">
          View and configure automated tasks like settlement generation, data sync, and cleanup jobs. Jobs run on configurable schedules &mdash; enable, disable, or adjust timing for each. Use the test button to trigger a job manually.
        </p>
      </div>

      <ScheduledJobsSettings />
    </div>
  );
}
