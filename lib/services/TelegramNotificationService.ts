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

export class TelegramNotificationService {
    /**
     * Notify dispatchers about a new breakdown
     */
    async notifyBreakdown(breakdown: {
        id: string;
        truckNumber: string;
        driverName: string;
        description: string;
        locationLabel?: string;
    }): Promise<void> {
        const telegram = getTelegramService();
        if (!telegram.isClientConnected()) return;

        // Find all dispatchers for this company
        // In a real scenario, we might have a specific Telegram Group for dispatch
        const message = `🚨 *NEW BREAKDOWN REPORTED*\n\n` +
            `*Truck:* ${breakdown.truckNumber}\n` +
            `*Driver:* ${breakdown.driverName}\n` +
            `*Location:* ${breakdown.locationLabel || 'Unknown'}\n\n` +
            `*Description:* ${breakdown.description}\n\n` +
            `[View in Dashboard](https://tms.adrijus.com/dashboard/fleet/breakdowns/${breakdown.id})`;

        // For now, send to the connected admin account (who likely manages dispatch)
        // In the future, this would fetch 'Dispatcher' roles' Telegram IDs
        const settings = await prisma.telegramSettings.findFirst();
        if (settings?.adminChatId) {
            await telegram.sendMessage(settings.adminChatId, message, { parseMode: 'markdown' });
        }
    }

    /**
     * Automated Detention Alert
     */
    async notifyDetentionStart(load: {
        loadNumber: string;
        location: string;
        driverName: string;
    }): Promise<void> {
        const telegram = getTelegramService();
        if (!telegram.isClientConnected()) return;

        const message = `🕒 *DETENTION AUTOMATION*\n\n` +
            `Load *#${load.loadNumber}* has entered geofence at *${load.location}*.\n` +
            `Driver *${load.driverName}* is now on the clock.\n\n` +
            `_Automated status: AT PICKUP/DELIVERY_`;

        const settings = await prisma.telegramSettings.findFirst();
        if (settings?.adminChatId) {
            await telegram.sendMessage(settings.adminChatId, message, { parseMode: 'markdown' });
        }
    }

    /**
     * Safety Score Drop Notification
     */
    async notifySafetyCritical(truck: {
        truckNumber: string;
        score: number;
        reason: string;
    }): Promise<void> {
        const telegram = getTelegramService();
        if (!telegram.isClientConnected()) return;

        const message = `⚠️ *SAFETY CRITICAL ALERT*\n\n` +
            `Truck *${truck.truckNumber}* safety score dropped to *${truck.score}*.\n` +
            `*Reason:* ${truck.reason}\n\n` +
            `Immediate intervention recommended.`;

        const settings = await prisma.telegramSettings.findFirst();
        if (settings?.adminChatId) {
            await telegram.sendMessage(settings.adminChatId, message, { parseMode: 'markdown' });
        }
    }

    /**
     * Fuel Theft Alert
     */
    async notifyFuelTheft(alert: {
        truckNumber: string;
        driverName: string;
        location: string;
        distance: number;
    }): Promise<void> {
        const telegram = getTelegramService();
        if (!telegram.isClientConnected()) return;

        const message = `🚨 *CRITICAL FUEL THEFT ALERT*\n\n` +
            `*Truck:* ${alert.truckNumber}\n` +
            `*Driver:* ${alert.driverName}\n` +
            `*Location:* ${alert.location}\n` +
            `*GPS Gap:* ${alert.distance.toFixed(1)}km\n\n` +
            `The fuel transaction occurred significantly far from the truck's actual GPS location.`;

        const settings = await prisma.telegramSettings.findFirst();
        if (settings?.adminChatId) {
            await telegram.sendMessage(settings.adminChatId, message, { parseMode: 'markdown' });
        }
    }
}

// Singleton helper
let instance: TelegramNotificationService | null = null;
export function getTelegramNotificationService(): TelegramNotificationService {
    if (!instance) {
        instance = new TelegramNotificationService();
    }
    return instance;
}
