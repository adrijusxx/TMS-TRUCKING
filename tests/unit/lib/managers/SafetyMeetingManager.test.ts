import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SafetyMeetingManager } from '@/lib/managers/SafetyMeetingManager';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    safetyMeeting: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    meetingAttendance: {
      upsert: vi.fn(),
    },
  },
}));

const mockMeeting = {
  id: 'meeting-1',
  companyId: 'company-1',
  meetingDate: new Date('2026-03-01'),
  meetingTime: '10:00',
  location: 'Main Office',
  topic: 'Quarterly Safety Review',
  agenda: 'Review incidents',
  actionItems: null,
  minutes: null,
  deletedAt: null,
  attendance: [],
};

describe('SafetyMeetingManager', () => {
  let manager: SafetyMeetingManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new SafetyMeetingManager();
  });

  describe('createMeeting', () => {
    it('should create a meeting with correct data', async () => {
      (prisma.safetyMeeting.create as any).mockResolvedValue(mockMeeting);

      const input = {
        meetingDate: new Date('2026-03-01'),
        meetingTime: '10:00',
        location: 'Main Office',
        topic: 'Quarterly Safety Review',
        agenda: 'Review incidents',
      };

      const result = await manager.createMeeting('company-1', input);

      expect(prisma.safetyMeeting.create).toHaveBeenCalledWith({
        data: {
          companyId: 'company-1',
          meetingDate: input.meetingDate,
          meetingTime: '10:00',
          location: 'Main Office',
          topic: 'Quarterly Safety Review',
          agenda: 'Review incidents',
        },
        include: {
          attendance: {
            include: {
              driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
            },
          },
        },
      });
      expect(result).toEqual(mockMeeting);
    });
  });

  describe('updateMeeting', () => {
    it('should update an existing meeting', async () => {
      const updated = { ...mockMeeting, topic: 'Updated Topic' };
      (prisma.safetyMeeting.findFirst as any).mockResolvedValue(mockMeeting);
      (prisma.safetyMeeting.update as any).mockResolvedValue(updated);

      const result = await manager.updateMeeting('meeting-1', 'company-1', {
        topic: 'Updated Topic',
      });

      expect(prisma.safetyMeeting.findFirst).toHaveBeenCalledWith({
        where: { id: 'meeting-1', companyId: 'company-1', deletedAt: null },
      });
      expect(prisma.safetyMeeting.update).toHaveBeenCalledWith({
        where: { id: 'meeting-1' },
        data: { topic: 'Updated Topic' },
        include: {
          attendance: {
            include: {
              driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
            },
          },
        },
      });
      expect(result.topic).toBe('Updated Topic');
    });

    it('should throw when meeting not found', async () => {
      (prisma.safetyMeeting.findFirst as any).mockResolvedValue(null);

      await expect(
        manager.updateMeeting('nonexistent', 'company-1', { topic: 'New' })
      ).rejects.toThrow('Safety meeting not found');

      expect(prisma.safetyMeeting.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteMeeting', () => {
    it('should soft-delete a meeting', async () => {
      const deleted = { ...mockMeeting, deletedAt: new Date() };
      (prisma.safetyMeeting.findFirst as any).mockResolvedValue(mockMeeting);
      (prisma.safetyMeeting.update as any).mockResolvedValue(deleted);

      const result = await manager.deleteMeeting('meeting-1', 'company-1');

      expect(prisma.safetyMeeting.findFirst).toHaveBeenCalledWith({
        where: { id: 'meeting-1', companyId: 'company-1', deletedAt: null },
      });
      expect(prisma.safetyMeeting.update).toHaveBeenCalledWith({
        where: { id: 'meeting-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.deletedAt).toBeDefined();
    });

    it('should throw when meeting not found', async () => {
      (prisma.safetyMeeting.findFirst as any).mockResolvedValue(null);

      await expect(
        manager.deleteMeeting('nonexistent', 'company-1')
      ).rejects.toThrow('Safety meeting not found');

      expect(prisma.safetyMeeting.update).not.toHaveBeenCalled();
    });
  });

  describe('recordAttendance', () => {
    it('should record attendance for multiple drivers', async () => {
      (prisma.safetyMeeting.findFirst as any).mockResolvedValue(mockMeeting);
      (prisma.meetingAttendance.upsert as any).mockImplementation((args: any) => ({
        meetingId: 'meeting-1',
        driverId: args.create.driverId,
        attended: args.create.attended,
      }));

      const attendanceData = [
        { driverId: 'driver-1', attended: true },
        { driverId: 'driver-2', attended: false },
        { driverId: 'driver-3', attended: true },
      ];

      const results = await manager.recordAttendance('meeting-1', 'company-1', attendanceData);

      expect(prisma.meetingAttendance.upsert).toHaveBeenCalledTimes(3);
      expect(prisma.meetingAttendance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { meetingId_driverId: { meetingId: 'meeting-1', driverId: 'driver-1' } },
          create: expect.objectContaining({ meetingId: 'meeting-1', driverId: 'driver-1', attended: true }),
          update: expect.objectContaining({ attended: true }),
        })
      );
      expect(results).toHaveLength(3);
      expect(results[0].attended).toBe(true);
      expect(results[1].attended).toBe(false);
    });

    it('should throw when meeting not found', async () => {
      (prisma.safetyMeeting.findFirst as any).mockResolvedValue(null);

      await expect(
        manager.recordAttendance('nonexistent', 'company-1', [{ driverId: 'd1', attended: true }])
      ).rejects.toThrow('Safety meeting not found');
    });
  });

  describe('addActionItems', () => {
    it('should update action items on meeting', async () => {
      const updated = { ...mockMeeting, actionItems: 'Fix warehouse ramp' };
      (prisma.safetyMeeting.findFirst as any).mockResolvedValue(mockMeeting);
      (prisma.safetyMeeting.update as any).mockResolvedValue(updated);

      const result = await manager.addActionItems('meeting-1', 'company-1', 'Fix warehouse ramp');

      expect(prisma.safetyMeeting.update).toHaveBeenCalledWith({
        where: { id: 'meeting-1' },
        data: { actionItems: 'Fix warehouse ramp' },
      });
      expect(result.actionItems).toBe('Fix warehouse ramp');
    });

    it('should throw when meeting not found', async () => {
      (prisma.safetyMeeting.findFirst as any).mockResolvedValue(null);

      await expect(
        manager.addActionItems('nonexistent', 'company-1', 'items')
      ).rejects.toThrow('Safety meeting not found');
    });
  });
});
