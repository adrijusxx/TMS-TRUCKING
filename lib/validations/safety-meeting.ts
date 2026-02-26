import { z } from 'zod';

export const createSafetyMeetingSchema = z.object({
  meetingDate: z.coerce.date(),
  meetingTime: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  topic: z.string().min(1, 'Topic is required'),
  agenda: z.string().optional().nullable(),
});

export const updateSafetyMeetingSchema = createSafetyMeetingSchema.partial().extend({
  minutes: z.string().optional().nullable(),
  actionItems: z.string().optional().nullable(),
});

export const meetingAttendanceSchema = z.object({
  attendance: z.array(
    z.object({
      driverId: z.string().min(1),
      attended: z.boolean(),
    })
  ),
});

export type CreateSafetyMeetingInput = z.infer<typeof createSafetyMeetingSchema>;
export type UpdateSafetyMeetingInput = z.infer<typeof updateSafetyMeetingSchema>;
export type MeetingAttendanceInput = z.infer<typeof meetingAttendanceSchema>;
