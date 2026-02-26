import { z } from 'zod';

export const createCampaignSchema = z.object({
  campaignName: z.string().min(1, 'Campaign name is required'),
  campaignType: z.enum(['MILLION_MILE_CLUB', 'NO_PREVENTABLE_ACCIDENTS', 'BEST_PRE_TRIP_INSPECTION', 'OTHER']),
  goal: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const addParticipantSchema = z.object({
  driverId: z.string().min(1),
  pointsEarned: z.number().int().min(0).optional(),
  achievement: z.string().optional().nullable(),
  bonusAmount: z.number().min(0).optional().nullable(),
});

export const createRecognitionSchema = z.object({
  driverId: z.string().min(1),
  recognitionType: z.enum(['YEARS_WITHOUT_ACCIDENT', 'MILESTONE_MILES', 'SAFETY_LEADERSHIP', 'OTHER']),
  achievement: z.string().min(1, 'Achievement description is required'),
  recognitionDate: z.coerce.date(),
  awardAmount: z.number().min(0).optional().nullable(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type AddParticipantInput = z.infer<typeof addParticipantSchema>;
export type CreateRecognitionInput = z.infer<typeof createRecognitionSchema>;
