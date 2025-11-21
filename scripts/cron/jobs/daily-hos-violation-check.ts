import { PrismaClient } from '@prisma/client';
import { AlertService } from '@/lib/services/safety/AlertService';

const prisma = new PrismaClient();

/**
 * Daily job to check for HOS violations and create alerts
 * Runs every day at 5:00 AM
 */
export async function dailyHOSViolationCheck() {
  try {
    console.log('Starting daily HOS violation check...');

    const alertService = new AlertService(prisma, '', undefined);

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
          await alertService.createAlert({
            companyId: company.id,
            alertType: 'HOS_VIOLATION',
            severity: 'HIGH',
            title: `HOS Violation: ${violation.driver.user.firstName} ${violation.driver.user.lastName}`,
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
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  dailyHOSViolationCheck()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

