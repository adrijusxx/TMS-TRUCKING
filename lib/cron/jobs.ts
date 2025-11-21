/**
 * Cron Job Utilities
 * 
 * Helper functions for scheduled automated tasks
 * These can be called by external cron services (Vercel Cron, GitHub Actions, etc.)
 */

import { prisma } from '../prisma';
import { autoUpdateLoadStatuses } from '../automation/load-status';
import { checkAllDocumentExpiries } from '../automation/document-expiry';
import { LoadStatus } from '@prisma/client';
import { dailyExpirationCheck } from '../../scripts/cron/jobs/daily-expiration-check';
import { dailyHOSViolationCheck } from '../../scripts/cron/jobs/daily-hos-violation-check';

/**
 * Run all daily automation tasks
 * Should be called once per day (e.g., at 2 AM)
 */
export async function runDailyAutomationTasks() {
  const results = {
    loadStatusUpdates: { updated: 0, errors: [] as string[] },
    documentExpiryChecks: { checked: 0, expiring: 0, errors: [] as string[] },
  };

  try {
    // Get all active companies
    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Run automation tasks for each company
    for (const company of companies) {
      try {
        // Update load statuses
        const loadStatusResult = await autoUpdateLoadStatuses(company.id);
        results.loadStatusUpdates.updated += loadStatusResult.updated;

        // Check document expiries
        const documentResult = await checkAllDocumentExpiries(company.id, 30);
        results.documentExpiryChecks.checked += documentResult.totalChecked;
        results.documentExpiryChecks.expiring += documentResult.totalExpiring;
      } catch (error) {
        const errorMsg = `Error processing company ${company.name} (${company.id}): ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.loadStatusUpdates.errors.push(errorMsg);
        results.documentExpiryChecks.errors.push(errorMsg);
      }
    }

    // Run safety expiration checks
    try {
      const safetyExpirationResult = await dailyExpirationCheck();
      results.documentExpiryChecks.checked += safetyExpirationResult.alertsCreated || 0;
    } catch (error) {
      const errorMsg = `Error in safety expiration check: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.documentExpiryChecks.errors.push(errorMsg);
    }

    // Run HOS violation checks
    try {
      await dailyHOSViolationCheck();
    } catch (error) {
      const errorMsg = `Error in HOS violation check: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.documentExpiryChecks.errors.push(errorMsg);
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      results,
    };
  } catch (error) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      results,
    };
  }
}

/**
 * Run hourly automation tasks
 * Should be called once per hour
 */
export async function runHourlyAutomationTasks() {
  const results = {
    loadStatusUpdates: { updated: 0, errors: [] as string[] },
  };

  try {
    // Get all active companies
    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Run load status updates for each company (more frequent than daily)
    for (const company of companies) {
      try {
        const loadStatusResult = await autoUpdateLoadStatuses(company.id);
        results.loadStatusUpdates.updated += loadStatusResult.updated;
      } catch (error) {
        const errorMsg = `Error processing company ${company.name} (${company.id}): ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.loadStatusUpdates.errors.push(errorMsg);
      }
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      results,
    };
  } catch (error) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      results,
    };
  }
}

/**
 * Run weekly automation tasks
 * Should be called once per week (e.g., Sunday at 3 AM)
 */
export async function runWeeklyAutomationTasks() {
  const results = {
    documentExpiryChecks: { checked: 0, expiring: 0, errors: [] as string[] },
  };

  try {
    // Get all active companies
    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Run document expiry checks for each company (60 days ahead for weekly check)
    for (const company of companies) {
      try {
        const documentResult = await checkAllDocumentExpiries(company.id, 60);
        results.documentExpiryChecks.checked += documentResult.totalChecked;
        results.documentExpiryChecks.expiring += documentResult.totalExpiring;
      } catch (error) {
        const errorMsg = `Error processing company ${company.name} (${company.id}): ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.documentExpiryChecks.errors.push(errorMsg);
      }
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      results,
    };
  } catch (error) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      results,
    };
  }
}

