/**
 * Mattermost Batch Notification Handler
 *
 * Receives queued notification events and posts consolidated messages
 * to Mattermost channels. Uses Inngest batchEvents to group notifications
 * within a 3-minute window (or up to 50 events).
 */

import { inngest } from '../client';
import { getMattermostNotificationService } from '@/lib/services/MattermostNotificationService';

type AlertCategory = 'dispatch' | 'safety' | 'maintenance' | 'accounting' | 'fleet' | 'recruiting';

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  dispatch: 'Dispatch Updates',
  safety: 'Safety Alerts',
  maintenance: 'Maintenance Updates',
  accounting: 'Accounting Updates',
  fleet: 'Fleet Updates',
  recruiting: 'Recruiting Updates',
};

export const mattermostBatchNotify = inngest.createFunction(
  {
    id: 'mattermost-batch-notify',
    name: 'Mattermost Batch Notification Poster',
    batchEvents: {
      maxSize: 50,
      timeout: '180s',
    },
    retries: 2,
    concurrency: { limit: 1 },
  },
  { event: 'mattermost/notification.queued' },
  async ({ events }) => {
    // Group events by category
    const grouped = new Map<AlertCategory, Array<{ icon: string; title: string; lines: string[] }>>();

    for (const evt of events) {
      const { category, icon, title, lines } = evt.data;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push({ icon, title, lines });
    }

    const mm = getMattermostNotificationService();
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    let totalPosted = 0;

    for (const [category, items] of grouped) {
      const label = CATEGORY_LABELS[category];
      const header = `### :bell: ${items.length} ${label}\n\n`;

      const body = items
        .map((item) => {
          const detail = item.lines.length > 0 ? ` — ${item.lines.join(' · ')}` : '';
          return `${item.icon} **${item.title}**${detail}`;
        })
        .join('\n');

      const footer = `\n\n_${timestamp} · ${items.length} event${items.length > 1 ? 's' : ''} batched_`;
      const message = header + body + footer;

      await mm.postDigest(category, message);
      totalPosted++;
    }

    return { categoriesPosted: totalPosted, totalEvents: events.length };
  }
);
