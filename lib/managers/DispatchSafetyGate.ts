/**
 * DispatchSafetyGate
 *
 * Pre-dispatch validation that prevents non-compliant driver assignments.
 *
 * Feature 4: Risk-based dispatch rules
 *   - Block high-risk drivers (>70) from hazmat loads
 *   - Block high-risk drivers (>80) from oversized/overweight loads
 *   - Warn for drivers with risk score >60
 *
 * Feature 5: HOS compliance check
 *   - 11-hour driving limit, 14-hour on-duty limit, 70-hour weekly limit
 *   - Block if insufficient hours, warn if tight
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/errors/AppError';
import { DriverRiskScoreManager } from './DriverRiskScoreManager';

export interface SafetyGateResult {
  allowed: boolean;
  warnings: string[];
  blocks: string[];
  riskScore?: number;
  riskLevel?: string;
  hosRemaining?: HOSRemaining;
}

export interface HOSRemaining {
  dailyDrivingRemaining: number;  // hours
  dailyOnDutyRemaining: number;   // hours
  weeklyRemaining: number;        // hours
}

export interface HOSComplianceResult {
  compliant: boolean;
  warnings: string[];
  blocks: string[];
  remaining: HOSRemaining;
}

// HOS limits (FMCSA regulations)
const HOS_LIMITS = {
  DAILY_DRIVING: 11,   // 11-hour driving limit
  DAILY_ON_DUTY: 14,   // 14-hour on-duty window
  WEEKLY: 70,           // 70-hour/8-day limit
} as const;

const HOS_WARNING_THRESHOLD = 2; // Warn if fewer than 2 hours remain

export class DispatchSafetyGate {
  /**
   * Full pre-dispatch validation: risk score + HOS + compliance.
   */
  static async validateAssignment(
    driverId: string,
    loadId: string,
    estimatedTripHours?: number
  ): Promise<SafetyGateResult> {
    logger.info('Validating dispatch assignment', { driverId, loadId });

    const warnings: string[] = [];
    const blocks: string[] = [];

    // Fetch the load to check type
    const load = await prisma.load.findFirst({
      where: { id: loadId, deletedAt: null },
      select: {
        id: true, loadNumber: true, hazmat: true, hazmatClass: true,
        weight: true, commodity: true,
      },
    });

    if (!load) throw new NotFoundError('Load', loadId);

    // Fetch the driver
    const driver = await prisma.driver.findFirst({
      where: { id: driverId, deletedAt: null },
      select: {
        id: true, employeeStatus: true, companyId: true,
        licenseExpiry: true, medicalCardExpiry: true,
      },
    });

    if (!driver) throw new NotFoundError('Driver', driverId);

    // Block inactive drivers
    if (driver.employeeStatus !== 'ACTIVE') {
      blocks.push(`Driver is not active (status: ${driver.employeeStatus})`);
    }

    // Check license and medical card expiration
    const now = new Date();
    if (driver.licenseExpiry < now) {
      blocks.push('Driver CDL has expired');
    }
    if (driver.medicalCardExpiry < now) {
      blocks.push('Driver medical card has expired');
    }

    // Calculate risk score
    let riskScore = 0;
    let riskLevel = 'LOW';
    try {
      const riskResult = await DriverRiskScoreManager.calculateRiskScore(driverId);
      riskScore = riskResult.riskScore;
      riskLevel = riskResult.riskLevel;

      // Risk-based blocks
      if (load.hazmat && riskScore > 70) {
        blocks.push(
          `High-risk driver (score: ${riskScore}) cannot be assigned to hazmat loads (threshold: 70)`
        );
      }

      // Overweight is determined by weight > 80,000 lbs (standard US max gross weight)
      const isOversized = (load.weight ?? 0) > 80000;
      if (isOversized && riskScore > 80) {
        blocks.push(
          `High-risk driver (score: ${riskScore}) cannot be assigned to oversized/overweight loads (threshold: 80)`
        );
      }

      // General warning
      if (riskScore > 60) {
        warnings.push(
          `Driver has elevated risk score (${riskScore}). Review safety record before dispatch.`
        );
      }
    } catch (err) {
      logger.warn('Could not calculate risk score for dispatch gate', {
        driverId,
        error: err instanceof Error ? err.message : 'unknown',
      });
      warnings.push('Unable to calculate driver risk score. Proceed with caution.');
    }

    // HOS compliance check
    if (estimatedTripHours !== undefined && estimatedTripHours > 0) {
      const hosResult = await this.checkHOSCompliance(driverId, estimatedTripHours);
      warnings.push(...hosResult.warnings);
      blocks.push(...hosResult.blocks);
    }

    const allowed = blocks.length === 0;

    logger.info('Dispatch safety gate result', {
      driverId, loadId, allowed, blocksCount: blocks.length, warningsCount: warnings.length,
    });

    return {
      allowed,
      warnings,
      blocks,
      riskScore,
      riskLevel,
    };
  }

  /**
   * Check HOS compliance for a driver given estimated trip hours.
   */
  static async checkHOSCompliance(
    driverId: string,
    estimatedTripHours: number
  ): Promise<HOSComplianceResult> {
    const warnings: string[] = [];
    const blocks: string[] = [];

    // Get the latest HOS record
    const latestHOS = await prisma.hOSRecord.findFirst({
      where: { driverId },
      orderBy: { date: 'desc' },
      select: {
        driveTime: true,
        onDutyTime: true,
        weeklyDriveTime: true,
        weeklyOnDuty: true,
        date: true,
      },
    });

    // Default remaining hours (fresh driver with no records)
    let remaining: HOSRemaining = {
      dailyDrivingRemaining: HOS_LIMITS.DAILY_DRIVING,
      dailyOnDutyRemaining: HOS_LIMITS.DAILY_ON_DUTY,
      weeklyRemaining: HOS_LIMITS.WEEKLY,
    };

    if (latestHOS) {
      // Check if the record is from today (current duty cycle)
      const recordDate = new Date(latestHOS.date);
      const today = new Date();
      const isToday = recordDate.toDateString() === today.toDateString();

      if (isToday) {
        remaining = {
          dailyDrivingRemaining: Math.max(0, HOS_LIMITS.DAILY_DRIVING - latestHOS.driveTime),
          dailyOnDutyRemaining: Math.max(0, HOS_LIMITS.DAILY_ON_DUTY - latestHOS.onDutyTime),
          weeklyRemaining: Math.max(0, HOS_LIMITS.WEEKLY - latestHOS.weeklyOnDuty),
        };
      } else {
        // Previous day record — daily resets but weekly carries forward
        remaining = {
          dailyDrivingRemaining: HOS_LIMITS.DAILY_DRIVING,
          dailyOnDutyRemaining: HOS_LIMITS.DAILY_ON_DUTY,
          weeklyRemaining: Math.max(0, HOS_LIMITS.WEEKLY - latestHOS.weeklyOnDuty),
        };
      }
    }

    // Check daily driving limit
    if (estimatedTripHours > remaining.dailyDrivingRemaining) {
      blocks.push(
        `Insufficient daily driving hours: ${remaining.dailyDrivingRemaining.toFixed(1)}h remaining, ` +
        `trip requires ${estimatedTripHours}h (11-hour limit)`
      );
    } else if (remaining.dailyDrivingRemaining - estimatedTripHours < HOS_WARNING_THRESHOLD) {
      warnings.push(
        `Tight on daily driving hours: ${remaining.dailyDrivingRemaining.toFixed(1)}h remaining after trip ` +
        `would leave ${(remaining.dailyDrivingRemaining - estimatedTripHours).toFixed(1)}h`
      );
    }

    // Check daily on-duty limit
    if (estimatedTripHours > remaining.dailyOnDutyRemaining) {
      blocks.push(
        `Insufficient on-duty hours: ${remaining.dailyOnDutyRemaining.toFixed(1)}h remaining, ` +
        `trip requires ${estimatedTripHours}h (14-hour limit)`
      );
    } else if (remaining.dailyOnDutyRemaining - estimatedTripHours < HOS_WARNING_THRESHOLD) {
      warnings.push(
        `Tight on on-duty hours: ${remaining.dailyOnDutyRemaining.toFixed(1)}h remaining`
      );
    }

    // Check weekly limit
    if (estimatedTripHours > remaining.weeklyRemaining) {
      blocks.push(
        `Insufficient weekly hours: ${remaining.weeklyRemaining.toFixed(1)}h remaining of 70-hour/8-day limit`
      );
    } else if (remaining.weeklyRemaining - estimatedTripHours < HOS_WARNING_THRESHOLD * 2) {
      warnings.push(
        `Approaching weekly HOS limit: ${remaining.weeklyRemaining.toFixed(1)}h remaining of 70-hour limit`
      );
    }

    return {
      compliant: blocks.length === 0,
      warnings,
      blocks,
      remaining,
    };
  }
}
