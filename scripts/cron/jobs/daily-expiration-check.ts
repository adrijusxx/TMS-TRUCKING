import { PrismaClient } from '@prisma/client';
import { ExpirationTrackingService } from '@/lib/services/safety/ExpirationTrackingService';

const prisma = new PrismaClient();

/**
 * Daily job to check for expiring documents and create alerts
 * Runs every day at 6:00 AM
 */
export async function dailyExpirationCheck() {
  try {
    console.log('Starting daily expiration check...');

    const expirationService = new ExpirationTrackingService(prisma);

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
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  dailyExpirationCheck()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

