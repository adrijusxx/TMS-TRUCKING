import { prisma } from '@/lib/prisma';
import { LoadStatus } from '@prisma/client';
import { logger } from '@/lib/utils/logger';
import { ValidationError } from '@/lib/errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportResult {
  success: boolean;
  created?: number;
  errors?: number;
  error?: string;
  details?: { created: any[]; errors: any[] };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize headers: lowercase, replace spaces with underscores */
function normalizeHeaders(headers: string[]): string[] {
  return headers.map(h => String(h || '').trim().toLowerCase().replace(/\s+/g, '_'));
}

/** Get a value from a row by trying multiple header names */
function createValueGetter(normalizedHeaders: string[]) {
  return (row: any, headerNames: string[]): any => {
    for (const name of headerNames) {
      const idx = normalizedHeaders.indexOf(name.toLowerCase().replace(/\s+/g, '_'));
      if (idx >= 0 && row[idx] !== undefined && row[idx] !== null && row[idx] !== '') {
        return row[idx];
      }
    }
    return null;
  };
}

/** Parse date safely */
function parseDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Parse comma-separated tags */
function parseTags(value: any): any {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(t => t.trim()).filter(Boolean);
  return null;
}

/** Resolve or create an MC number, returning its ID */
async function resolveMcNumberId(
  companyId: string,
  mcNumberValue: string | null,
  currentMcNumberId?: string | null,
): Promise<string> {
  const val = mcNumberValue || currentMcNumberId;
  if (val) {
    let mc = await prisma.mcNumber.findFirst({ where: { companyId, number: val } });
    if (!mc) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      mc = await prisma.mcNumber.create({
        data: { companyId, number: val, companyName: company?.name || 'Company', type: 'CARRIER', isDefault: false },
      });
    }
    return mc.id;
  }
  const defaultMc = await prisma.mcNumber.findFirst({ where: { companyId, isDefault: true } });
  if (!defaultMc) throw new ValidationError('No MC number specified and no default MC number found');
  return defaultMc.id;
}

function mapLoadStatus(status: string): LoadStatus {
  const map: Record<string, LoadStatus> = {
    PENDING: LoadStatus.PENDING, ASSIGNED: LoadStatus.ASSIGNED,
    'EN ROUTE PICKUP': LoadStatus.EN_ROUTE_PICKUP, 'AT PICKUP': LoadStatus.AT_PICKUP,
    LOADED: LoadStatus.LOADED, 'EN ROUTE DELIVERY': LoadStatus.EN_ROUTE_DELIVERY,
    'AT DELIVERY': LoadStatus.AT_DELIVERY, DELIVERED: LoadStatus.DELIVERED,
    INVOICED: LoadStatus.INVOICED, PAID: LoadStatus.PAID, CANCELLED: LoadStatus.CANCELLED,
  };
  return map[status.toUpperCase()] || LoadStatus.PENDING;
}

// ---------------------------------------------------------------------------
// Entity Importers
// ---------------------------------------------------------------------------

async function importCustomers(
  getValue: ReturnType<typeof createValueGetter>,
  rows: any[], companyId: string, currentMcNumberId?: string | null,
): Promise<ImportResult> {
  const created: any[] = [];
  const errors: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const name = getValue(row, ['Company name', 'Company Name', 'name']);
      if (!name) { errors.push({ row: i + 1, error: 'Company name is required' }); continue; }

      const customerNumber = getValue(row, ['Customer Number', 'customer_number']) || `CUST-${Date.now()}-${i}`;
      const existing = await prisma.customer.findFirst({
        where: { companyId, deletedAt: null, OR: [{ customerNumber }, { name: { equals: name, mode: 'insensitive' } }] },
      });
      if (existing) { errors.push({ row: i + 1, error: `Customer already exists: ${name}` }); continue; }

      const rateConfRequired = getValue(row, ['Rate confirmation required', 'Rate Confirmation Required']);
      const customer = await prisma.customer.create({
        data: {
          companyId, customerNumber, name,
          type: getValue(row, ['Customer type', 'Customer Type', 'type']) || 'DIRECT',
          mcNumber: getValue(row, ['MC Number', 'mc_number']) || currentMcNumberId || null,
          location: getValue(row, ['Location', 'location']),
          website: getValue(row, ['Website', 'website']),
          referenceNumber: getValue(row, ['Reference number', 'reference_number']),
          address: getValue(row, ['Address', 'address']) || '',
          city: getValue(row, ['City', 'city']) || '',
          state: getValue(row, ['State', 'state']) || '',
          zip: getValue(row, ['ZIP', 'Zip', 'zip']) || '',
          phone: getValue(row, ['Contact number', 'Contact Number', 'Phone', 'phone']) || '',
          contactNumber: getValue(row, ['Contact number', 'contact_number']),
          email: getValue(row, ['Email', 'email']) || '',
          billingAddress: getValue(row, ['Billing Address', 'billing_address']),
          billingEmails: getValue(row, ['Billing emails', 'billing_emails']),
          billingType: getValue(row, ['Billing type', 'billing_type']),
          rateConfirmationRequired: rateConfRequired === true || rateConfRequired === 'Yes' || rateConfRequired === 'yes',
          status: getValue(row, ['Status', 'status']),
          tags: parseTags(getValue(row, ['Tags', 'tags'])),
          warning: getValue(row, ['Warning', 'warning']),
          creditRate: parseFloat(getValue(row, ['Credit rate', 'credit_rate']) || '0') || null,
          riskLevel: getValue(row, ['Risk level', 'risk_level']),
          comments: getValue(row, ['Commnets', 'Comments', 'comments']),
        },
      });
      created.push(customer);
    } catch (error: any) {
      errors.push({ row: i + 1, error: error.message || 'Failed to create customer' });
    }
  }
  return { success: true, created: created.length, errors: errors.length, details: { created, errors } };
}

async function importTrucks(
  getValue: ReturnType<typeof createValueGetter>,
  rows: any[], companyId: string, currentMcNumberId?: string | null,
): Promise<ImportResult> {
  const created: any[] = [];
  const errors: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const truckNumber = getValue(row, ['Unit number', 'Unit Number', 'truck_number', 'Truck Number']);
      const vin = getValue(row, ['Vin', 'VIN', 'vin']);
      if (!truckNumber) { errors.push({ row: i + 1, error: 'Unit number is required' }); continue; }
      if (!vin) { errors.push({ row: i + 1, error: 'VIN is required' }); continue; }

      const existing = await prisma.truck.findFirst({ where: { companyId, deletedAt: null, OR: [{ truckNumber }, { vin }] } });
      if (existing) { errors.push({ row: i + 1, error: `Truck already exists: ${truckNumber}` }); continue; }

      const mcNumberId = await resolveMcNumberId(companyId, getValue(row, ['MC number', 'MC Number', 'mc_number']), currentMcNumberId);

      const truck = await prisma.truck.create({
        data: {
          companyId, truckNumber, vin,
          make: getValue(row, ['Make', 'make']) || '',
          model: getValue(row, ['Model', 'model']) || '',
          year: parseInt(getValue(row, ['Year', 'year']) || '0') || new Date().getFullYear(),
          licensePlate: getValue(row, ['Plate number', 'Plate Number', 'license_plate']) || '',
          state: getValue(row, ['State', 'state']) || '',
          mcNumberId, equipmentType: 'DRY_VAN', capacity: 45000,
          status: getValue(row, ['Status', 'status']) || 'AVAILABLE',
          fleetStatus: getValue(row, ['Fleet Status', 'fleet_status']),
          ownership: getValue(row, ['Ownership', 'ownership']),
          ownerName: getValue(row, ['Owner name', 'Owner Name', 'owner_name']),
          odometerReading: parseFloat(getValue(row, ['Odometer', 'odometer']) || '0') || 0,
          registrationExpiry: parseDate(getValue(row, ['Registration expiry date', 'registration_expiry'])) || new Date(),
          insuranceExpiry: parseDate(getValue(row, ['Insurance expiry date', 'insurance_expiry'])) || new Date(),
          inspectionExpiry: parseDate(getValue(row, ['Annual inspection expiry date', 'inspection_expiry'])) || new Date(),
          tollTagNumber: getValue(row, ['Toll tag number', 'toll_tag_number']),
          fuelCard: getValue(row, ['Fuel card', 'Fuel Card', 'fuel_card']),
          tags: parseTags(getValue(row, ['Tags', 'tags'])),
          notes: getValue(row, ['Notes', 'notes']),
          warnings: getValue(row, ['Warnings', 'warnings']),
        },
      });
      created.push(truck);
    } catch (error: any) {
      errors.push({ row: i + 1, error: error.message || 'Failed to create truck' });
    }
  }
  return { success: true, created: created.length, errors: errors.length, details: { created, errors } };
}

async function importTrailers(
  getValue: ReturnType<typeof createValueGetter>,
  rows: any[], companyId: string, currentMcNumberId?: string | null,
): Promise<ImportResult> {
  const created: any[] = [];
  const errors: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const trailerNumber = getValue(row, ['Unit number', 'Unit Number', 'trailer_number']);
      if (!trailerNumber) { errors.push({ row: i + 1, error: 'Unit number is required' }); continue; }

      const existing = await prisma.trailer.findFirst({ where: { companyId, deletedAt: null, trailerNumber } });
      if (existing) { errors.push({ row: i + 1, error: `Trailer already exists: ${trailerNumber}` }); continue; }

      const assignedTruckNumber = getValue(row, ['Assigned truck', 'Assigned Truck', 'assigned_truck']);
      let assignedTruckId: string | null = null;
      if (assignedTruckNumber) {
        const truck = await prisma.truck.findFirst({ where: { companyId, deletedAt: null, truckNumber: assignedTruckNumber } });
        if (truck) assignedTruckId = truck.id;
      }

      const mcNumberId = await resolveMcNumberId(companyId, getValue(row, ['MC Number', 'mc_number']), currentMcNumberId);

      const trailer = await prisma.trailer.create({
        data: {
          companyId, trailerNumber,
          vin: getValue(row, ['Vin', 'VIN', 'vin']),
          make: getValue(row, ['Make', 'make']) || '',
          model: getValue(row, ['Model', 'model']) || '',
          year: parseInt(getValue(row, ['Year', 'year']) || '0') || null,
          licensePlate: getValue(row, ['Plate number', 'Plate Number', 'license_plate']),
          state: getValue(row, ['State', 'state']),
          mcNumberId, type: getValue(row, ['Type', 'type']),
          ownership: getValue(row, ['Ownership', 'ownership']),
          ownerName: getValue(row, ['Owner name', 'Owner Name', 'owner_name']),
          assignedTruckId,
          status: getValue(row, ['Status', 'status']),
          fleetStatus: getValue(row, ['Fleet Status', 'fleet_status']),
          registrationExpiry: parseDate(getValue(row, ['Registration expiry date', 'Registration Expiry Date'])),
          inspectionExpiry: parseDate(getValue(row, ['Annual inspection expiry date', 'Annual Inspection Expiry Date'])),
          insuranceExpiry: parseDate(getValue(row, ['Insurance expiry date', 'Insurance Expiry Date'])),
          legacyTags: parseTags(getValue(row, ['Tags', 'tags'])),
        },
      });
      created.push(trailer);
    } catch (error: any) {
      errors.push({ row: i + 1, error: error.message || 'Failed to create trailer' });
    }
  }
  return { success: true, created: created.length, errors: errors.length, details: { created, errors } };
}

async function importVendors(
  getValue: ReturnType<typeof createValueGetter>,
  rows: any[], companyId: string,
): Promise<ImportResult> {
  const created: any[] = [];
  const errors: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const name = getValue(row, ['Vendor name', 'Vendor Name', 'name']);
      if (!name) { errors.push({ row: i + 1, error: 'Vendor name is required' }); continue; }

      const vendorNumber = getValue(row, ['ID', 'id', 'Vendor Number', 'vendor_number']) || `VEND-${Date.now()}-${i}`;
      const existing = await prisma.vendor.findFirst({
        where: { companyId, deletedAt: null, OR: [{ vendorNumber }, { name: { equals: name, mode: 'insensitive' } }] },
      });
      if (existing) { errors.push({ row: i + 1, error: `Vendor already exists: ${name}` }); continue; }

      const vendorType = getValue(row, ['Type', 'type']) || 'SUPPLIER';
      const mappedType = vendorType === 'BILLS' || vendorType === 'bills' ? 'SERVICE_PROVIDER' : 'SUPPLIER';

      const vendor = await prisma.vendor.create({
        data: {
          companyId, vendorNumber, name, type: mappedType as any,
          email: getValue(row, ['Email', 'email']),
          phone: getValue(row, ['Contact number', 'Contact Number', 'phone']),
          tag: getValue(row, ['Tag', 'tag']),
        },
      });
      created.push(vendor);
    } catch (error: any) {
      errors.push({ row: i + 1, error: error.message || 'Failed to create vendor' });
    }
  }
  return { success: true, created: created.length, errors: errors.length, details: { created, errors } };
}

async function importLocations(
  getValue: ReturnType<typeof createValueGetter>,
  rows: any[], companyId: string,
): Promise<ImportResult> {
  const created: any[] = [];
  const errors: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const name = getValue(row, ['Place name', 'Place Name', 'name']);
      const address = getValue(row, ['Address', 'address']);
      const city = getValue(row, ['City', 'city']);
      const state = getValue(row, ['State', 'state']);
      if (!name || !address || !city || !state) {
        errors.push({ row: i + 1, error: 'Place name, Address, City, and State are required' }); continue;
      }

      const existing = await prisma.location.findFirst({
        where: {
          companyId, deletedAt: null,
          name: { equals: name, mode: 'insensitive' },
          address: { equals: address, mode: 'insensitive' },
          city: { equals: city, mode: 'insensitive' },
          state: { equals: state, mode: 'insensitive' },
        },
      });
      if (existing) { errors.push({ row: i + 1, error: `Location already exists: ${name}` }); continue; }

      const location = await prisma.location.create({
        data: {
          companyId, locationNumber: `LOC-${Date.now()}-${i}`,
          name, locationCompany: getValue(row, ['Company', 'company']),
          address, city, state, zip: getValue(row, ['ZIP', 'Zip', 'zip']),
          contactName: getValue(row, ['Contact name', 'Contact Name', 'contact_name']),
        },
      });
      created.push(location);
    } catch (error: any) {
      errors.push({ row: i + 1, error: error.message || 'Failed to create location' });
    }
  }
  return { success: true, created: created.length, errors: errors.length, details: { created, errors } };
}

async function importLoads(
  getValue: ReturnType<typeof createValueGetter>,
  rows: any[], companyId: string, currentMcNumberId?: string | null,
): Promise<ImportResult> {
  const created: any[] = [];
  const errors: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const loadNumber = getValue(row, ['Load ID', 'load_id', 'load_number']) || getValue(row, ['Shipment ID', 'shipment_id']) || `LOAD-${Date.now()}-${i}`;
      const existing = await prisma.load.findFirst({ where: { companyId, deletedAt: null, loadNumber } });
      if (existing) { errors.push({ row: i + 1, error: `Load already exists: ${loadNumber}` }); continue; }

      const customerName = getValue(row, ['Customer', 'customer']);
      if (!customerName) { errors.push({ row: i + 1, error: 'Customer is required' }); continue; }

      const customer = await prisma.customer.findFirst({
        where: { companyId, deletedAt: null, name: { contains: customerName, mode: 'insensitive' } },
      });
      if (!customer) { errors.push({ row: i + 1, error: `Customer not found: ${customerName}` }); continue; }

      // Find truck / trailer
      let truckId: string | null = null;
      const truckNumber = getValue(row, ['Truck', 'truck']);
      if (truckNumber) {
        const truck = await prisma.truck.findFirst({ where: { companyId, deletedAt: null, truckNumber } });
        if (truck) truckId = truck.id;
      }
      let trailerId: string | null = null;
      const trailerNumber = getValue(row, ['Trailer', 'trailer']);
      if (trailerNumber) {
        const trailer = await prisma.trailer.findFirst({ where: { companyId, deletedAt: null, trailerNumber } });
        if (trailer) trailerId = trailer.id;
      }

      // Parse locations
      const { pickupCity, pickupState, deliveryCity, deliveryState } = parseLoadLocations(getValue, row);

      // Financial metrics
      const revenue = parseFloat(getValue(row, ['Load pay', 'Load Pay', 'revenue', 'Total Pay', 'Rate', 'rate']) || '0') || 0;
      const totalMiles = parseFloat(getValue(row, ['Total miles', 'Total Miles', 'total_miles', 'Miles']) || '0') || null;
      const loadedMiles = parseFloat(getValue(row, ['Loaded miles', 'Loaded Miles', 'loaded_miles']) || '0') || null;
      const emptyMiles = parseFloat(getValue(row, ['Empty miles', 'Empty Miles', 'empty_miles']) || '0') || null;
      const weight = parseFloat(getValue(row, ['Weight', 'weight', 'Lbs', 'lbs']) || '0') || 0;

      const explicitRPM = parseFloat(getValue(row, ['RPM', 'rpm', 'Rate Per Mile', 'rate_per_mile']) || '0');
      const revenuePerMile = explicitRPM > 0 ? explicitRPM
        : (revenue > 0 && totalMiles && totalMiles > 0) ? Number((revenue / totalMiles).toFixed(2)) : 0;

      const load = await prisma.load.create({
        data: {
          companyId, loadNumber, customerId: customer.id, truckId, trailerId,
          loadType: 'FTL', equipmentType: 'DRY_VAN',
          pickupCity: pickupCity || '', pickupState: pickupState || '',
          deliveryCity: deliveryCity || '', deliveryState: deliveryState || '',
          pickupDate: parseDate(getValue(row, ['Pickup Date', 'pickup_date', 'PU Date'])) || new Date(),
          deliveryDate: parseDate(getValue(row, ['DEL date', 'DEL Date', 'Delivery Date', 'delivery_date'])),
          revenue, weight,
          shipmentId: getValue(row, ['Shipment ID', 'shipment_id', 'Ref', 'ref']),
          totalMiles, loadedMiles, emptyMiles, revenuePerMile,
          status: mapLoadStatus(getValue(row, ['Load status', 'Load Status', 'status']) || 'PENDING'),
          mcNumberId: currentMcNumberId,
        },
      });
      created.push(load);
    } catch (error: any) {
      errors.push({ row: i + 1, error: error.message || 'Failed to create load' });
    }
  }
  return { success: true, created: created.length, errors: errors.length, details: { created, errors } };
}

function parseLoadLocations(getValue: ReturnType<typeof createValueGetter>, row: any) {
  let pickupCity = '', pickupState = '', deliveryCity = '', deliveryState = '';

  const pickupLoc = getValue(row, ['Pickup location', 'Pickup Location', 'pickup_location', 'Origin', 'origin']);
  const deliveryLoc = getValue(row, ['Delivery location', 'Delivery Location', 'delivery_location', 'Destination', 'destination']);

  const parseLoc = (loc: string | null) => {
    if (!loc) return null;
    const parts = loc.split(',').map(p => p.trim());
    return parts.length >= 2 ? { city: parts[0], state: parts[1] } : null;
  };

  const pParsed = parseLoc(pickupLoc);
  const dParsed = parseLoc(deliveryLoc);
  if (pParsed) { pickupCity = pParsed.city; pickupState = pParsed.state; }
  if (dParsed) { deliveryCity = dParsed.city; deliveryState = dParsed.state; }

  const spc = getValue(row, ['Pickup City', 'pickup_city', 'Origin City', 'PU City']);
  const sps = getValue(row, ['Pickup State', 'pickup_state', 'Origin State', 'PU State']);
  const sdc = getValue(row, ['Delivery City', 'delivery_city', 'Destination City', 'Dest City', 'DEL City']);
  const sds = getValue(row, ['Delivery State', 'delivery_state', 'Destination State', 'Dest State', 'DEL State']);

  if (spc) pickupCity = spc;
  if (sps) pickupState = sps;
  if (sdc) deliveryCity = sdc;
  if (sds) deliveryState = sds;

  return { pickupCity, pickupState, deliveryCity, deliveryState };
}

// ---------------------------------------------------------------------------
// Main Manager
// ---------------------------------------------------------------------------

/**
 * BulkImportManager - processes multiple Excel files for bulk entity import.
 * Extracted from the import-export/bulk route.
 */
export class BulkImportManager {
  static async importEntityData(
    entityType: string,
    headers: string[],
    rows: any[],
    companyId: string,
    currentMcNumberId?: string | null,
  ): Promise<ImportResult> {
    const normalizedHeaders = normalizeHeaders(headers);
    const getValue = createValueGetter(normalizedHeaders);

    switch (entityType) {
      case 'customers':
        return importCustomers(getValue, rows, companyId, currentMcNumberId);
      case 'trucks':
        return importTrucks(getValue, rows, companyId, currentMcNumberId);
      case 'trailers':
        return importTrailers(getValue, rows, companyId, currentMcNumberId);
      case 'vendors':
        return importVendors(getValue, rows, companyId);
      case 'locations':
        return importLocations(getValue, rows, companyId);
      case 'loads':
        return importLoads(getValue, rows, companyId, currentMcNumberId);
      default:
        return { success: false, created: 0, errors: [{ error: `Unknown entity type: ${entityType}` }] as any };
    }
  }
}
