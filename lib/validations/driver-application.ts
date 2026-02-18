import { z } from 'zod';

export const driverApplicationSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().min(10, 'Valid phone number required'),
    email: z.string().email('Valid email required').optional().or(z.literal('')),
    city: z.string().optional(),
    state: z.string().optional(),
    cdlNumber: z.string().optional(),
    cdlClass: z.enum(['A', 'B', 'C', '']).optional(),
    yearsExperience: z.coerce.number().min(0).optional(),
    endorsements: z.array(z.string()).optional(),
    previousEmployers: z.string().optional(),
    referralSource: z.string().optional(),
    consent: z.literal(true, { message: 'You must agree to the terms' }),
    honeypot: z.string().max(0).optional(), // Spam prevention
});

export type DriverApplicationInput = z.infer<typeof driverApplicationSchema>;
