import { prisma } from '@/lib/prisma';
import { AlertService } from '@/lib/services/safety/AlertService';

/**
 * Daily job to check for HOS violations and create alerts
 * Called by Inngest daily-automation cron function
 */
export async function dailyHOSViolationCheck() {
  try {
    console.log('Starting daily HOS violation check...');

    // Get all active companies
    const companies = await prisma.company.findMany({
      where: { isActive: true }
    });

    let totalAlerts = 0;

    for (const company of companies) {
      try {
        const alertService = new AlertService(prisma, company.id);
        // Check for recent HOS violations (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const violations = await prisma.hOSViolation.findMany({
          where: {
            companyId: company.id,
            violationDate: {
              gte: yesterday
            }
          },
          include: {
            driver: {
              include: {
                user: true
              }
            }
          }
        });

        for (const violation of violations) {
          const driverName = violation.driver?.user ? `${violation.driver.user.firstName} ${violation.driver.user.lastName}` : 'Unknown';
          await alertService.createAlert({
            companyId: company.id,
            alertType: 'HOS_VIOLATION',
            severity: 'HIGH',
            title: `HOS Violation: ${driverName}`,
            message: `${violation.violationType}: ${violation.violationDescription}`,
            relatedEntityType: 'driver',
            relatedEntityId: violation.driverId
          });
          totalAlerts++;
        }
      } catch (error) {
        console.error(`Error processing company ${company.id}:`, error);
      }
    }

    console.log(`Daily HOS violation check completed. Total alerts created: ${totalAlerts}`);
    return { success: true, alertsCreated: totalAlerts };
  } catch (error) {
    console.error('Error in daily HOS violation check:', error);
    throw error;
  }
}

// Run if called directly (standalone script mode)
if (require.main === module) {
  const { PrismaClient } = require('@prisma/client');
  const standalone = new PrismaClient();
  dailyHOSViolationCheck()
    .then(() => standalone.$disconnect())
    .then(() => process.exit(0))
    .catch((error: Error) => {
      console.error(error);
      standalone.$disconnect().then(() => process.exit(1));
    });
}
