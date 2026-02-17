/**
 * DriverAdvanceManager
 * 
 * Handles driver advance requests, approvals, and tracking for settlement deductions.
 */

import { prisma } from '@/lib/prisma';

interface AdvanceRequest {
  driverId: string;
  amount: number;
  loadId?: string;
  notes?: string;
}

interface AdvanceApproval {
  advanceId: string;
  approverId: string;
  approved: boolean;
  rejectionReason?: string;
  paymentMethod?: string;
  paymentReference?: string;
}

export class DriverAdvanceManager {
  /**
   * Request a cash advance for a driver
   */
  async requestAdvance(request: AdvanceRequest): Promise<any> {
    // Check driver advance limit
    const driver = await prisma.driver.findUnique({
      where: {
        id: request.driverId,
        deletedAt: null
      },
      select: {
        advanceLimit: true,
        escrowBalance: true,
      },
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    // Get outstanding advances
    const outstandingBalance = await this.getDriverAdvanceBalance(
      request.driverId
    );

    if (outstandingBalance + request.amount > driver.advanceLimit) {
      throw new Error(
        `Advance request exceeds limit. Outstanding: $${outstandingBalance}, Limit: $${driver.advanceLimit}`
      );
    }

    // Check load if provided
    if (request.loadId) {
      const load = await prisma.load.findUnique({
        where: { id: request.loadId, deletedAt: null },
      });
      if (!load) throw new Error('Load not found');
    }

    // Create advance request
    const advance = await prisma.driverAdvance.create({
      data: {
        driverId: request.driverId,
        amount: request.amount,
        loadId: request.loadId,
        notes: request.notes,
        approvalStatus: 'PENDING',
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        load: {
          select: {
            loadNumber: true,
          },
        },
      },
    });

    return advance;
  }

  /**
   * Approve or reject an advance request
   */
  async approveAdvance(approval: AdvanceApproval): Promise<any> {
    const advance = await prisma.driverAdvance.findUnique({
      where: { id: approval.advanceId },
    });

    if (!advance) {
      throw new Error('Advance request not found');
    }

    if (advance.approvalStatus !== 'PENDING') {
      throw new Error('Advance has already been processed');
    }

    const updateData: any = {
      approvalStatus: approval.approved ? 'APPROVED' : 'REJECTED',
      approvedById: approval.approverId,
      approvedAt: new Date(),
    };

    if (approval.approved) {
      updateData.paymentMethod = approval.paymentMethod;
      updateData.paymentReference = approval.paymentReference;
      updateData.paidAt = new Date();
    } else {
      updateData.rejectionReason = approval.rejectionReason;
    }

    const updatedAdvance = await prisma.driverAdvance.update({
      where: { id: approval.advanceId },
      data: updateData,
      include: {
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return updatedAdvance;
  }

  /**
   * Get outstanding advance balance for a driver
   */
  async getDriverAdvanceBalance(driverId: string): Promise<number> {
    const advances = await prisma.driverAdvance.findMany({
      where: {
        driverId,
        approvalStatus: 'APPROVED',
        deductedAt: null, // Not yet deducted from settlement
      },
    });

    return advances.reduce((sum, adv) => sum + adv.amount, 0);
  }

  /**
   * Get advances for settlement period
   */
  async getAdvancesForSettlement(
    driverId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<any[]> {
    return await prisma.driverAdvance.findMany({
      where: {
        driverId,
        approvalStatus: 'APPROVED',
        paidAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        deductedAt: null,
      },
      orderBy: {
        paidAt: 'asc',
      },
    });
  }

  /**
   * Mark advances as deducted in settlement
   */
  async markAdvancesDeducted(
    advanceIds: string[],
    settlementId: string
  ): Promise<void> {
    await prisma.driverAdvance.updateMany({
      where: {
        id: {
          in: advanceIds,
        },
      },
      data: {
        deductedAt: new Date(),
        settlementId,
      },
    });
  }

  /**
   * Get pending advance requests for approval
   */
  async getPendingAdvances(mcWhere: Record<string, any>): Promise<any[]> {
    return await prisma.driverAdvance.findMany({
      where: {
        driver: {
          ...mcWhere,
          deletedAt: null,
        },
        approvalStatus: 'PENDING',
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        load: {
          select: {
            loadNumber: true,
          },
        },
      },
      orderBy: {
        requestDate: 'asc',
      },
    });
  }

  /**
   * Get advance history for a driver
   */
  async getDriverAdvanceHistory(
    driverId: string,
    limit: number = 50
  ): Promise<any[]> {
    return await prisma.driverAdvance.findMany({
      where: {
        driverId,
      },
      include: {
        approvedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        load: {
          select: {
            loadNumber: true,
          },
        },
        settlement: {
          select: {
            settlementNumber: true,
          },
        },
      },
      orderBy: {
        requestDate: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get advance statistics
   */
  async getAdvanceStatistics(
    mcWhere: Record<string, any>,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRequested: number;
    totalApproved: number;
    totalRejected: number;
    totalPending: number;
    averageAmount: number;
  }> {
    const where: any = {
      driver: {
        ...mcWhere,
        deletedAt: null,
      },
    };

    if (startDate && endDate) {
      where.requestDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [totalRequested, approved, rejected, pending] = await Promise.all([
      prisma.driverAdvance.count({ where }),
      prisma.driverAdvance.findMany({
        where: { ...where, approvalStatus: 'APPROVED' },
        select: { amount: true },
      }),
      prisma.driverAdvance.count({
        where: { ...where, approvalStatus: 'REJECTED' },
      }),
      prisma.driverAdvance.count({
        where: { ...where, approvalStatus: 'PENDING' },
      }),
    ]);

    const totalApproved = approved.length;
    const approvedSum = approved.reduce((sum, adv) => sum + adv.amount, 0);
    const averageAmount = totalApproved > 0 ? approvedSum / totalApproved : 0;

    return {
      totalRequested,
      totalApproved,
      totalRejected: rejected,
      totalPending: pending,
      averageAmount,
    };
  }
}





