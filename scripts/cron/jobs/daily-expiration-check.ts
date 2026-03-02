import { prisma } from '@/lib/prisma';
import { ExpirationTrackingService } from '@/lib/services/safety/ExpirationTrackingService';

/**
 * Daily job to check for expiring documents and create alerts
 * Called by Inngest daily-automation cron function
 */
export async function dailyExpirationCheck() {
  try {
    console.log('Starting daily expiration check...');

    // Get all active companies
    const companies = await prisma.company.findMany({
      where: { isActive: true }
    });

    let totalAlerts = 0;

    for (const company of companies) {
      try {
        const expirationService = new ExpirationTrackingService(prisma, company.id);
        const result = await expirationService.checkExpirations(company.id);
        totalAlerts += result.alertsCreated || 0;
        console.log(`Company ${company.name}: Created ${result.alertsCreated} alerts`);
      } catch (error) {
        console.error(`Error processing company ${company.id}:`, error);
      }
    }

    console.log(`Daily expiration check completed. Total alerts created: ${totalAlerts}`);
    return { success: true, alertsCreated: totalAlerts };
  } catch (error) {
    console.error('Error in daily expiration check:', error);
    throw error;
  }
}

// Run if called directly (standalone script mode)
if (require.main === module) {
  const { PrismaClient } = require('@prisma/client');
  const standalone = new PrismaClient();
  dailyExpirationCheck()
    .then(() => standalone.$disconnect())
    .then(() => process.exit(0))
    .catch((error: Error) => {
      console.error(error);
      standalone.$disconnect().then(() => process.exit(1));
    });
}
