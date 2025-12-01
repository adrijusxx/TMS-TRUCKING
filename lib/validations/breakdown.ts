import { z } from 'zod';

export const createBreakdownSchema = z.object({
  truckId: z.string().min(1, 'Truck is required'),
  loadId: z.string().optional(),
  driverId: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  odometerReading: z.number().nonnegative(),
  breakdownType: z.enum([
    'ENGINE_FAILURE',
    'TRANSMISSION_FAILURE',
    'BRAKE_FAILURE',
    'TIRE_FLAT',
    'TIRE_BLOWOUT',
    'ELECTRICAL_ISSUE',
    'COOLING_SYSTEM',
    'FUEL_SYSTEM',
    'SUSPENSION',
    'ACCIDENT_DAMAGE',
    'WEATHER_RELATED',
    'OTHER',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  problem: z.string().nullable().optional(),
  problemCategory: z.string().nullable().optional(),
  description: z.string().min(1, 'Description is required'),
  serviceProvider: z.string().optional(),
  serviceContact: z.string().optional(),
  serviceAddress: z.string().optional(),
});

const updateBreakdownSchema = createBreakdownSchema.partial();

export type CreateBreakdownInput = z.infer<typeof createBreakdownSchema>;
type UpdateBreakdownInput = z.infer<typeof updateBreakdownSchema>;

