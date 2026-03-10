/**
 * TelegramNotificationService
 * 
 * Orchestrates automated notifications for the fleet:
 * - Breakdown alerts to dispatchers
 * - Automated geofence entry/exit messages
 * - Safety score alerts
 * - Payment/Settlement notifications
 */

import { getTelegramService } from './TelegramService';
import { prisma } from '@/lib/prisma';
import { resolveTelegramScope, buildTelegramScopeWhere } from './telegram/TelegramScopeResolver';

export class TelegramNotificationService {
    constructor(
        private companyId: string,
        private mcNumberId: string | null = null
    ) {}

    private async getServiceAndSettings() {
        const scope = await resolveTelegramScope(this.companyId, this.mcNumberId);
        const telegram = getTelegramService(scope);
        if (!telegram.isClientConnected()) return null;
        const settings = await prisma.telegramSettings.findFirst({
            where: buildTelegramScopeWhere(scope),
        });
        if (!settings?.adminChatId) return null;
        return { telegram, adminChatId: settings.adminChatId };
    }

    async notifyBreakdown(breakdown: {
        id: string;
        truckNumber: string;
        driverName: string;
        description: string;
        locationLabel?: string;
    }): Promise<void> {
        const ctx = await this.getServiceAndSettings();
        if (!ctx) return;

        const message = `🚨 *NEW BREAKDOWN REPORTED*\n\n` +
            `*Truck:* ${breakdown.truckNumber}\n` +
            `*Driver:* ${breakdown.driverName}\n` +
            `*Location:* ${breakdown.locationLabel || 'Unknown'}\n\n` +
            `*Description:* ${breakdown.description}\n\n` +
            `[View in Dashboard](https://tms.adrijus.com/dashboard/fleet/breakdowns/${breakdown.id})`;

        await ctx.telegram.sendMessage(ctx.adminChatId, message, { parseMode: 'markdown' });
    }

    async notifyDetentionStart(load: {
        loadNumber: string;
        location: string;
        driverName: string;
    }): Promise<void> {
        const ctx = await this.getServiceAndSettings();
        if (!ctx) return;

        const message = `🕒 *DETENTION AUTOMATION*\n\n` +
            `Load *#${load.loadNumber}* has entered geofence at *${load.location}*.\n` +
            `Driver *${load.driverName}* is now on the clock.\n\n` +
            `_Automated status: AT PICKUP/DELIVERY_`;

        await ctx.telegram.sendMessage(ctx.adminChatId, message, { parseMode: 'markdown' });
    }

    async notifySafetyCritical(truck: {
        truckNumber: string;
        score: number;
        reason: string;
    }): Promise<void> {
        const ctx = await this.getServiceAndSettings();
        if (!ctx) return;

        const message = `⚠️ *SAFETY CRITICAL ALERT*\n\n` +
            `Truck *${truck.truckNumber}* safety score dropped to *${truck.score}*.\n` +
            `*Reason:* ${truck.reason}\n\n` +
            `Immediate intervention recommended.`;

        await ctx.telegram.sendMessage(ctx.adminChatId, message, { parseMode: 'markdown' });
    }

    async notifyFuelTheft(alert: {
        truckNumber: string;
        driverName: string;
        location: string;
        distance: number;
    }): Promise<void> {
        const ctx = await this.getServiceAndSettings();
        if (!ctx) return;

        const message = `🚨 *CRITICAL FUEL THEFT ALERT*\n\n` +
            `*Truck:* ${alert.truckNumber}\n` +
            `*Driver:* ${alert.driverName}\n` +
            `*Location:* ${alert.location}\n` +
            `*GPS Gap:* ${alert.distance.toFixed(1)}km\n\n` +
            `The fuel transaction occurred significantly far from the truck's actual GPS location.`;

        await ctx.telegram.sendMessage(ctx.adminChatId, message, { parseMode: 'markdown' });
    }
}

export function getTelegramNotificationService(
    companyId: string,
    mcNumberId: string | null = null
): TelegramNotificationService {
    return new TelegramNotificationService(companyId, mcNumberId);
}
