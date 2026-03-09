/**
 * Notification Helpers
 *
 * Shared utilities for creating notifications and notifying users by role.
 */

import { prisma } from '../prisma';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { sendNotificationEmail } from './email';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  link?: string;
}

/** Create an in-app notification with priority support */
export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      priority: params.priority || 'INFO',
      title: params.title,
      message: params.message,
      link: params.link || null,
    },
  });
}

interface NotifyByRoleParams {
  companyId: string;
  roles: ('SUPER_ADMIN' | 'ADMIN' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER' | 'ACCOUNTANT' | 'HR' | 'SAFETY' | 'FLEET')[];
  excludeUserId?: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  link?: string;
}

/** Notify all users with given roles in a company */
export async function notifyUsersByRole(params: NotifyByRoleParams) {
  const users = await prisma.user.findMany({
    where: {
      companyId: params.companyId,
      role: { in: params.roles },
      ...(params.excludeUserId ? { id: { not: params.excludeUserId } } : {}),
      deletedAt: null,
    },
    select: { id: true },
  });

  await Promise.all(
    users.map((user) =>
      createNotification({
        userId: user.id,
        type: params.type,
        priority: params.priority,
        title: params.title,
        message: params.message,
        link: params.link,
      })
    )
  );

  return users;
}

/** Send email + create in-app notification */
export async function notifyWithEmail(params: CreateNotificationParams & {
  emailOptions: { subject: string; html: string; text?: string };
}) {
  await sendNotificationEmail(params.userId, params.type, params.emailOptions);
  await createNotification(params);
}
