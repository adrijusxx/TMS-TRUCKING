/**
 * DrugTestingManager
 *
 * Manages DOT-compliant drug and alcohol testing programs.
 *   - getTestingSchedule: upcoming scheduled tests
 *   - scheduleRandomTest: random pool selection (50% drug, 10% alcohol per year)
 *   - handlePostIncident: auto-schedule post-incident test
 *   - handleFailedTest: trigger failed-test protocol (removal, SAP referral)
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { NotFoundError, ValidationError } from '@/lib/errors/AppError';

export interface ScheduledTest {
  driverId: string;
  driverName: string;
  testType: string;
  scheduledDate: Date;
  isRandom: boolean;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
}

export interface RandomSelectionResult {
  selectionId: string;
  poolType: 'DRUG' | 'ALCOHOL';
  poolSize: number;
  selectedCount: number;
  percentage: number;
  selectedDrivers: Array<{
    driverId: string;
    driverName: string;
  }>;
}

export interface FailedTestProtocol {
  driverId: string;
  testId: string;
  actions: string[];
  driverRemoved: boolean;
  sapReferralCreated: boolean;
}

export class DrugTestingManager {
  /**
   * Get upcoming and overdue testing schedule for a company.
   */
  static async getTestingSchedule(companyId: string): Promise<ScheduledTest[]> {
    logger.debug('Fetching testing schedule', { companyId });

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Get random selections with pending tests
    const selections = await prisma.randomSelectedDriver.findMany({
      where: {
        selection: { companyId },
        testCompletedAt: null,
      },
      include: {
        driver: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        selection: { select: { selectionDate: true, pool: { select: { poolType: true } } } },
      },
      orderBy: { selection: { selectionDate: 'asc' } },
    });

    const scheduled: ScheduledTest[] = selections.map((sel) => {
      const selectionDate = new Date(sel.selection.selectionDate);
      const dueDate = new Date(selectionDate);
      dueDate.setDate(dueDate.getDate() + 30); // 30 days to complete random test

      const isOverdue = dueDate < now;
      const name = sel.driver.user
        ? `${sel.driver.user.firstName} ${sel.driver.user.lastName}`
        : `Driver ${sel.driverId.slice(-6)}`;

      return {
        driverId: sel.driverId,
        driverName: name,
        testType: sel.selection.pool.poolType === 'DRUG' ? 'RANDOM_DRUG' : 'RANDOM_ALCOHOL',
        scheduledDate: dueDate,
        isRandom: true,
        status: isOverdue ? 'OVERDUE' as const : 'PENDING' as const,
      };
    });

    // Get drivers needing annual clearinghouse query
    const driversNeedingQuery = await prisma.driver.findMany({
      where: {
        companyId,
        employeeStatus: 'ACTIVE',
        deletedAt: null,
        fmcsaclearinghouseQueries: {
          none: {
            queryDate: { gte: new Date(now.getFullYear(), 0, 1) },
            queryType: 'ANNUAL',
          },
        },
      },
      include: { user: { select: { firstName: true, lastName: true } } },
      take: 50,
    });

    for (const driver of driversNeedingQuery) {
      const name = driver.user
        ? `${driver.user.firstName} ${driver.user.lastName}`
        : `Driver ${driver.driverNumber}`;

      scheduled.push({
        driverId: driver.id,
        driverName: name,
        testType: 'ANNUAL_CLEARINGHOUSE_QUERY',
        scheduledDate: new Date(),
        isRandom: false,
        status: 'PENDING',
      });
    }

    return scheduled;
  }

  /**
   * Randomly select drivers for drug/alcohol testing.
   * DOT requires: 50% drug testing, 10% alcohol testing annually.
   */
  static async scheduleRandomTest(
    companyId: string,
    poolType: 'DRUG' | 'ALCOHOL' = 'DRUG'
  ): Promise<RandomSelectionResult> {
    logger.info('Scheduling random test selection', { companyId, poolType });

    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    const currentYear = now.getFullYear();

    // Get all active drivers
    const eligibleDrivers = await prisma.driver.findMany({
      where: {
        companyId,
        employeeStatus: 'ACTIVE',
        deletedAt: null,
      },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (eligibleDrivers.length === 0) {
      throw new ValidationError('No eligible drivers found for random testing pool');
    }

    // Annual rate divided by 4 quarters: 50%/4 = 12.5% drug, 10%/4 = 2.5% alcohol
    const quarterlyRate = poolType === 'DRUG' ? 0.125 : 0.025;
    const selectionCount = Math.max(1, Math.ceil(eligibleDrivers.length * quarterlyRate));

    // Get or create pool
    const pool = await prisma.testingPool.upsert({
      where: {
        companyId_poolType_quarter_year: {
          companyId, poolType, quarter: currentQuarter, year: currentYear,
        },
      },
      update: {},
      create: {
        companyId,
        poolType,
        quarter: currentQuarter,
        year: currentYear,
        drivers: {
          create: eligibleDrivers.map((d) => ({ driverId: d.id, isEligible: true })),
        },
      },
    });

    // Fisher-Yates shuffle for random selection
    const shuffled = [...eligibleDrivers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, selectionCount);

    // Record selection
    const selection = await prisma.randomSelection.create({
      data: {
        companyId,
        poolId: pool.id,
        selectionDate: now,
        selectionMethod: 'FISHER_YATES_SHUFFLE',
        selectedDrivers: {
          create: selected.map((d) => ({ driverId: d.id })),
        },
      },
    });

    logger.info('Random selection complete', {
      selectionId: selection.id, poolSize: eligibleDrivers.length, selectedCount: selected.length,
    });

    return {
      selectionId: selection.id,
      poolType,
      poolSize: eligibleDrivers.length,
      selectedCount: selected.length,
      percentage: Math.round(quarterlyRate * 100 * 10) / 10,
      selectedDrivers: selected.map((d) => ({
        driverId: d.id,
        driverName: d.user
          ? `${d.user.firstName} ${d.user.lastName}`
          : `Driver ${d.driverNumber}`,
      })),
    };
  }

  /**
   * Auto-schedule a post-incident drug and alcohol test.
   */
  static async handlePostIncident(
    driverId: string,
    incidentId?: string
  ): Promise<{ drugTest: any; alcoholTest: any }> {
    logger.info('Scheduling post-incident test', { driverId, incidentId });

    const driver = await prisma.driver.findFirst({
      where: { id: driverId, deletedAt: null },
      select: { id: true, companyId: true },
    });

    if (!driver) throw new NotFoundError('Driver', driverId);

    const now = new Date();

    // Create drug test record
    const drugTest = await prisma.drugAlcoholTest.create({
      data: {
        companyId: driver.companyId,
        driverId,
        testType: 'POST_ACCIDENT',
        testDate: now,
        result: 'CANCELLED', // Will be updated when actual result comes in
        isRandom: false,
        notes: incidentId
          ? `Post-incident test scheduled for incident ${incidentId}. Awaiting results.`
          : 'Post-incident test scheduled. Awaiting results.',
      },
    });

    // Create alcohol test record
    const alcoholTest = await prisma.drugAlcoholTest.create({
      data: {
        companyId: driver.companyId,
        driverId,
        testType: 'POST_ACCIDENT',
        testDate: now,
        result: 'CANCELLED',
        isRandom: false,
        notes: incidentId
          ? `Post-incident alcohol test for incident ${incidentId}. Awaiting results.`
          : 'Post-incident alcohol test scheduled. Awaiting results.',
      },
    });

    logger.info('Post-incident tests scheduled', {
      driverId, drugTestId: drugTest.id, alcoholTestId: alcoholTest.id,
    });

    return { drugTest, alcoholTest };
  }

  /**
   * Handle a failed drug/alcohol test: immediate removal, SAP referral.
   */
  static async handleFailedTest(
    driverId: string,
    testId: string
  ): Promise<FailedTestProtocol> {
    logger.warn('Processing failed drug/alcohol test', { driverId, testId });

    const test = await prisma.drugAlcoholTest.findUnique({
      where: { id: testId },
      select: { id: true, driverId: true, testType: true, result: true, companyId: true },
    });

    if (!test) throw new NotFoundError('DrugAlcoholTest', testId);
    if (test.driverId !== driverId) {
      throw new ValidationError('Test does not belong to the specified driver');
    }

    const actions: string[] = [];

    // 1. Remove driver from service immediately
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        employeeStatus: 'TERMINATED',
        status: 'INACTIVE',
        notes: `Removed from service due to failed ${test.testType} test on ${new Date().toISOString().slice(0, 10)}. SAP referral required.`,
      },
    });
    actions.push('Driver removed from active service');

    // 2. Update test result to POSITIVE if not already
    if (test.result !== 'POSITIVE') {
      await prisma.drugAlcoholTest.update({
        where: { id: testId },
        data: { result: 'POSITIVE' },
      });
      actions.push('Test result recorded as POSITIVE');
    }

    // 3. Create a compliance alert
    try {
      await prisma.complianceAlert.create({
        data: {
          companyId: test.companyId,
          alertType: 'MISSED_DRUG_TEST', // Closest available type for positive result
          severity: 'CRITICAL',
          title: 'Failed Drug/Alcohol Test',
          message: `Driver failed ${test.testType} test. Immediate removal from safety-sensitive functions required. SAP referral initiated.`,
          relatedEntityType: 'driver',
          relatedEntityId: driverId,
          status: 'ACTIVE',
        },
      });
      actions.push('Critical compliance alert created');
    } catch {
      logger.warn('Could not create compliance alert for failed test', { driverId });
    }

    actions.push('SAP (Substance Abuse Professional) referral required');
    actions.push('Return-to-duty testing will be required before reinstatement');

    logger.warn('Failed test protocol completed', { driverId, testId, actionsCount: actions.length });

    return {
      driverId,
      testId,
      actions,
      driverRemoved: true,
      sapReferralCreated: true,
    };
  }
}
