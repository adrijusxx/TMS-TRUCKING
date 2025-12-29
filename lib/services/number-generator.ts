/**
 * Number Generator Service
 * 
 * Auto-generates user-facing identifier numbers with prefixes for all entities.
 * These numbers are used instead of database UUIDs in the UI.
 */

import { prisma } from '@/lib/prisma';

export type EntityType =
  | 'driver'
  | 'truck'
  | 'trailer'
  | 'load'
  | 'settlement'
  | 'invoice'
  | 'payment'
  | 'customer'
  | 'vendor'
  | 'inspection'
  | 'inventoryItem'
  | 'breakdown'
  | 'safetyIncident'
  | 'location'
  | 'employee'
  | 'maintenance'
  | 'fuelEntry'
  | 'advance'
  | 'expense'
  | 'communication';

interface NumberConfig {
  prefix: string;
  format: 'simple' | 'yearly' | 'weekly';
  startFrom?: number;
}

const NUMBER_CONFIGS: Record<EntityType, NumberConfig> = {
  driver: { prefix: 'D', format: 'simple', startFrom: 1 },
  truck: { prefix: 'T', format: 'simple', startFrom: 1 },
  trailer: { prefix: 'TR', format: 'simple', startFrom: 1 },
  load: { prefix: 'L', format: 'yearly' },
  settlement: { prefix: 'S', format: 'weekly' },
  invoice: { prefix: 'INV', format: 'yearly' },
  payment: { prefix: 'PAY', format: 'yearly' },
  customer: { prefix: 'C', format: 'simple', startFrom: 1 },
  vendor: { prefix: 'V', format: 'simple', startFrom: 1 },
  inspection: { prefix: 'INSP', format: 'yearly' },
  inventoryItem: { prefix: 'ITEM', format: 'simple', startFrom: 1 },
  breakdown: { prefix: 'BRK', format: 'yearly' },
  safetyIncident: { prefix: 'INC', format: 'yearly' },
  location: { prefix: 'LOC', format: 'simple', startFrom: 1 },
  employee: { prefix: 'EMP', format: 'simple', startFrom: 1 },
  maintenance: { prefix: 'MAINT', format: 'yearly' },
  fuelEntry: { prefix: 'FUEL', format: 'yearly' },
  advance: { prefix: 'ADV', format: 'yearly' },
  expense: { prefix: 'EXP', format: 'yearly' },
  communication: { prefix: 'COMM', format: 'yearly' },
};

/**
 * Get the current year for yearly formats
 */
function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}

/**
 * Get the current week number for weekly formats
 */
function getCurrentWeek(): string {
  const date = new Date();
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
  return `W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Get the next sequential number for an entity type
 */
async function getNextSequence(
  entityType: EntityType,
  prefix: string
): Promise<number> {
  // Query the database for the latest number with this prefix
  const modelMap: Record<string, string> = {
    driver: 'driver',
    truck: 'truck',
    trailer: 'trailer',
    load: 'load',
    settlement: 'settlement',
    invoice: 'invoice',
    payment: 'payment',
    customer: 'customer',
    vendor: 'vendor',
    inspection: 'inspection',
    inventoryItem: 'inventoryItem',
    breakdown: 'breakdown',
    safetyIncident: 'safetyIncident',
    location: 'location',
    employee: 'user',
    maintenance: 'maintenanceRecord',
    fuelEntry: 'fuelEntry',
    advance: 'driverAdvance',
    expense: 'loadExpense',
    communication: 'communication',
  };

  const fieldMap: Record<string, string> = {
    driver: 'driverNumber',
    truck: 'truckNumber',
    trailer: 'trailerNumber',
    load: 'loadNumber',
    settlement: 'settlementNumber',
    invoice: 'invoiceNumber',
    payment: 'paymentNumber',
    customer: 'customerNumber',
    vendor: 'vendorNumber',
    inspection: 'inspectionNumber',
    inventoryItem: 'itemNumber',
    breakdown: 'breakdownNumber',
    safetyIncident: 'incidentNumber',
    location: 'locationNumber',
    employee: 'employeeNumber',
    maintenance: 'maintenanceNumber',
    fuelEntry: 'fuelEntryNumber',
    advance: 'advanceNumber',
    expense: 'expenseNumber',
    communication: 'ticketNumber',
  };

  const model = (prisma as any)[modelMap[entityType]];
  const field = fieldMap[entityType];

  if (!model || !field) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  // Get the latest record with a number starting with this prefix
  const latestRecord = await model.findFirst({
    where: {
      [field]: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!latestRecord || !latestRecord[field]) {
    return 1;
  }

  // Extract the number from the end of the identifier
  const lastNumber = latestRecord[field];
  const match = lastNumber.match(/(\d+)$/);
  
  if (!match) {
    return 1;
  }

  return parseInt(match[1], 10) + 1;
}

/**
 * Generate a unique identifier number for an entity
 */
export async function generateNumber(entityType: EntityType): Promise<string> {
  const config = NUMBER_CONFIGS[entityType];

  if (!config) {
    throw new Error(`No configuration found for entity type: ${entityType}`);
  }

  const { prefix, format, startFrom = 1 } = config;

  let generatedNumber: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error(
        `Failed to generate unique number for ${entityType} after ${maxAttempts} attempts`
      );
    }

    switch (format) {
      case 'simple': {
        // Format: PREFIX + NUMBER (e.g., D001, T245, C001)
        const sequence = await getNextSequence(entityType, prefix);
        const paddedSequence = sequence.toString().padStart(3, '0');
        generatedNumber = `${prefix}${paddedSequence}`;
        break;
      }

      case 'yearly': {
        // Format: PREFIX-YEAR-NUMBER (e.g., L2024-001, INV-2024-1543)
        const year = getCurrentYear();
        const yearPrefix = `${prefix}-${year}`;
        const sequence = await getNextSequence(entityType, yearPrefix);
        const paddedSequence = sequence.toString().padStart(3, '0');
        generatedNumber = `${yearPrefix}-${paddedSequence}`;
        break;
      }

      case 'weekly': {
        // Format: PREFIX-YEAR-WEEK-NUMBER (e.g., S2024-W49-001)
        const year = getCurrentYear();
        const week = getCurrentWeek();
        const weekPrefix = `${prefix}-${year}-${week}`;
        const sequence = await getNextSequence(entityType, weekPrefix);
        const paddedSequence = sequence.toString().padStart(3, '0');
        generatedNumber = `${weekPrefix}-${paddedSequence}`;
        break;
      }

      default:
        throw new Error(`Invalid format: ${format}`);
    }

    // Verify uniqueness by checking if the number already exists
    const fieldMap: Record<string, string> = {
      driver: 'driverNumber',
      truck: 'truckNumber',
      trailer: 'trailerNumber',
      load: 'loadNumber',
      settlement: 'settlementNumber',
      invoice: 'invoiceNumber',
      payment: 'paymentNumber',
      customer: 'customerNumber',
      vendor: 'vendorNumber',
      inspection: 'inspectionNumber',
      inventoryItem: 'itemNumber',
      breakdown: 'breakdownNumber',
      safetyIncident: 'incidentNumber',
      location: 'locationNumber',
      employee: 'employeeNumber',
      maintenance: 'maintenanceNumber',
      fuelEntry: 'fuelEntryNumber',
      advance: 'advanceNumber',
      expense: 'expenseNumber',
      communication: 'ticketNumber',
    };

    const modelMap: Record<string, string> = {
      driver: 'driver',
      truck: 'truck',
      trailer: 'trailer',
      load: 'load',
      settlement: 'settlement',
      invoice: 'invoice',
      payment: 'payment',
      customer: 'customer',
      vendor: 'vendor',
      inspection: 'inspection',
      inventoryItem: 'inventoryItem',
      breakdown: 'breakdown',
      safetyIncident: 'safetyIncident',
      location: 'location',
      employee: 'user',
      maintenance: 'maintenanceRecord',
      fuelEntry: 'fuelEntry',
      advance: 'driverAdvance',
      expense: 'loadExpense',
      communication: 'communication',
    };

    const model = (prisma as any)[modelMap[entityType]];
    const field = fieldMap[entityType];

    const existing = await model.findFirst({
      where: {
        [field]: generatedNumber,
      },
    });

    if (!existing) {
      break; // Unique number found
    }
  } while (attempts <= maxAttempts);

  return generatedNumber;
}

/**
 * Validate a number format for an entity type
 */
export function validateNumber(
  entityType: EntityType,
  number: string
): boolean {
  const config = NUMBER_CONFIGS[entityType];

  if (!config) {
    return false;
  }

  const { prefix, format } = config;

  switch (format) {
    case 'simple':
      // Format: PREFIX + NUMBER (e.g., D001)
      return new RegExp(`^${prefix}\\d+$`).test(number);

    case 'yearly':
      // Format: PREFIX-YEAR-NUMBER (e.g., L2024-001)
      return new RegExp(`^${prefix}-\\d{4}-\\d+$`).test(number);

    case 'weekly':
      // Format: PREFIX-YEAR-WEEK-NUMBER (e.g., S2024-W49-001)
      return new RegExp(`^${prefix}-\\d{4}-W\\d{2}-\\d+$`).test(number);

    default:
      return false;
  }
}

/**
 * Parse entity type from a number
 */
export function parseEntityType(number: string): EntityType | null {
  for (const [entityType, config] of Object.entries(NUMBER_CONFIGS)) {
    if (validateNumber(entityType as EntityType, number)) {
      return entityType as EntityType;
    }
  }

  return null;
}





