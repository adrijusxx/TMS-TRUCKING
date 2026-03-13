/**
 * Trial Expiration Check
 *
 * Daily cron that:
 * 1. Downgrades expired trials to free tier
 * 2. Sends reminder emails before expiry (3 days, 1 day)
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/services/EmailService';
import { FREE_TIER_LIMITS } from '@/lib/config/subscription-plans';
import { APP_NAME, PRODUCT_PRO_TIER } from '@/lib/config/branding';

export const checkTrialExpiration = inngest.createFunction(
    {
        id: 'check-trial-expiration',
        name: 'Check Trial Expiration (Daily)',
        concurrency: { limit: 1 },
        retries: 2,
    },
    { cron: '0 6 * * *' }, // 6 AM UTC daily
    async ({ step, logger }) => {
        const now = new Date();

        // Step 1: Downgrade expired trials
        const expired = await step.run('downgrade-expired-trials', async () => {
            const expiredCompanies = await prisma.company.findMany({
                where: {
                    subscriptionStatus: 'TRIALING',
                    trialEndsAt: { lt: now },
                },
                select: { id: true, email: true, name: true },
            });

            for (const company of expiredCompanies) {
                await prisma.company.update({
                    where: { id: company.id },
                    data: {
                        subscriptionStatus: 'FREE',
                        truckLimit: FREE_TIER_LIMITS.trucksLimit ?? 3,
                    },
                });

                await prisma.subscription.updateMany({
                    where: { companyId: company.id, status: 'TRIALING' },
                    data: {
                        status: 'FREE',
                        planId: 'starter-free',
                        usageBased: true,
                        ...FREE_TIER_LIMITS,
                    },
                });
            }

            return expiredCompanies;
        });

        // Step 2: Send expiration emails
        await step.run('send-expiration-emails', async () => {
            for (const company of expired) {
                if (!company.email) continue;
                try {
                    await EmailService.sendEmail({
                        to: company.email,
                        subject: `Your ${PRODUCT_PRO_TIER} trial has ended`,
                        html: trialExpiredHtml(company.name),
                    });
                } catch (e) {
                    logger.warn(`Failed to send trial expired email to ${company.email}`);
                }
            }
        });

        // Step 3: Send 3-day reminder
        const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const reminders3d = await step.run('send-3day-reminders', async () => {
            const companies = await prisma.company.findMany({
                where: {
                    subscriptionStatus: 'TRIALING',
                    trialEndsAt: {
                        gte: new Date(threeDays.getTime() - 12 * 60 * 60 * 1000),
                        lt: new Date(threeDays.getTime() + 12 * 60 * 60 * 1000),
                    },
                },
                select: { email: true, name: true },
            });

            for (const company of companies) {
                if (!company.email) continue;
                try {
                    await EmailService.sendEmail({
                        to: company.email,
                        subject: `Your ${PRODUCT_PRO_TIER} trial ends in 3 days`,
                        html: trialReminderHtml(company.name, 3),
                    });
                } catch { /* logged by EmailService */ }
            }

            return companies.length;
        });

        // Step 4: Send 1-day reminder
        const oneDay = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
        const reminders1d = await step.run('send-1day-reminders', async () => {
            const companies = await prisma.company.findMany({
                where: {
                    subscriptionStatus: 'TRIALING',
                    trialEndsAt: {
                        gte: new Date(oneDay.getTime() - 12 * 60 * 60 * 1000),
                        lt: new Date(oneDay.getTime() + 12 * 60 * 60 * 1000),
                    },
                },
                select: { email: true, name: true },
            });

            for (const company of companies) {
                if (!company.email) continue;
                try {
                    await EmailService.sendEmail({
                        to: company.email,
                        subject: `Last day of your ${PRODUCT_PRO_TIER} trial!`,
                        html: trialReminderHtml(company.name, 1),
                    });
                } catch { /* logged by EmailService */ }
            }

            return companies.length;
        });

        logger.info(
            `Trial check complete: ${expired.length} expired, ${reminders3d} 3-day reminders, ${reminders1d} 1-day reminders`
        );

        return { expired: expired.length, reminders3d, reminders1d };
    }
);

// ============================================
// EMAIL TEMPLATES
// ============================================

function trialReminderHtml(companyName: string, daysLeft: number): string {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hi ${companyName},</h2>
      <p>Your <strong>${PRODUCT_PRO_TIER} trial</strong> ends in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>.</p>
      <p>After the trial, you'll be moved to the Free plan (3 trucks, limited usage). Upgrade to Pro to keep unlimited access:</p>
      <ul>
        <li>Unlimited trucks, drivers, loads & documents</li>
        <li>Just <strong>$15/truck/month</strong></li>
      </ul>
      <a href="${process.env.NEXTAUTH_URL}/dashboard/settings/billing"
         style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
        Upgrade Now
      </a>
      <p style="margin-top:24px;color:#6b7280;font-size:14px;">— The ${APP_NAME} Team</p>
    </div>`;
}

function trialExpiredHtml(companyName: string): string {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hi ${companyName},</h2>
      <p>Your <strong>${PRODUCT_PRO_TIER} trial</strong> has ended. You've been moved to the <strong>Free plan</strong>.</p>
      <p>Your Free plan includes:</p>
      <ul>
        <li>Up to 3 trucks and 5 drivers</li>
        <li>25 loads, 10 invoices, 5 settlements per month</li>
        <li>All core modules (Fleet, Accounting, Safety, HR, Integrations)</li>
      </ul>
      <p>Need unlimited access? Upgrade to Pro for just <strong>$15/truck/month</strong>:</p>
      <a href="${process.env.NEXTAUTH_URL}/dashboard/settings/billing"
         style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
        Upgrade to Pro
      </a>
      <p style="margin-top:24px;color:#6b7280;font-size:14px;">— The ${APP_NAME} Team</p>
    </div>`;
}
