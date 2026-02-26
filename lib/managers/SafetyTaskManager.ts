/**
 * SafetyTaskManager
 *
 * Handles creation, updating, locking, and archiving of SafetyTask records.
 * Auto-generates SFT-XXXXX task numbers per company.
 */

import { prisma } from '@/lib/prisma';
import type { CreateSafetyTaskInput, UpdateSafetyTaskInput } from '@/lib/validations/safety-task';

export class SafetyTaskManager {
  /**
   * Get the next SFT-XXXXX task number for a company
   */
  async getNextTaskNumber(companyId: string): Promise<string> {
    const lastTask = await prisma.safetyTask.findFirst({
      where: { companyId },
      orderBy: { taskNumber: 'desc' },
      select: { taskNumber: true },
    });

    let nextNum = 1;
    if (lastTask?.taskNumber) {
      const match = lastTask.taskNumber.match(/SFT-(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }

    return `SFT-${String(nextNum).padStart(5, '0')}`;
  }

  /**
   * Create a new safety task with auto-generated number
   */
  async createTask(companyId: string, data: CreateSafetyTaskInput) {
    const taskNumber = await this.getNextTaskNumber(companyId);

    return prisma.safetyTask.create({
      data: {
        companyId,
        taskNumber,
        taskType: data.taskType,
        date: data.date,
        dueDate: data.dueDate ?? undefined,
        driverId: data.driverId ?? undefined,
        truckId: data.truckId ?? undefined,
        trailerId: data.trailerId ?? undefined,
        loadId: data.loadId ?? undefined,
        mcNumberId: data.mcNumberId ?? undefined,
        note: data.note ?? undefined,
        description: data.description ?? undefined,
        driverAmount: data.driverAmount ?? 0,
        totalAmount: data.totalAmount ?? 0,
        location: data.location ?? undefined,
        city: data.city ?? undefined,
        state: data.state ?? undefined,
      },
      include: {
        driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        truck: { select: { id: true, truckNumber: true } },
        trailer: { select: { id: true, trailerNumber: true } },
        mcNumber: { select: { id: true, number: true, companyName: true } },
        load: { select: { id: true, loadNumber: true } },
      },
    });
  }

  /**
   * Update an existing safety task
   */
  async updateTask(taskId: string, companyId: string, data: UpdateSafetyTaskInput) {
    const task = await prisma.safetyTask.findFirst({
      where: { id: taskId, companyId, deletedAt: null },
    });
    if (!task) throw new Error('Safety task not found');
    if (task.isLocked) throw new Error('Cannot edit a locked safety task');

    return prisma.safetyTask.update({
      where: { id: taskId },
      data: {
        ...(data.taskType && { taskType: data.taskType }),
        ...(data.date && { date: data.date }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
        ...(data.status && { status: data.status }),
        ...(data.driverId !== undefined && { driverId: data.driverId }),
        ...(data.truckId !== undefined && { truckId: data.truckId }),
        ...(data.trailerId !== undefined && { trailerId: data.trailerId }),
        ...(data.loadId !== undefined && { loadId: data.loadId }),
        ...(data.mcNumberId !== undefined && { mcNumberId: data.mcNumberId }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.driverAmount !== undefined && { driverAmount: data.driverAmount }),
        ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
        ...(data.driverCompStatus !== undefined && { driverCompStatus: data.driverCompStatus }),
        ...(data.settlementId !== undefined && { settlementId: data.settlementId }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
      },
    });
  }

  /**
   * Toggle the lock status of a safety task
   */
  async toggleLock(taskId: string, companyId: string, lock: boolean) {
    const task = await prisma.safetyTask.findFirst({
      where: { id: taskId, companyId, deletedAt: null },
    });
    if (!task) throw new Error('Safety task not found');

    return prisma.safetyTask.update({
      where: { id: taskId },
      data: { isLocked: lock },
    });
  }

  /**
   * Archive a safety task (set status to ARCHIVED)
   */
  async archiveTask(taskId: string, companyId: string) {
    const task = await prisma.safetyTask.findFirst({
      where: { id: taskId, companyId, deletedAt: null },
    });
    if (!task) throw new Error('Safety task not found');

    return prisma.safetyTask.update({
      where: { id: taskId },
      data: { status: 'ARCHIVED' },
    });
  }

  /**
   * Soft-delete a safety task
   */
  async deleteTask(taskId: string, companyId: string) {
    const task = await prisma.safetyTask.findFirst({
      where: { id: taskId, companyId, deletedAt: null },
    });
    if (!task) throw new Error('Safety task not found');
    if (task.isLocked) throw new Error('Cannot delete a locked safety task');

    return prisma.safetyTask.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Link a safety task to an existing source record
   */
  async linkToSource(
    taskId: string,
    companyId: string,
    source: { incidentId?: string; roadsideInspectionId?: string; insuranceClaimId?: string; citationId?: string }
  ) {
    const task = await prisma.safetyTask.findFirst({
      where: { id: taskId, companyId, deletedAt: null },
    });
    if (!task) throw new Error('Safety task not found');

    return prisma.safetyTask.update({
      where: { id: taskId },
      data: {
        ...(source.incidentId && { incidentId: source.incidentId }),
        ...(source.roadsideInspectionId && { roadsideInspectionId: source.roadsideInspectionId }),
        ...(source.insuranceClaimId && { insuranceClaimId: source.insuranceClaimId }),
        ...(source.citationId && { citationId: source.citationId }),
      },
    });
  }
}

export const safetyTaskManager = new SafetyTaskManager();
