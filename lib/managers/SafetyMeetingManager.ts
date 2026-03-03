/**
 * SafetyMeetingManager
 *
 * Handles creation, updating, and attendance tracking for SafetyMeeting records.
 */

import { prisma } from '@/lib/prisma';
import type { CreateSafetyMeetingInput, UpdateSafetyMeetingInput } from '@/lib/validations/safety-meeting';
import { NotFoundError } from '@/lib/errors';

export class SafetyMeetingManager {
  /**
   * Create a new safety meeting
   */
  async createMeeting(companyId: string, data: CreateSafetyMeetingInput) {
    return prisma.safetyMeeting.create({
      data: {
        companyId,
        meetingDate: data.meetingDate,
        meetingTime: data.meetingTime ?? undefined,
        location: data.location ?? undefined,
        topic: data.topic,
        agenda: data.agenda ?? undefined,
      },
      include: {
        attendance: {
          include: {
            driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });
  }

  /**
   * Update an existing safety meeting
   */
  async updateMeeting(meetingId: string, companyId: string, data: UpdateSafetyMeetingInput) {
    const meeting = await prisma.safetyMeeting.findFirst({
      where: { id: meetingId, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundError('Safety meeting', meetingId);

    return prisma.safetyMeeting.update({
      where: { id: meetingId },
      data: {
        ...(data.meetingDate && { meetingDate: data.meetingDate }),
        ...(data.meetingTime !== undefined && { meetingTime: data.meetingTime }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.topic && { topic: data.topic }),
        ...(data.agenda !== undefined && { agenda: data.agenda }),
        ...(data.minutes !== undefined && { minutes: data.minutes }),
        ...(data.actionItems !== undefined && { actionItems: data.actionItems }),
      },
      include: {
        attendance: {
          include: {
            driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });
  }

  /**
   * Soft-delete a safety meeting
   */
  async deleteMeeting(meetingId: string, companyId: string) {
    const meeting = await prisma.safetyMeeting.findFirst({
      where: { id: meetingId, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundError('Safety meeting', meetingId);

    return prisma.safetyMeeting.update({
      where: { id: meetingId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Record attendance for a meeting (upserts to handle repeated calls)
   */
  async recordAttendance(
    meetingId: string,
    companyId: string,
    attendanceData: Array<{ driverId: string; attended: boolean }>
  ) {
    const meeting = await prisma.safetyMeeting.findFirst({
      where: { id: meetingId, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundError('Safety meeting', meetingId);

    const results = await Promise.all(
      attendanceData.map((record) =>
        prisma.meetingAttendance.upsert({
          where: {
            meetingId_driverId: { meetingId, driverId: record.driverId },
          },
          create: {
            meetingId,
            driverId: record.driverId,
            attended: record.attended,
            signInTime: record.attended ? new Date() : undefined,
          },
          update: {
            attended: record.attended,
            signInTime: record.attended ? new Date() : null,
          },
          include: {
            driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
          },
        })
      )
    );

    return results;
  }

  /**
   * Update meeting minutes and action items
   */
  async addActionItems(meetingId: string, companyId: string, actionItems: string) {
    const meeting = await prisma.safetyMeeting.findFirst({
      where: { id: meetingId, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundError('Safety meeting', meetingId);

    return prisma.safetyMeeting.update({
      where: { id: meetingId },
      data: { actionItems },
    });
  }
}

export const safetyMeetingManager = new SafetyMeetingManager();
