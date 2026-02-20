'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Clock, Play, Timer, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────

interface JobConfig {
  key: string;
  name: string;
  description: string;
  category: string;
  defaultSchedule: string;
  schedule: string;
  enabled: boolean;
  isDefault: boolean;
}

// ─── Schedule Presets ───────────────────────────────

const SCHEDULE_PRESETS = [
  { label: 'Every 5 minutes',  value: '*/5 * * * *' },
  { label: 'Every 10 minutes', value: '*/10 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour',       value: '0 * * * *' },
  { label: 'Every 2 hours',    value: '0 */2 * * *' },
  { label: 'Every 4 hours',    value: '0 */4 * * *' },
  { label: 'Daily at 2 AM',    value: '0 2 * * *' },
  { label: 'Daily at 6 AM',    value: '0 6 * * *' },
  { label: 'Daily at 12 PM',   value: '0 12 * * *' },
  { label: 'Weekly (Sunday 3 AM)', value: '0 3 * * 0' },
  { label: 'Weekly (Friday 12 PM)', value: '0 12 * * 5' },
];

function getPresetLabel(schedule: string): string {
  const preset = SCHEDULE_PRESETS.find((p) => p.value === schedule);
  if (preset) return preset.label;

  // Parse common patterns for human-readable display
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;
  const [min, hour, , , dow] = parts;

  if (min.startsWith('*/')) return `Every ${min.slice(2)} minutes`;
  if (min === '0' && hour.startsWith('*/')) return `Every ${hour.slice(2)} hours`;
  if (min !== '*' && hour !== '*' && dow === '*') return `Daily at ${hour}:${min.padStart(2, '0')}`;

  return schedule;
}

const CATEGORY_COLORS: Record<string, string> = {
  CRM: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Campaign: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  Automation: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

// ─── API Functions ──────────────────────────────────

async function fetchJobs() {
  const res = await fetch(apiUrl('/api/settings/scheduled-jobs'));
  if (!res.ok) throw new Error('Failed to load scheduled jobs');
  return res.json();
}

async function updateJob(data: { jobKey: string; enabled?: boolean; schedule?: string }) {
  const res = await fetch(apiUrl('/api/settings/scheduled-jobs'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to update');
  }
  return res.json();
}

async function runJob(jobKey: string) {
  const res = await fetch(apiUrl(`/api/settings/scheduled-jobs/${jobKey}/test`), {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to run job');
  }
  return res.json();
}

// ─── Component ──────────────────────────────────────

export default function ScheduledJobsSettings() {
  const queryClient = useQueryClient();
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [customCron, setCustomCron] = useState('');
  const [runningJob, setRunningJob] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['scheduled-jobs'],
    queryFn: fetchJobs,
  });

  const updateMutation = useMutation({
    mutationFn: updateJob,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-jobs'] });
      toast.success(`Updated "${vars.jobKey}" successfully`);
      setEditingJob(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const runMutation = useMutation({
    mutationFn: runJob,
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Job executed');
      setRunningJob(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setRunningJob(null);
    },
  });

  const handleToggle = (jobKey: string, enabled: boolean) => {
    updateMutation.mutate({ jobKey, enabled });
  };

  const handleScheduleChange = (jobKey: string, schedule: string) => {
    if (schedule === 'custom') {
      setEditingJob(jobKey);
      setCustomCron('');
      return;
    }
    updateMutation.mutate({ jobKey, schedule });
    setEditingJob(null);
  };

  const handleCustomSave = (jobKey: string) => {
    if (!customCron.trim()) return;
    updateMutation.mutate({ jobKey, schedule: customCron.trim() });
  };

  const handleRunNow = (jobKey: string) => {
    setRunningJob(jobKey);
    runMutation.mutate(jobKey);
  };

  const handleResetToDefault = (jobKey: string, defaultSchedule: string) => {
    updateMutation.mutate({ jobKey, schedule: defaultSchedule });
  };

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading scheduled jobs...</div>;
  }

  const jobs: JobConfig[] = data?.data?.jobs || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            <CardTitle>Scheduled Jobs</CardTitle>
          </div>
          <CardDescription>
            Manage automated background tasks. Jobs run on the server and process data
            for all companies. Changes take effect immediately.
          </CardDescription>
        </CardHeader>
      </Card>

      {jobs.map((job) => (
        <Card key={job.key} className={!job.enabled ? 'opacity-60' : ''}>
          <CardContent className="py-4 space-y-3">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={job.enabled}
                  onCheckedChange={(checked) => handleToggle(job.key, checked)}
                  disabled={updateMutation.isPending}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{job.name}</span>
                    <Badge variant="outline" className={CATEGORY_COLORS[job.category] || ''}>
                      {job.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunNow(job.key)}
                  disabled={runningJob === job.key || runMutation.isPending}
                >
                  {runningJob === job.key ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Play className="h-4 w-4 mr-1" />
                  )}
                  Run Now
                </Button>
              </div>
            </div>

            {/* Schedule Row */}
            <div className="flex items-center gap-3 pl-12">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={
                    editingJob === job.key
                      ? 'custom'
                      : SCHEDULE_PRESETS.find((p) => p.value === job.schedule)
                        ? job.schedule
                        : 'custom'
                  }
                  onValueChange={(val) => handleScheduleChange(job.key, val)}
                  disabled={!job.enabled}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom cron...</SelectItem>
                  </SelectContent>
                </Select>

                {editingJob === job.key || !SCHEDULE_PRESETS.find((p) => p.value === job.schedule) ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingJob === job.key ? customCron : job.schedule}
                      onChange={(e) => setCustomCron(e.target.value)}
                      onFocus={() => {
                        if (editingJob !== job.key) {
                          setEditingJob(job.key);
                          setCustomCron(job.schedule);
                        }
                      }}
                      placeholder="*/15 * * * *"
                      className="w-[180px] font-mono text-sm"
                      disabled={!job.enabled}
                    />
                    {editingJob === job.key && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleCustomSave(job.key)}
                          disabled={!customCron.trim() || updateMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingJob(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <Label className="text-sm text-muted-foreground">
                    {getPresetLabel(job.schedule)}
                  </Label>
                )}

                {!job.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleResetToDefault(job.key, job.defaultSchedule)}
                    disabled={updateMutation.isPending}
                  >
                    Reset to default
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          All times are in <strong>America/Chicago (Central Time)</strong>.
          Jobs run server-side and process data across all companies.
          Disabling a job stops it until re-enabled.
        </p>
      </div>
    </div>
  );
}
