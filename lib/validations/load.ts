import { z } from 'zod';
import { LoadType, EquipmentType } from '@prisma/client';

// Stop item schema
const stopItemSchema = z.object({
  orderId: z.string().optional(),
  item: z.string().optional(),
  product: z.string().optional(),
  pieces: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '' || val === 'NaN') return undefined;
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().int().positive().optional()
  ),
  weight: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '' || val === 'NaN') return undefined;
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().positive().optional()
  ),
  description: z.string().optional(),
});

// Stop schema for multi-stop loads
const loadStopSchema = z.object({
  stopType: z.enum(['PICKUP', 'DELIVERY']),
  sequence: z.number().int().positive(),
  company: z.string().optional(),
  address: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val || ''),
    z.string().min(1, 'Address is required')
  ),
  city: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val || ''),
    z.string().min(1, 'City is required')
  ),
  state: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const trimmed = val.trim().toUpperCase();
        return trimmed.length >= 2 ? trimmed.slice(0, 2) : trimmed;
      }
      return val || '';
    },
    z.string().length(2, 'State must be 2 characters')
  ),
  zip: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val || ''),
    z.string().min(5, 'ZIP code is required (minimum 5 characters)')
  ),
  phone: z.string().optional(),
  earliestArrival: z.preprocess(
    (val) => {
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'string') return val;
      return val;
    },
    z.string().or(z.date()).optional()
  ),
  latestArrival: z.preprocess(
    (val) => {
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'string') return val;
      return val;
    },
    z.string().or(z.date()).optional()
  ),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  items: z.preprocess(
    (val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    },
    z.array(stopItemSchema).optional()
  ),
  totalPieces: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '' || val === 'NaN') return undefined;
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().int().positive().optional()
  ),
  totalWeight: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '' || val === 'NaN') return undefined;
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().positive().optional()
  ),
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),
});

// Base schema without superRefine - used for updates
const baseLoadSchema = z.object({
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
  
  // Multi-stop support (if provided, single pickup/delivery fields are optional)
  stops: z.array(loadStopSchema).optional(),
  
  // Single pickup (optional if stops are provided)
  pickupLocation: z.string().optional(),
  pickupAddress: z.string().optional(),
  pickupCity: z.string().optional(),
  pickupState: z.string().length(2, 'State must be 2 characters').or(z.literal('')).optional(),
  pickupZip: z.string().min(5, 'ZIP code is required').or(z.literal('')).optional(),
  pickupDate: z.string().or(z.date()).optional(),
  pickupTimeStart: z.string().or(z.date()).optional(),
  pickupTimeEnd: z.string().or(z.date()).optional(),
  pickupContact: z.string().optional(),
  pickupPhone: z.string().optional(),
  pickupNotes: z.string().optional(),
  pickupCompany: z.string().optional(),
  
  // Single delivery (optional if stops are provided)
  deliveryLocation: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryState: z.string().length(2, 'State must be 2 characters').or(z.literal('')).optional(),
  deliveryZip: z.string().min(5, 'ZIP code is required').or(z.literal('')).optional(),
  deliveryDate: z.string().or(z.date()).optional(),
  deliveryTimeStart: z.string().or(z.date()).optional(),
  deliveryTimeEnd: z.string().or(z.date()).optional(),
  deliveryContact: z.string().optional(),
  deliveryPhone: z.string().optional(),
  deliveryNotes: z.string().optional(),
  deliveryCompany: z.string().optional(),
  
  // Load specs
  weight: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '' || val === 'NaN') return undefined;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '') return undefined;
        const num = parseFloat(trimmed);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number({
      message: 'Weight must be a valid number',
    }).positive('Weight must be positive').optional()
  ),
  pieces: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '' || val === 'NaN') return undefined;
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().int().positive().optional()
  ),
  commodity: z.string().optional(),
  pallets: z.number().int().positive().optional(),
  temperature: z.string().optional(),
  hazmat: z.boolean().default(false),
  hazmatClass: z.string().optional(),
  
  // Financial
  revenue: z.number().nonnegative('Revenue cannot be negative'),
  driverPay: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().nonnegative().optional()
  ),
      fuelAdvance: z.number().nonnegative().default(0),
      loadedMiles: z.preprocess(
        (val) => {
          if (val === undefined || val === null || val === '') return undefined;
          if (typeof val === 'string') {
            const num = parseFloat(val);
            return isNaN(num) ? undefined : num;
          }
          if (typeof val === 'number') {
            return isNaN(val) ? undefined : val;
          }
          return undefined;
        },
        z.number().nonnegative().optional()
      ),
      emptyMiles: z.preprocess(
        (val) => {
          if (val === undefined || val === null || val === '') return undefined;
          if (typeof val === 'string') {
            const num = parseFloat(val);
            return isNaN(num) ? undefined : num;
          }
          if (typeof val === 'number') {
            return isNaN(val) ? undefined : val;
          }
          return undefined;
        },
        z.number().nonnegative().optional()
      ),
      totalMiles: z.preprocess(
        (val) => {
          if (val === undefined || val === null || val === '') return undefined;
          if (typeof val === 'string') {
            const num = parseFloat(val);
            return isNaN(num) ? undefined : num;
          }
          if (typeof val === 'number') {
            return isNaN(val) ? undefined : val;
          }
          return undefined;
        },
        z.number().nonnegative().optional() // Allow 0 or positive, will be calculated if needed
      ),
      
      // Optional
      trailerNumber: z.string().optional(),
      dispatchNotes: z.string().optional(),
      // Additional fields from import
      coDriverId: z.string().optional(),
      dispatcherId: z.string().optional(),
      createdById: z.string().optional(),
      tripId: z.string().optional(),
      mcNumber: z.string().optional(),
      // Driver and equipment assignment
      driverId: z.string().optional(),
      truckId: z.string().optional(),
      trailerId: z.string().optional(),
      revenuePerMile: z.preprocess(
        (val) => {
          if (val === undefined || val === null || val === '') return undefined;
          if (typeof val === 'string') {
            const num = parseFloat(val);
            return isNaN(num) ? undefined : num;
          }
          if (typeof val === 'number') {
            return isNaN(val) ? undefined : val;
          }
          return undefined;
        },
        z.number().nonnegative().optional()
      ),
      serviceFee: z.preprocess(
        (val) => {
          if (val === undefined || val === null || val === '') return undefined;
          if (typeof val === 'string') {
            const num = parseFloat(val);
            return isNaN(num) ? undefined : num;
          }
          if (typeof val === 'number') {
            return isNaN(val) ? undefined : val;
          }
          return undefined;
        },
        z.number().nonnegative().optional()
      ),
});
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
  stops: z.array(loadStopSchema).optional(),
  pickupLocation: z.string().optional(),
  pickupAddress: z.string().optional(),
  pickupCity: z.string().optional(),
  pickupState: z.string().length(2, 'State must be 2 characters').or(z.literal('')).optional(),
  pickupZip: z.string().min(5, 'ZIP code is required').or(z.literal('')).optional(),
  pickupDate: z.string().or(z.date()).optional(),
  pickupTimeStart: z.string().or(z.date()).optional(),
  pickupTimeEnd: z.string().or(z.date()).optional(),
  pickupContact: z.string().optional(),
  pickupPhone: z.string().optional(),
  pickupNotes: z.string().optional(),
  pickupCompany: z.string().optional(),
  deliveryLocation: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryState: z.string().length(2, 'State must be 2 characters').or(z.literal('')).optional(),
  deliveryZip: z.string().min(5, 'ZIP code is required').or(z.literal('')).optional(),
  deliveryDate: z.string().or(z.date()).optional(),
  deliveryTimeStart: z.string().or(z.date()).optional(),
  deliveryTimeEnd: z.string().or(z.date()).optional(),
  deliveryContact: z.string().optional(),
  deliveryPhone: z.string().optional(),
  deliveryNotes: z.string().optional(),
  deliveryCompany: z.string().optional(),
  weight: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '' || val === 'NaN') return undefined;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '') return undefined;
        const num = parseFloat(trimmed);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number({
      message: 'Weight must be a valid number',
    }).positive('Weight must be positive').optional()
  ),
  pieces: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '' || val === 'NaN') return undefined;
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().int().positive().optional()
  ),
  commodity: z.string().optional(),
  pallets: z.number().int().positive().optional(),
  temperature: z.string().optional(),
  hazmat: z.boolean().default(false),
  hazmatClass: z.string().optional(),
  revenue: z.number().nonnegative('Revenue cannot be negative'),
  driverPay: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().nonnegative().optional()
  ),
  fuelAdvance: z.number().nonnegative().default(0),
  loadedMiles: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().nonnegative().optional()
  ),
  emptyMiles: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().nonnegative().optional()
  ),
  totalMiles: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().nonnegative().optional()
  ),
  trailerNumber: z.string().optional(),
  dispatchNotes: z.string().optional(),
  coDriverId: z.string().optional(),
  dispatcherId: z.string().optional(),
  createdById: z.string().optional(),
  tripId: z.string().optional(),
  mcNumber: z.string().optional(),
  driverId: z.string().optional(),
  truckId: z.string().optional(),
  trailerId: z.string().optional(),
  revenuePerMile: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().nonnegative().optional()
  ),
  serviceFee: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') {
        return isNaN(val) ? undefined : val;
      }
      return undefined;
    },
    z.number().nonnegative().optional()
  ),
});

// Create schema with superRefine validation for creation
export const createLoadSchema = baseLoadSchema.superRefine((data, ctx) => {
  // Either stops array OR single pickup/delivery must be provided
  if (data.stops && data.stops.length > 0) {
    // Multi-stop load - single pickup/delivery fields are optional
    // Clear any errors on single-stop fields
    return;
  }
  
  // Single-stop load validation - all fields required
  if (!data.pickupLocation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Pickup location is required',
      path: ['pickupLocation'],
    });
  }
  if (!data.pickupAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Pickup address is required',
      path: ['pickupAddress'],
    });
  }
  if (!data.pickupCity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Pickup city is required',
      path: ['pickupCity'],
    });
  }
  if (!data.pickupState || data.pickupState.length !== 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Pickup state must be 2 characters',
      path: ['pickupState'],
    });
  }
  if (!data.pickupZip || data.pickupZip.length < 5) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Pickup ZIP code is required',
      path: ['pickupZip'],
    });
  }
  if (!data.pickupDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Pickup date is required',
      path: ['pickupDate'],
    });
  }
  if (!data.deliveryLocation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Delivery location is required',
      path: ['deliveryLocation'],
    });
  }
  if (!data.deliveryAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Delivery address is required',
      path: ['deliveryAddress'],
    });
  }
  if (!data.deliveryCity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Delivery city is required',
      path: ['deliveryCity'],
    });
  }
  if (!data.deliveryState || data.deliveryState.length !== 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Delivery state must be 2 characters',
      path: ['deliveryState'],
    });
  }
  if (!data.deliveryZip || data.deliveryZip.length < 5) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Delivery ZIP code is required',
      path: ['deliveryZip'],
    });
  }
  if (!data.deliveryDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Delivery date is required',
      path: ['deliveryDate'],
    });
  }
});

// Update schema - all fields optional, NO superRefine validation for updates
// This allows partial updates (e.g., just updating truckId, driverId, trailerId) 
// without requiring all createLoadSchema fields
// We use baseLoadSchema (without superRefine) for updates
export const updateLoadSchema = baseLoadSchema
  .partial()
  .extend({
    status: z.enum([
      'PENDING',
      'ASSIGNED',
      'EN_ROUTE_PICKUP',
      'AT_PICKUP',
      'LOADED',
      'EN_ROUTE_DELIVERY',
      'AT_DELIVERY',
      'DELIVERED',
      'INVOICED',
      'PAID',
      'CANCELLED',
    ]).optional(),
    dispatchStatus: z.enum([
      'BOOKED',
      'ON_ROUTE_TO_PICKUP',
      'AT_PICKUP',
      'LOADED',
      'ON_ROUTE_TO_DELIVERY',
      'AT_DELIVERY',
      'DELIVERED',
      'PENDING_DISPATCH',
      'DISPATCHED',
      'CANCELLED',
    ]).optional(),
    driverId: z.string().optional(),
    truckId: z.string().optional(),
    trailerId: z.string().optional(),
  })
  .passthrough(); // Allow any additional fields for flexibility

export type CreateLoadInput = z.infer<typeof createLoadSchema>;
export type UpdateLoadInput = z.infer<typeof updateLoadSchema>;

