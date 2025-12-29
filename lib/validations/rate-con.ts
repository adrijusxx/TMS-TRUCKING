/**
 * Rate Confirmation Parsing Schema
 * 
 * Schema for validating AI-extracted rate confirmation data.
 * Follows the "Draft First" approach - allows nulls for uncertain fields
 * so users can review and correct before saving.
 * 
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 1.2
 */

import { z } from 'zod';

// ============================================
// STOP SCHEMA (Spec-defined structure)
// ============================================

/**
 * Individual stop extracted from Rate Confirmation
 */
export const RateConStopSchema = z.object({
  sequence: z.number().int().positive(),
  type: z.enum(['PICKUP', 'DELIVERY']),
  facilityName: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().length(2).nullable(),
  zip: z.string().nullable(),
  date: z.string().nullable(), // ISO String
  timeWindow: z.string().nullable().optional(), // "08:00 - 16:00"
  // Extended fields (not in spec but commonly needed)
  contactName: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type RateConStop = z.infer<typeof RateConStopSchema>;

// ============================================
// MAIN RATE CON SCHEMA (Spec-defined)
// ============================================

/**
 * Primary Rate Confirmation extraction schema
 * 
 * Follows spec structure:
 * - referenceNumbers: External identifiers
 * - financials: Rate and payment info
 * - stops: Pickup/Delivery locations
 */
export const RateConSchema = z.object({
  referenceNumbers: z.object({
    rateConNumber: z.string().nullable(), // Primary Key for External
    brokerLoadId: z.string().nullable().optional(),
    brokerName: z.string().nullable(),
  }),
  financials: z.object({
    rate: z.number().nullable(),
    currency: z.enum(['USD', 'CAD']).default('USD'),
    detentionRate: z.number().nullable().optional(),
  }),
  stops: z.array(RateConStopSchema),
});

export type RateCon = z.infer<typeof RateConSchema>;

// ============================================
// EXTENDED EXTRACTION SCHEMA
// ============================================

/**
 * Extended extraction result with additional fields
 * commonly found on rate confirmations that we want to capture
 */
export const ExtractedRateConSchema = RateConSchema.extend({
  // Load specifications
  loadSpecs: z.object({
    weight: z.number().nullable().optional(),
    pieces: z.number().int().nullable().optional(),
    pallets: z.number().int().nullable().optional(),
    commodity: z.string().nullable().optional(),
    temperature: z.string().nullable().optional(), // For reefer
    hazmat: z.boolean().default(false),
    hazmatClass: z.string().nullable().optional(),
  }).optional(),
  
  // Equipment requirements
  equipment: z.object({
    type: z.enum([
      'DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK', 
      'LOWBOY', 'TANKER', 'CONESTOGA', 'POWER_ONLY', 'HOTSHOT'
    ]).nullable().optional(),
    loadType: z.enum(['FTL', 'LTL', 'PARTIAL', 'INTERMODAL']).nullable().optional(),
  }).optional(),
  
  // Mileage (if specified on rate con)
  mileage: z.object({
    total: z.number().nullable().optional(),
    loaded: z.number().nullable().optional(),
    empty: z.number().nullable().optional(),
  }).optional(),
  
  // Special instructions
  instructions: z.object({
    dispatch: z.string().nullable().optional(),
    pickup: z.string().nullable().optional(),
    delivery: z.string().nullable().optional(),
  }).optional(),
});

export type ExtractedRateCon = z.infer<typeof ExtractedRateConSchema>;

// ============================================
// EXTRACTION RESULT SCHEMA
// ============================================

/**
 * Complete extraction result with metadata
 */
export const RateConExtractionResultSchema = z.object({
  // Extracted data
  data: ExtractedRateConSchema,
  
  // Extraction metadata
  meta: z.object({
    confidence: z.enum(['high', 'medium', 'low']),
    extractedFieldCount: z.number().int(),
    missingCriticalFields: z.array(z.string()),
    missingImportantFields: z.array(z.string()),
    processingTimeMs: z.number().int(),
    modelUsed: z.string().optional(),
  }),
  
  // Warnings for user review
  warnings: z.array(z.string()),
});

export type RateConExtractionResult = z.infer<typeof RateConExtractionResultSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Critical fields that MUST be present for a valid load
 */
export const RATE_CON_CRITICAL_FIELDS = [
  'referenceNumbers.rateConNumber',
  'referenceNumbers.brokerName',
  'financials.rate',
] as const;

/**
 * Important fields that should be present but aren't blocking
 */
export const RATE_CON_IMPORTANT_FIELDS = [
  'stops[0].address',
  'stops[0].city',
  'stops[0].state',
  'stops[0].date',
  'loadSpecs.weight',
] as const;

/**
 * Check if extracted data has critical fields
 */
export function validateRateConCriticalFields(data: ExtractedRateCon): {
  isValid: boolean;
  missingCritical: string[];
  missingImportant: string[];
} {
  const missingCritical: string[] = [];
  const missingImportant: string[] = [];
  
  // Check critical fields
  if (!data.referenceNumbers?.rateConNumber) {
    missingCritical.push('rateConNumber');
  }
  if (!data.referenceNumbers?.brokerName) {
    missingCritical.push('brokerName');
  }
  if (data.financials?.rate === null || data.financials?.rate === undefined) {
    missingCritical.push('rate');
  }
  
  // Check important fields
  if (!data.stops || data.stops.length === 0) {
    missingImportant.push('stops');
  } else {
    const firstStop = data.stops[0];
    if (!firstStop?.address) missingImportant.push('pickupAddress');
    if (!firstStop?.city) missingImportant.push('pickupCity');
    if (!firstStop?.state) missingImportant.push('pickupState');
  }
  
  if (!data.loadSpecs?.weight) {
    missingImportant.push('weight');
  }
  
  return {
    isValid: missingCritical.length === 0,
    missingCritical,
    missingImportant,
  };
}

/**
 * Convert ExtractedRateCon to LoadForm-compatible format
 * This bridges the gap between extraction schema and existing load schema
 */
export function convertRateConToLoadInput(rateCon: ExtractedRateCon): Record<string, unknown> {
  const pickupStop = rateCon.stops?.find(s => s.type === 'PICKUP');
  const deliveryStop = rateCon.stops?.find(s => s.type === 'DELIVERY');
  const hasMultipleStops = (rateCon.stops?.length ?? 0) > 2;
  
  return {
    // Reference numbers
    loadNumber: rateCon.referenceNumbers?.rateConNumber || '',
    customerName: rateCon.referenceNumbers?.brokerName || '',
    
    // Financials
    revenue: rateCon.financials?.rate || 0,
    
    // Single pickup (for simple loads)
    ...(pickupStop && !hasMultipleStops ? {
      pickupLocation: pickupStop.facilityName || '',
      pickupAddress: pickupStop.address || '',
      pickupCity: pickupStop.city || '',
      pickupState: pickupStop.state || '',
      pickupZip: pickupStop.zip || '',
      pickupDate: pickupStop.date || '',
      pickupContact: pickupStop.contactName || '',
      pickupPhone: pickupStop.contactPhone || '',
      pickupNotes: pickupStop.notes || '',
    } : {}),
    
    // Single delivery (for simple loads)
    ...(deliveryStop && !hasMultipleStops ? {
      deliveryLocation: deliveryStop.facilityName || '',
      deliveryAddress: deliveryStop.address || '',
      deliveryCity: deliveryStop.city || '',
      deliveryState: deliveryStop.state || '',
      deliveryZip: deliveryStop.zip || '',
      deliveryDate: deliveryStop.date || '',
      deliveryContact: deliveryStop.contactName || '',
      deliveryPhone: deliveryStop.contactPhone || '',
      deliveryNotes: deliveryStop.notes || '',
    } : {}),
    
    // Multi-stop support
    ...(hasMultipleStops ? {
      stops: rateCon.stops?.map(stop => ({
        stopType: stop.type,
        sequence: stop.sequence,
        company: stop.facilityName,
        address: stop.address,
        city: stop.city,
        state: stop.state,
        zip: stop.zip,
        earliestArrival: stop.date,
        contactName: stop.contactName,
        contactPhone: stop.contactPhone,
        notes: stop.notes,
      })),
    } : {}),
    
    // Load specs
    weight: rateCon.loadSpecs?.weight || undefined,
    pieces: rateCon.loadSpecs?.pieces || undefined,
    pallets: rateCon.loadSpecs?.pallets || undefined,
    commodity: rateCon.loadSpecs?.commodity || '',
    temperature: rateCon.loadSpecs?.temperature || '',
    hazmat: rateCon.loadSpecs?.hazmat || false,
    hazmatClass: rateCon.loadSpecs?.hazmatClass || '',
    
    // Equipment
    equipmentType: rateCon.equipment?.type || 'DRY_VAN',
    loadType: rateCon.equipment?.loadType || 'FTL',
    
    // Mileage
    totalMiles: rateCon.mileage?.total || undefined,
    loadedMiles: rateCon.mileage?.loaded || undefined,
    emptyMiles: rateCon.mileage?.empty || undefined,
    
    // Instructions
    dispatchNotes: rateCon.instructions?.dispatch || '',
  };
}

// ============================================
// AI PROMPT SCHEMA (for structured output)
// ============================================

/**
 * JSON schema representation for AI response_format
 * Used with OpenAI/DeepSeek structured output mode
 */
export const RATE_CON_JSON_SCHEMA = {
  type: 'object',
  properties: {
    referenceNumbers: {
      type: 'object',
      properties: {
        rateConNumber: { type: ['string', 'null'] },
        brokerLoadId: { type: ['string', 'null'] },
        brokerName: { type: ['string', 'null'] },
      },
      required: ['rateConNumber', 'brokerName'],
    },
    financials: {
      type: 'object',
      properties: {
        rate: { type: ['number', 'null'] },
        currency: { type: 'string', enum: ['USD', 'CAD'] },
        detentionRate: { type: ['number', 'null'] },
      },
      required: ['rate'],
    },
    stops: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sequence: { type: 'number' },
          type: { type: 'string', enum: ['PICKUP', 'DELIVERY'] },
          facilityName: { type: ['string', 'null'] },
          address: { type: ['string', 'null'] },
          city: { type: ['string', 'null'] },
          state: { type: ['string', 'null'] },
          zip: { type: ['string', 'null'] },
          date: { type: ['string', 'null'] },
          timeWindow: { type: ['string', 'null'] },
        },
        required: ['sequence', 'type'],
      },
    },
    loadSpecs: {
      type: 'object',
      properties: {
        weight: { type: ['number', 'null'] },
        pieces: { type: ['number', 'null'] },
        pallets: { type: ['number', 'null'] },
        commodity: { type: ['string', 'null'] },
        temperature: { type: ['string', 'null'] },
        hazmat: { type: 'boolean' },
        hazmatClass: { type: ['string', 'null'] },
      },
    },
    equipment: {
      type: 'object',
      properties: {
        type: { type: ['string', 'null'] },
        loadType: { type: ['string', 'null'] },
      },
    },
    mileage: {
      type: 'object',
      properties: {
        total: { type: ['number', 'null'] },
        loaded: { type: ['number', 'null'] },
        empty: { type: ['number', 'null'] },
      },
    },
  },
  required: ['referenceNumbers', 'financials', 'stops'],
} as const;





