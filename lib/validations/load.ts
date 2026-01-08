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
  company: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : (typeof val === 'string' ? val.trim() : String(val))),
    z.string().optional()
  ),
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
  phone: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : (typeof val === 'string' ? val.trim() : String(val))),
    z.string().optional()
  ),
  earliestArrival: z.preprocess(
    (val) => {
      if (val === null || val === undefined) return undefined;
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'string') return val;
      return val;
    },
    z.string().or(z.date()).optional()
  ),
  latestArrival: z.preprocess(
    (val) => {
      if (val === null || val === undefined) return undefined;
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'string') return val;
      return val;
    },
    z.string().or(z.date()).optional()
  ),
  contactName: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : (typeof val === 'string' ? val.trim() : String(val))),
    z.string().optional()
  ),
  contactPhone: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : (typeof val === 'string' ? val.trim() : String(val))),
    z.string().optional()
  ),
  items: z.preprocess(
    (val) => {
      if (!val || val === null) return undefined;
      if (Array.isArray(val)) {
        // Handle array of strings that should be objects
        return val.map((item) => {
          if (typeof item === 'string') {
            try {
              return JSON.parse(item);
            } catch {
              return { description: item };
            }
          }
          return item;
        });
      }
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
  notes: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : (typeof val === 'string' ? val.trim() : String(val))),
    z.string().optional()
  ),
  specialInstructions: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : (typeof val === 'string' ? val.trim() : String(val))),
    z.string().optional()
  ),
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
  pickupLocation: z.string().optional().nullable(),
  pickupAddress: z.string().optional().nullable(),
  pickupCity: z.string().optional().nullable(),
  pickupState: z.string().length(2, 'State must be 2 characters').or(z.literal('')).optional().nullable(),
  pickupZip: z.string().min(5, 'ZIP code is required').or(z.literal('')).optional().nullable(),
  pickupDate: z.string().or(z.date()).optional().nullable(),
  pickupTimeStart: z.string().or(z.date()).optional().nullable(),
  pickupTimeEnd: z.string().or(z.date()).optional().nullable(),
  pickupContact: z.string().optional().nullable(),
  pickupPhone: z.string().optional().nullable(),
  pickupNotes: z.string().optional().nullable(),
  pickupCompany: z.string().optional().nullable(),

  // Single delivery (optional if stops are provided)
  deliveryLocation: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  deliveryCity: z.string().optional().nullable(),
  deliveryState: z.string().length(2, 'State must be 2 characters').or(z.literal('')).optional().nullable(),
  deliveryZip: z.string().min(5, 'ZIP code is required').or(z.literal('')).optional().nullable(),
  deliveryDate: z.string().or(z.date()).optional().nullable(),
  deliveryTimeStart: z.string().or(z.date()).optional().nullable(),
  deliveryTimeEnd: z.string().or(z.date()).optional().nullable(),
  deliveryContact: z.string().optional().nullable(),
  deliveryPhone: z.string().optional().nullable(),
  deliveryNotes: z.string().optional().nullable(),
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
    z.number({
      message: 'Weight must be a valid number',
    }).positive('Weight must be positive').optional().nullable()
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
    z.number().nonnegative().optional().nullable() // Allow 0 or positive, will be calculated if needed
  ),

  // Optional
  trailerNumber: z.string().optional().nullable(),
  dispatchNotes: z.string().optional().nullable(),
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
  serviceFee: z.preprocess(
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
      'BILLING_HOLD',
      'READY_TO_BILL'
    ]).optional(),
    dispatchStatus: z.preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') return null;
        return val;
      },
      z.enum([
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
      ]).optional().nullable()
    ),
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
    // Handle optional string fields that might be empty
    pickupState: z.preprocess(
      (val) => {
        if (val === null || val === '') return null;
        if (val === undefined) return undefined;
        if (typeof val === 'string') {
          const trimmed = val.trim();
          return trimmed === '' ? null : trimmed;
        }
        return val;
      },
      z.string().length(2, 'State must be 2 characters').optional().nullable()
    ),
    deliveryState: z.preprocess(
      (val) => {
        if (val === null || val === '') return null;
        if (val === undefined) return undefined;
        if (typeof val === 'string') {
          const trimmed = val.trim();
          return trimmed === '' ? null : trimmed;
        }
        return val;
      },
      z.string().length(2, 'State must be 2 characters').optional().nullable()
    ),
    pickupZip: z.preprocess(
      (val) => {
        if (val === null || val === '') return null;
        if (val === undefined) return undefined;
        if (typeof val === 'string') {
          const trimmed = val.trim();
          return trimmed === '' ? null : trimmed;
        }
        return val;
      },
      z.string().min(5, 'ZIP code is required').optional().nullable()
    ),
    deliveryZip: z.preprocess(
      (val) => {
        if (val === null || val === '') return null;
        if (val === undefined) return undefined;
        if (typeof val === 'string') {
          const trimmed = val.trim();
          return trimmed === '' ? null : trimmed;
        }
        return val;
      },
      z.string().min(5, 'ZIP code is required').optional().nullable()
    ),
    // Additional update fields
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
  })
  .passthrough(); // Allow any additional fields for flexibility

export type CreateLoadInput = z.infer<typeof createLoadSchema>;
export type UpdateLoadInput = z.infer<typeof updateLoadSchema>;

// ============================================
// ACCOUNTING-CRITICAL FIELD VALIDATION
// ============================================

/**
 * Fields required for invoicing
 */
export const INVOICE_REQUIRED_FIELDS = [
  'loadNumber',
  'customerId',
  'revenue',
  'weight',
] as const;

/**
 * Fields required for driver settlement
 */
export const SETTLEMENT_REQUIRED_FIELDS = [
  'loadNumber',
  'driverId',
  'totalMiles',
] as const;

export interface AccountingValidationResult {
  isValid: boolean;
  canInvoice: boolean;
  canSettle: boolean;
  errors: string[];
  warnings: string[];
  missingForInvoice: string[];
  missingForSettlement: string[];
}

/**
 * Validate load data for accounting operations
 * Returns detailed information about what's missing for invoicing and settlements
 */
export function validateLoadForAccounting(data: Partial<CreateLoadInput> | any): AccountingValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingForInvoice: string[] = [];
  const missingForSettlement: string[] = [];

  // Check invoice-required fields
  if (!data.loadNumber) {
    missingForInvoice.push('loadNumber');
  }
  if (!data.customerId) {
    missingForInvoice.push('customerId');
    errors.push('Customer is required for invoicing');
  }
  if (data.revenue === undefined || data.revenue === null) {
    missingForInvoice.push('revenue');
    errors.push('Revenue is required for invoicing');
  } else if (data.revenue <= 0) {
    warnings.push('Revenue is $0 - invoice will have no amount');
  }
  if (!data.weight || data.weight <= 0) {
    missingForInvoice.push('weight');
    warnings.push('Weight is missing or zero - BOL validation may fail');
  }

  // Check settlement-required fields
  if (!data.loadNumber) {
    missingForSettlement.push('loadNumber');
  }
  if (!data.driverId) {
    missingForSettlement.push('driverId');
    // Not an error - driver may not be assigned yet
  }

  // Check mileage for driver pay calculation
  const hasMileage = (data.totalMiles && data.totalMiles > 0) ||
    (data.loadedMiles && data.loadedMiles > 0);
  if (!hasMileage) {
    missingForSettlement.push('totalMiles');
    warnings.push('No mileage data - driver pay calculation may be inaccurate');
  }

  // Check driver pay
  if (data.driverId && (!data.driverPay || data.driverPay <= 0)) {
    warnings.push('Driver is assigned but driver pay is $0 - verify pay calculation');
  }

  // Check for data consistency
  if (data.revenue && data.driverPay && data.driverPay > data.revenue) {
    warnings.push('Driver pay exceeds revenue - this load will be unprofitable');
  }

  // Check fuel advance
  if (data.fuelAdvance && data.fuelAdvance > 0) {
    if (data.driverPay && data.fuelAdvance > data.driverPay) {
      warnings.push('Fuel advance exceeds driver pay - driver will owe money');
    }
  }

  const canInvoice = missingForInvoice.filter(f => f !== 'loadNumber').length === 0;
  const canSettle = missingForSettlement.length === 0 ||
    (missingForSettlement.length === 1 && missingForSettlement[0] === 'driverId');

  return {
    isValid: errors.length === 0,
    canInvoice,
    canSettle,
    errors,
    warnings,
    missingForInvoice,
    missingForSettlement,
  };
}

/**
 * Schema for validating load before invoicing
 */
export const invoiceReadyLoadSchema = z.object({
  loadNumber: z.string().min(1, 'Load number is required'),
  customerId: z.string().min(1, 'Customer is required for invoicing'),
  revenue: z.number().positive('Revenue must be greater than 0 for invoicing'),
  weight: z.number().positive('Weight is required for BOL validation'),
  status: z.enum(['DELIVERED', 'INVOICED', 'PAID']).optional(),
});

/**
 * Schema for validating load before driver settlement
 */
export const settlementReadyLoadSchema = z.object({
  loadNumber: z.string().min(1, 'Load number is required'),
  driverId: z.string().min(1, 'Driver must be assigned for settlement'),
  totalMiles: z.number().positive('Miles are required for pay calculation').optional(),
  loadedMiles: z.number().nonnegative().optional(),
  driverPay: z.number().nonnegative('Driver pay cannot be negative').optional(),
  fuelAdvance: z.number().nonnegative().default(0),
});

export type InvoiceReadyLoad = z.infer<typeof invoiceReadyLoadSchema>;
export type SettlementReadyLoad = z.infer<typeof settlementReadyLoadSchema>;

/**
 * Lenient import schema for bulk load imports
 * - Doesn't require 2-character state codes (accepts any string)
 * - Doesn't require all single-stop load fields
 * - More forgiving with missing data
 */
export const importLoadSchema = baseLoadSchema
  .extend({
    // Override state fields to accept any string (will be normalized later)
    pickupState: z.string().optional(),
    deliveryState: z.string().optional(),
    pickupZip: z.string().optional(),
    deliveryZip: z.string().optional(),
    // Make location fields truly optional for import
    pickupLocation: z.string().optional(),
    pickupAddress: z.string().optional(),
    pickupCity: z.string().optional(),
    deliveryLocation: z.string().optional(),
    deliveryAddress: z.string().optional(),
    deliveryCity: z.string().optional(),
    pickupDate: z.string().or(z.date()).optional(),
    deliveryDate: z.string().or(z.date()).optional(),
  })
  .passthrough(); // Allow any additional fields

export type ImportLoadInput = z.infer<typeof importLoadSchema>;
