/**
 * SafetyPolicyManager
 *
 * Handles creation, versioning, distribution, and acknowledgment of SafetyPolicy records.
 */

import { prisma } from '@/lib/prisma';
import type { CreateSafetyPolicyInput, UpdateSafetyPolicyInput } from '@/lib/validations/safety-policy';

export class SafetyPolicyManager {
  /**
   * Create a new safety policy
   */
  async createPolicy(companyId: string, data: CreateSafetyPolicyInput) {
    return prisma.safetyPolicy.create({
      data: {
        companyId,
        policyName: data.policyName,
        category: data.category,
        content: data.content,
        effectiveDate: data.effectiveDate,
        version: 1,
      },
      include: {
        acknowledgments: {
          include: {
            driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });
  }

  /**
   * Update an existing safety policy (bumps version)
   */
  async updatePolicy(policyId: string, companyId: string, data: UpdateSafetyPolicyInput) {
    const policy = await prisma.safetyPolicy.findFirst({
      where: { id: policyId, companyId, deletedAt: null },
    });
    if (!policy) throw new Error('Safety policy not found');

    return prisma.safetyPolicy.update({
      where: { id: policyId },
      data: {
        ...(data.policyName && { policyName: data.policyName }),
        ...(data.category && { category: data.category }),
        ...(data.content && { content: data.content, version: { increment: 1 } }),
        ...(data.effectiveDate && { effectiveDate: data.effectiveDate }),
      },
      include: {
        acknowledgments: {
          include: {
            driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });
  }

  /**
   * Soft-delete a safety policy
   */
  async deletePolicy(policyId: string, companyId: string) {
    const policy = await prisma.safetyPolicy.findFirst({
      where: { id: policyId, companyId, deletedAt: null },
    });
    if (!policy) throw new Error('Safety policy not found');

    return prisma.safetyPolicy.update({
      where: { id: policyId },
      data: { deletedAt: new Date(), supersededDate: new Date() },
    });
  }

  /**
   * Distribute a policy to drivers for acknowledgment
   */
  async distributePolicy(policyId: string, companyId: string, driverIds: string[]) {
    const policy = await prisma.safetyPolicy.findFirst({
      where: { id: policyId, companyId, deletedAt: null },
    });
    if (!policy) throw new Error('Safety policy not found');

    const acknowledgments = await Promise.all(
      driverIds.map((driverId) =>
        prisma.policyAcknowledgment.upsert({
          where: {
            policyId_driverId: { policyId, driverId },
          },
          create: {
            policyId,
            driverId,
            status: 'PENDING',
          },
          update: {
            status: 'PENDING',
            acknowledgedAt: null,
            signature: null,
          },
          include: {
            driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
          },
        })
      )
    );

    await prisma.safetyPolicy.update({
      where: { id: policyId },
      data: { distributedAt: new Date() },
    });

    return acknowledgments;
  }

  /**
   * Record a driver's acknowledgment of a policy
   */
  async acknowledgePolicy(policyId: string, driverId: string, signature?: string) {
    const acknowledgment = await prisma.policyAcknowledgment.findUnique({
      where: { policyId_driverId: { policyId, driverId } },
    });
    if (!acknowledgment) throw new Error('Policy acknowledgment record not found');

    return prisma.policyAcknowledgment.update({
      where: { policyId_driverId: { policyId, driverId } },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        signature: signature ?? null,
      },
    });
  }

  /**
   * Get acknowledgment summary for a policy
   */
  async getAcknowledgmentStatus(policyId: string) {
    const acknowledgments = await prisma.policyAcknowledgment.findMany({
      where: { policyId },
      include: {
        driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    const total = acknowledgments.length;
    const acknowledged = acknowledgments.filter((a) => a.status === 'ACKNOWLEDGED').length;
    const pending = acknowledgments.filter((a) => a.status === 'PENDING').length;
    const overdue = acknowledgments.filter((a) => a.status === 'OVERDUE').length;

    return {
      total,
      acknowledged,
      pending,
      overdue,
      completionPercentage: total > 0 ? Math.round((acknowledged / total) * 100) : 0,
      acknowledgments,
    };
  }
}

export const safetyPolicyManager = new SafetyPolicyManager();
