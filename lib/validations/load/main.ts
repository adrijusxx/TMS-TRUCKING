import { z } from 'zod';
import { LoadType, EquipmentType } from '@prisma/client';
import { loadStopSchema } from './base';

// Base schema without superRefine - used for updates
export const baseLoadSchema = z.object({
    loadNumber: z.string().min(1, 'Load number is required'),
    customerId: z.preprocess(
        (val) => {
            if (val === undefined || val === null) return undefined;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                return trimmed === '' ? undefined : trimmed;
            }
            return val;
        },
        z.string().min(1, 'Customer is required')
    ),
    loadType: z.nativeEnum(LoadType),
    equipmentType: z.nativeEnum(EquipmentType),

    // Multi-stop support
    stops: z.array(loadStopSchema).optional(),

    // Single pickup
    pickupLocation: z.string().optional().nullable(),
    pickupAddress: z.string().optional().nullable(),
    pickupCity: z.string().optional().nullable(),
    pickupState: z.string().length(2, 'State must be 2 characters').or(z.literal('')).optional().nullable(),
    pickupZip: z.string().min(5, 'ZIP code is required').or(z.literal('')).optional().nullable(),
    pickupDate: z.string().or(z.date()).optional().nullable(),
    pickupCompany: z.string().optional().nullable(),

    // Single delivery
    deliveryLocation: z.string().optional().nullable(),
    deliveryAddress: z.string().optional().nullable(),
    deliveryCity: z.string().optional().nullable(),
    deliveryState: z.string().length(2, 'State must be 2 characters').or(z.literal('')).optional().nullable(),
    deliveryZip: z.string().min(5, 'ZIP code is required').or(z.literal('')).optional().nullable(),
    deliveryDate: z.string().or(z.date()).optional().nullable(),
    deliveryCompany: z.string().optional().nullable(),

    // Load specs
    weight: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === '' || val === 'NaN') return null;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                if (trimmed === '') return null;
                const num = parseFloat(trimmed);
                return isNaN(num) ? null : num;
            }
            if (typeof val === 'number') {
                return isNaN(val) ? null : val;
            }
            return null;
        },
        z.number({ message: 'Weight must be a valid number' }).positive('Weight must be positive').optional().nullable()
    ),
    pieces: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === '' || val === 'NaN') return null;
            if (typeof val === 'string') {
                const num = parseInt(val, 10);
                return isNaN(num) ? null : num;
            }
            if (typeof val === 'number') {
                return isNaN(val) ? null : val;
            }
            return null;
        },
        z.number().int().positive().optional().nullable()
    ),
    commodity: z.string().optional().nullable(),
    pallets: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === '' || val === 'NaN') return null;
            if (typeof val === 'string') {
                const num = parseInt(val, 10);
                return isNaN(num) ? null : num;
            }
            if (typeof val === 'number') {
                return isNaN(val) ? null : val;
            }
            return null;
        },
        z.number().int().positive().optional().nullable()
    ),
    temperature: z.preprocess(
        (val) => (val === null || val === undefined ? null : (typeof val === 'string' ? val.trim() : String(val))),
        z.string().optional().nullable()
    ),
    hazmat: z.boolean().default(false),
    hazmatClass: z.preprocess(
        (val) => (val === null || val === undefined ? null : (typeof val === 'string' ? val.trim() : String(val))),
        z.string().optional().nullable()
    ),

    // Financial
    revenue: z.number().nonnegative('Revenue cannot be negative'),
    driverPay: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === '') return null;
            if (typeof val === 'string') {
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
            }
            if (typeof val === 'number') {
                return isNaN(val) ? null : val;
            }
            return null;
        },
        z.number().nonnegative().optional().nullable()
    ),
    fuelAdvance: z.number().nonnegative().default(0),
    loadedMiles: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === '') return null;
            if (typeof val === 'string') {
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
            }
            if (typeof val === 'number') {
                return isNaN(val) ? null : val;
            }
            return null;
        },
        z.number().nonnegative().optional().nullable()
    ),
    emptyMiles: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === '') return null;
            if (typeof val === 'string') {
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
            }
            if (typeof val === 'number') {
                return isNaN(val) ? null : val;
            }
            return null;
        },
        z.number().nonnegative().optional().nullable()
    ),
    totalMiles: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === '') return null;
            if (typeof val === 'string') {
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
            }
            if (typeof val === 'number') {
                return isNaN(val) ? null : val;
            }
            return null;
        },
        z.number().nonnegative().optional().nullable()
    ),
    actualMiles: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === '') return null;
            if (typeof val === 'string') {
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
            }
            if (typeof val === 'number') {
                return isNaN(val) ? null : val;
            }
            return null;
        },
        z.number().nonnegative().optional().nullable()
    ),

    // Optional
    trailerNumber: z.string().optional().nullable(),
    dispatchNotes: z.string().optional().nullable(),
    driverNotes: z.preprocess(
        (val) => (val === null || val === undefined ? null : (typeof val === 'string' ? val.trim() : String(val))),
        z.string().optional().nullable()
    ),

    // Additional fields from import
    coDriverId: z.preprocess(
        (val) => {
            if (val === null || val === '') return null;
            if (val === undefined) return undefined;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                return trimmed === '' ? null : trimmed;
            }
            return val;
        },
        z.string().cuid().optional().nullable()
    ),
    dispatcherId: z.preprocess(
        (val) => {
            if (val === null || val === '') return null;
            if (val === undefined) return undefined;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                return trimmed === '' ? null : trimmed;
            }
            return val;
        },
        z.string().cuid().optional().nullable()
    ),
    createdById: z.string().optional(),
    shipmentId: z.preprocess(
        (val) => {
            if (val === null || val === '') return null;
            if (val === undefined) return undefined;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                return trimmed === '' ? null : trimmed;
            }
            return val;
        },
        z.string().optional().nullable()
    ),
    tripId: z.preprocess(
        (val) => {
            if (val === null || val === '') return null;
            if (val === undefined) return undefined;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                return trimmed === '' ? null : trimmed;
            }
            return val;
        },
        z.string().optional().nullable()
    ),
    stopsCount: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === '') return null;
            if (typeof val === 'string') {
                const num = parseInt(val, 10);
                return isNaN(num) ? null : num;
            }
            if (typeof val === 'number') return isNaN(val) ? null : val;
            return null;
        },
        z.number().int().nonnegative().optional().nullable()
    ),
    lastNote: z.preprocess(
        (val) => (val === null || val === undefined ? null : (typeof val === 'string' ? val.trim() : String(val))),
        z.string().optional().nullable()
    ),
    onTimeDelivery: z.preprocess(
        (val) => (val === null || val === undefined || val === '' ? null : (typeof val === 'string' ? val.trim() : String(val))),
        z.string().optional().nullable()
    ),
    lastUpdate: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return null;
            if (val instanceof Date) return val;
            if (typeof val === 'string') {
                const d = new Date(val);
                return isNaN(d.getTime()) ? null : d;
            }
            return null;
        },
        z.date().optional().nullable()
    ),
    mcNumber: z.string().optional(),
    mcNumberId: z.string().optional(),

    // Driver and equipment assignment
    driverId: z.preprocess(
        (val) => {
            if (val === null || val === '') return null;
            if (val === undefined) return undefined;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                return trimmed === '' ? null : trimmed;
            }
            return val;
        },
        z.string().cuid().optional().nullable()
    ),
    truckId: z.preprocess(
        (val) => {
            if (val === null || val === '') return null;
            if (val === undefined) return undefined;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                return trimmed === '' ? null : trimmed;
            }
            return val;
        },
        z.string().cuid().optional().nullable()
    ),
    trailerId: z.preprocess(
        (val) => {
            if (val === null || val === '') return null;
            if (val === undefined) return undefined;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                return trimmed === '' ? null : trimmed;
            }
            return val;
        },
        z.string().cuid().optional().nullable()
    ),
    revenuePerMile: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === '') return null;
            if (typeof val === 'string') {
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
            }
            if (typeof val === 'number') {
                return isNaN(val) ? null : val;
            }
            return null;
        },
        z.number().nonnegative().optional().nullable()
    ),

    // New Fields
    urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
    publicTrackingToken: z.string().optional().nullable(),
    trackingStatus: z.enum(['ON_TIME', 'DELAYED', 'EARLY']).optional().nullable(),
    eta: z.preprocess((val) => (val === '' || val === null ? null : val), z.string().or(z.date()).optional().nullable()),
    driverRating: z.number().int().min(1).max(5).optional().nullable(),
    driverFeedback: z.string().optional().nullable(),
    factoringStatus: z.enum([
        'NOT_FACTORED',
        'PENDING',
        'SUBMITTED_TO_FACTOR',
        'APPROVED',
        'DECLINED',
        'FUNDED',
        'RESERVE_RELEASED'
    ]).optional().nullable(),
    quickPayFee: z.number().nonnegative().optional().nullable(),
    specialHandling: z.any().optional().nullable(),
});

// Create schema with superRefine validation
export const createLoadSchema = baseLoadSchema.superRefine((data, ctx) => {
    if (data.stops && data.stops.length > 0) return;

    if (!data.pickupLocation) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pickup location is required', path: ['pickupLocation'] });
    }
    if (!data.pickupAddress) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pickup address is required', path: ['pickupAddress'] });
    }
    if (!data.pickupCity) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pickup city is required', path: ['pickupCity'] });
    }
    if (!data.pickupState || data.pickupState.length !== 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pickup state must be 2 characters', path: ['pickupState'] });
    }
    if (!data.pickupZip || data.pickupZip.length < 5) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pickup ZIP code is required', path: ['pickupZip'] });
    }
    if (!data.pickupDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pickup date is required', path: ['pickupDate'] });
    }
    if (!data.deliveryLocation) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Delivery location is required', path: ['deliveryLocation'] });
    }
    if (!data.deliveryAddress) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Delivery address is required', path: ['deliveryAddress'] });
    }
    if (!data.deliveryCity) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Delivery city is required', path: ['deliveryCity'] });
    }
    if (!data.deliveryState || data.deliveryState.length !== 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Delivery state must be 2 characters', path: ['deliveryState'] });
    }
    if (!data.deliveryZip || data.deliveryZip.length < 5) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Delivery ZIP code is required', path: ['deliveryZip'] });
    }
    if (!data.deliveryDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Delivery date is required', path: ['deliveryDate'] });
    }
});

// Update schema
export const updateLoadSchema = baseLoadSchema.partial().extend({
    status: z.enum([
        'PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED',
        'EN_ROUTE_DELIVERY', 'AT_DELIVERY', 'DELIVERED', 'INVOICED', 'PAID',
        'CANCELLED', 'BILLING_HOLD', 'READY_TO_BILL'
    ]).optional(),
    dispatchStatus: z.preprocess(
        (val) => (val === undefined || val === null || val === '' ? null : val),
        z.enum([
            'BOOKED', 'ON_ROUTE_TO_PICKUP', 'AT_PICKUP', 'LOADED',
            'ON_ROUTE_TO_DELIVERY', 'AT_DELIVERY', 'DELIVERED',
            'PENDING_DISPATCH', 'DISPATCHED', 'CANCELLED'
        ]).optional().nullable()
    ),
    driverId: z.preprocess(
        (val) => (val === null || val === '' ? null : (typeof val === 'string' ? val.trim() : val)),
        z.string().cuid().optional().nullable()
    ),
    truckId: z.preprocess(
        (val) => (val === null || val === '' ? null : (typeof val === 'string' ? val.trim() : val)),
        z.string().cuid().optional().nullable()
    ),
    trailerId: z.preprocess(
        (val) => (val === null || val === '' ? null : (typeof val === 'string' ? val.trim() : val)),
        z.string().cuid().optional().nullable()
    ),
    pickupState: z.preprocess(
        (val) => (val === null || val === '' ? null : (typeof val === 'string' ? val.trim() : val)),
        z.string().length(2, 'State must be 2 characters').optional().nullable()
    ),
    deliveryState: z.preprocess(
        (val) => (val === null || val === '' ? null : (typeof val === 'string' ? val.trim() : val)),
        z.string().length(2, 'State must be 2 characters').optional().nullable()
    ),
    pickupZip: z.preprocess(
        (val) => (val === null || val === '' ? null : (typeof val === 'string' ? val.trim() : val)),
        z.string().min(5, 'ZIP code is required').optional().nullable()
    ),
    deliveryZip: z.preprocess(
        (val) => (val === null || val === '' ? null : (typeof val === 'string' ? val.trim() : val)),
        z.string().min(5, 'ZIP code is required').optional().nullable()
    ),
    coDriverId: z.preprocess(
        (val) => (val === null || val === '' ? null : (val === undefined ? undefined : (typeof val === 'string' ? val.trim() : val))),
        z.string().cuid().optional().nullable()
    ),
    dispatcherId: z.preprocess(
        (val) => (val === null || val === '' ? null : (val === undefined ? undefined : (typeof val === 'string' ? val.trim() : val))),
        z.string().cuid().optional().nullable()
    ),
});

export type CreateLoadInput = z.infer<typeof createLoadSchema>;
export type UpdateLoadInput = z.infer<typeof updateLoadSchema>;
