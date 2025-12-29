import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { LoadStatus } from '@prisma/client';
import { getCurrentMcNumber } from '@/lib/mc-number-filter';

/**
 * POST /api/import-export/bulk
 * Bulk import all Excel files from EXCEL-FILES folder
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission - admin only for bulk import
    if (!hasPermission(session.user.role, 'settings.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const excelFilesDir = join(process.cwd(), 'EXCEL-FILES');
    const files = [
      { name: 'customers_2025_11_13_19_58_24.xlsx', entity: 'customers' },
      { name: 'trucks_2025_11_13_19_57_59.xlsx', entity: 'trucks' },
      { name: 'trailers_2025_11_13_19_58_14.xlsx', entity: 'trailers' },
      { name: 'vendors_bills_2025_11_13_19_58_28.xlsx', entity: 'vendors' },
      { name: 'locations_2025_11_13_19_58_33.xlsx', entity: 'locations' },
      { name: 'loads-and-trips_2025_11_13_19_59_11.xlsx', entity: 'loads' },
    ];

    const results: any = {};

    for (const fileInfo of files) {
      const filePath = join(excelFilesDir, fileInfo.name);
      try {
        const fileBuffer = await readFile(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length <= 1) {
          results[fileInfo.entity] = { success: false, error: 'No data rows found' };
          continue;
        }

        const headers = data[0] as string[];
        const rows = data.slice(1) as any[];

        // Get current MC number for this import session
        const { mcNumber: currentMcNumber } = await getCurrentMcNumber(session, request);

        // Import based on entity type
        const importResult = await importEntityData(
          fileInfo.entity,
          headers,
          rows,
          session.user.companyId,
          currentMcNumber
        );

        results[fileInfo.entity] = importResult;
      } catch (error: any) {
        results[fileInfo.entity] = {
          success: false,
          error: error.message || 'Failed to import file',
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to perform bulk import',
        },
      },
      { status: 500 }
    );
  }
}

async function importEntityData(
  entityType: string,
  headers: string[],
  rows: any[],
  companyId: string,
  currentMcNumber?: string | null
): Promise<any> {
  const created: any[] = [];
  const errors: any[] = [];

  // Normalize headers (remove spaces, convert to lowercase)
  const normalizedHeaders = headers.map((h) =>
    String(h || '').trim().toLowerCase().replace(/\s+/g, '_')
  );

  // Helper to get value from row
  const getValue = (row: any, headerNames: string[]): any => {
    for (const headerName of headerNames) {
      const index = normalizedHeaders.indexOf(
        headerName.toLowerCase().replace(/\s+/g, '_')
      );
      if (index >= 0 && row[index] !== undefined && row[index] !== null && row[index] !== '') {
        return row[index];
      }
    }
    return null;
  };

  // Helper to parse date
  const parseDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  };

  // Helper to parse tags (comma-separated string to JSON array)
  const parseTags = (value: any): any => {
    if (!value) return null;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(',').map((t) => t.trim()).filter((t) => t);
    }
    return null;
  };

  switch (entityType) {
    case 'customers': {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const name = getValue(row, ['Company name', 'Company Name', 'name']);
          if (!name) {
            errors.push({ row: i + 1, error: 'Company name is required' });
            continue;
          }

          // Generate customer number if not provided
          const customerNumber =
            getValue(row, ['Customer Number', 'Customer Number', 'customer_number']) ||
            `CUST-${Date.now()}-${i}`;

          // Check if customer already exists
          const existing = await prisma.customer.findFirst({
            where: {
              companyId,
              deletedAt: null,
              OR: [{ customerNumber }, { name: { equals: name, mode: 'insensitive' } }],
            },
          });

          if (existing) {
            errors.push({ row: i + 1, error: `Customer already exists: ${name}` });
            continue;
          }

          const customer = await prisma.customer.create({
            data: {
              companyId,
              customerNumber,
              name,
              type: getValue(row, ['Customer type', 'Customer Type', 'type']) || 'DIRECT',
              mcNumber: getValue(row, ['MC Number', 'MC Number', 'mc_number']) || currentMcNumber || null,
              location: getValue(row, ['Location', 'location']),
              website: getValue(row, ['Website', 'website']),
              referenceNumber: getValue(row, ['Reference number', 'Reference Number', 'reference_number']),
              address: getValue(row, ['Address', 'address']) || '',
              city: getValue(row, ['City', 'city']) || '',
              state: getValue(row, ['State', 'state']) || '',
              zip: getValue(row, ['ZIP', 'Zip', 'zip']) || '',
              phone: getValue(row, ['Contact number', 'Contact Number', 'Phone', 'phone']) || '',
              contactNumber: getValue(row, ['Contact number', 'Contact Number', 'contact_number']),
              email: getValue(row, ['Email', 'email']) || '',
              billingAddress: getValue(row, ['Billing Address', 'Billing Address', 'billing_address']),
              billingEmails: getValue(row, ['Billing emails', 'Billing Emails', 'billing_emails']),
              billingType: getValue(row, ['Billing type', 'Billing Type', 'billing_type']),
              rateConfirmationRequired:
                getValue(row, ['Rate confirmation required', 'Rate Confirmation Required']) === true ||
                getValue(row, ['Rate confirmation required', 'Rate Confirmation Required']) === 'Yes' ||
                getValue(row, ['Rate confirmation required', 'Rate Confirmation Required']) === 'yes',
              status: getValue(row, ['Status', 'status']),
              tags: parseTags(getValue(row, ['Tags', 'tags'])),
              warning: getValue(row, ['Warning', 'warning']),
              creditRate: parseFloat(getValue(row, ['Credit rate', 'Credit Rate', 'credit_rate']) || '0') || null,
              riskLevel: getValue(row, ['Risk level', 'Risk Level', 'risk_level']),
              comments: getValue(row, ['Commnets', 'Comments', 'comments']), // Note: Excel typo "Commnets"
            },
          });

          created.push(customer);
        } catch (error: any) {
          errors.push({ row: i + 1, error: error.message || 'Failed to create customer' });
        }
      }
      break;
    }

    case 'trucks': {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const truckNumber = getValue(row, ['Unit number', 'Unit Number', 'truck_number', 'Truck Number']);
          if (!truckNumber) {
            errors.push({ row: i + 1, error: 'Unit number is required' });
            continue;
          }

          const vin = getValue(row, ['Vin', 'VIN', 'vin']);
          if (!vin) {
            errors.push({ row: i + 1, error: 'VIN is required' });
            continue;
          }

          // Check if truck already exists
          const existing = await prisma.truck.findFirst({
            where: {
              companyId,
              deletedAt: null,
              OR: [{ truckNumber }, { vin }],
            },
          });

          if (existing) {
            errors.push({ row: i + 1, error: `Truck already exists: ${truckNumber}` });
            continue;
          }

          const registrationExpiry = parseDate(
            getValue(row, ['Registration expiry date', 'Registration Expiry Date', 'registration_expiry'])
          ) || new Date();

          const insuranceExpiry = parseDate(
            getValue(row, ['Insurance expiry date', 'Insurance Expiry Date', 'insurance_expiry'])
          ) || new Date();

          const inspectionExpiry = parseDate(
            getValue(row, ['Annual inspection expiry date', 'Annual Inspection Expiry Date', 'inspection_expiry'])
          ) || new Date();

          // Get or create MC number
          const mcNumberValue = getValue(row, ['MC number', 'MC Number', 'mc_number']) || currentMcNumber;
          let mcNumberId: string | undefined;
          if (mcNumberValue) {
            let mcNumber = await prisma.mcNumber.findFirst({
              where: {
                companyId,
                number: mcNumberValue,
              },
            });
            if (!mcNumber) {
              const company = await prisma.company.findUnique({
                where: { id: companyId },
              });
              mcNumber = await prisma.mcNumber.create({
                data: {
                  companyId,
                  number: mcNumberValue,
                  companyName: company?.name || 'Company',
                  type: 'CARRIER',
                  isDefault: false,
                },
              });
            }
            mcNumberId = mcNumber.id;
          } else {
            // Get default MC number if no MC number specified
            const defaultMcNumber = await prisma.mcNumber.findFirst({
              where: {
                companyId,
                isDefault: true,
              },
            });
            if (!defaultMcNumber) {
              throw new Error('No MC number specified and no default MC number found');
            }
            mcNumberId = defaultMcNumber.id;
          }

          const truck = await prisma.truck.create({
            data: {
              companyId,
              truckNumber,
              vin,
              make: getValue(row, ['Make', 'make']) || '',
              model: getValue(row, ['Model', 'model']) || '',
              year: parseInt(getValue(row, ['Year', 'year']) || '0') || new Date().getFullYear(),
              licensePlate: getValue(row, ['Plate number', 'Plate Number', 'license_plate']) || '',
              state: getValue(row, ['State', 'state']) || '',
              mcNumberId,
              equipmentType: 'DRY_VAN', // Default, should be mapped from Excel
              capacity: 45000, // Default
              status: getValue(row, ['Status', 'status']) || 'AVAILABLE',
              fleetStatus: getValue(row, ['Fleet Status', 'Fleet Status', 'fleet_status']),
              ownership: getValue(row, ['Ownership', 'ownership']),
              ownerName: getValue(row, ['Owner name', 'Owner Name', 'owner_name']),
              odometerReading: parseFloat(getValue(row, ['Odometer', 'odometer']) || '0') || 0,
              registrationExpiry,
              insuranceExpiry,
              inspectionExpiry,
              tollTagNumber: getValue(row, ['Toll tag number', 'Toll Tag Number', 'toll_tag_number']),
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
      break;
    }

    case 'trailers': {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const trailerNumber = getValue(row, ['Unit number', 'Unit Number', 'trailer_number']);
          if (!trailerNumber) {
            errors.push({ row: i + 1, error: 'Unit number is required' });
            continue;
          }

          // Check if trailer already exists
          const existing = await prisma.trailer.findFirst({
            where: {
              companyId,
              deletedAt: null,
              trailerNumber,
            },
          });

          if (existing) {
            errors.push({ row: i + 1, error: `Trailer already exists: ${trailerNumber}` });
            continue;
          }

          // Find assigned truck if provided
          const assignedTruckNumber = getValue(row, ['Assigned truck', 'Assigned Truck', 'assigned_truck']);
          let assignedTruckId: string | null = null;
          if (assignedTruckNumber) {
            const truck = await prisma.truck.findFirst({
              where: {
                companyId,
                deletedAt: null,
                truckNumber: assignedTruckNumber,
              },
            });
            if (truck) assignedTruckId = truck.id;
          }

          // Get or create MC number
          const mcNumberValue = getValue(row, ['MC Number', 'MC Number', 'mc_number']) || currentMcNumber;
          let mcNumberId: string | undefined;
          if (mcNumberValue) {
            let mcNumber = await prisma.mcNumber.findFirst({
              where: {
                companyId,
                number: mcNumberValue,
              },
            });
            if (!mcNumber) {
              const company = await prisma.company.findUnique({
                where: { id: companyId },
              });
              mcNumber = await prisma.mcNumber.create({
                data: {
                  companyId,
                  number: mcNumberValue,
                  companyName: company?.name || 'Company',
                  type: 'CARRIER',
                  isDefault: false,
                },
              });
            }
            mcNumberId = mcNumber.id;
          } else {
            // Get default MC number if no MC number specified
            const defaultMcNumber = await prisma.mcNumber.findFirst({
              where: {
                companyId,
                isDefault: true,
              },
            });
            if (!defaultMcNumber) {
              throw new Error('No MC number specified and no default MC number found');
            }
            mcNumberId = defaultMcNumber.id;
          }

          const trailer = await prisma.trailer.create({
            data: {
              companyId,
              trailerNumber,
              vin: getValue(row, ['Vin', 'VIN', 'vin']),
              make: getValue(row, ['Make', 'make']) || '',
              model: getValue(row, ['Model', 'model']) || '',
              year: parseInt(getValue(row, ['Year', 'year']) || '0') || null,
              licensePlate: getValue(row, ['Plate number', 'Plate Number', 'license_plate']),
              state: getValue(row, ['State', 'state']),
              mcNumberId,
              type: getValue(row, ['Type', 'type']),
              ownership: getValue(row, ['Ownership', 'ownership']),
              ownerName: getValue(row, ['Owner name', 'Owner Name', 'owner_name']),
              assignedTruckId,
              status: getValue(row, ['Status', 'status']),
              fleetStatus: getValue(row, ['Fleet Status', 'Fleet Status', 'fleet_status']),
              registrationExpiry: parseDate(
                getValue(row, ['Registration expiry date', 'Registration Expiry Date'])
              ),
              inspectionExpiry: parseDate(
                getValue(row, ['Annual inspection expiry date', 'Annual Inspection Expiry Date'])
              ),
              insuranceExpiry: parseDate(
                getValue(row, ['Insurance expiry date', 'Insurance Expiry Date'])
              ),
              legacyTags: parseTags(getValue(row, ['Tags', 'tags'])),
            },
          });

          created.push(trailer);
        } catch (error: any) {
          errors.push({ row: i + 1, error: error.message || 'Failed to create trailer' });
        }
      }
      break;
    }

    case 'vendors': {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const name = getValue(row, ['Vendor name', 'Vendor Name', 'name']);
          if (!name) {
            errors.push({ row: i + 1, error: 'Vendor name is required' });
            continue;
          }

          // Generate vendor number if not provided
          const vendorNumber =
            getValue(row, ['ID', 'id', 'Vendor Number', 'vendor_number']) ||
            `VEND-${Date.now()}-${i}`;

          // Check if vendor already exists
          const existing = await prisma.vendor.findFirst({
            where: {
              companyId,
              deletedAt: null,
              OR: [{ vendorNumber }, { name: { equals: name, mode: 'insensitive' } }],
            },
          });

          if (existing) {
            errors.push({ row: i + 1, error: `Vendor already exists: ${name}` });
            continue;
          }

          const vendorType = getValue(row, ['Type', 'type']) || 'SUPPLIER';
          const mappedType =
            vendorType === 'BILLS' || vendorType === 'bills' ? 'SERVICE_PROVIDER' : 'SUPPLIER';

          const vendor = await prisma.vendor.create({
            data: {
              companyId,
              vendorNumber,
              name,
              type: mappedType as any,
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
      break;
    }

    case 'locations': {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const name = getValue(row, ['Place name', 'Place Name', 'name']);
          const address = getValue(row, ['Address', 'address']);
          const city = getValue(row, ['City', 'city']);
          const state = getValue(row, ['State', 'state']);

          if (!name || !address || !city || !state) {
            errors.push({ row: i + 1, error: 'Place name, Address, City, and State are required' });
            continue;
          }

          // Generate location number if not provided
          const locationNumber = `LOC-${Date.now()}-${i}`;

          // Check if location already exists (by name and address)
          const existing = await prisma.location.findFirst({
            where: {
              companyId,
              deletedAt: null,
              name: { equals: name, mode: 'insensitive' },
              address: { equals: address, mode: 'insensitive' },
              city: { equals: city, mode: 'insensitive' },
              state: { equals: state, mode: 'insensitive' },
            },
          });

          if (existing) {
            errors.push({ row: i + 1, error: `Location already exists: ${name}` });
            continue;
          }

          const location = await prisma.location.create({
            data: {
              companyId,
              locationNumber,
              name,
              locationCompany: getValue(row, ['Company', 'company']),
              address,
              city,
              state,
              zip: getValue(row, ['ZIP', 'Zip', 'zip']),
              contactName: getValue(row, ['Contact name', 'Contact Name', 'contact_name']),
            },
          });

          created.push(location);
        } catch (error: any) {
          errors.push({ row: i + 1, error: error.message || 'Failed to create location' });
        }
      }
      break;
    }

    case 'loads': {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const loadNumber =
            getValue(row, ['Load ID', 'Load ID', 'load_id', 'load_number']) ||
            getValue(row, ['Shipment ID', 'Shipment ID', 'shipment_id']) ||
            `LOAD-${Date.now()}-${i}`;

          // Check if load already exists
          const existing = await prisma.load.findFirst({
            where: {
              companyId,
              deletedAt: null,
              loadNumber,
            },
          });

          if (existing) {
            errors.push({ row: i + 1, error: `Load already exists: ${loadNumber}` });
            continue;
          }

          // Find customer
          const customerName = getValue(row, ['Customer', 'customer']);
          if (!customerName) {
            errors.push({ row: i + 1, error: 'Customer is required' });
            continue;
          }

          const customer = await prisma.customer.findFirst({
            where: {
              companyId,
              deletedAt: null,
              name: { contains: customerName, mode: 'insensitive' },
            },
          });

          if (!customer) {
            errors.push({ row: i + 1, error: `Customer not found: ${customerName}` });
            continue;
          }

          // Find truck if provided
          const truckNumber = getValue(row, ['Truck', 'truck']);
          let truckId: string | null = null;
          if (truckNumber) {
            const truck = await prisma.truck.findFirst({
              where: {
                companyId,
                deletedAt: null,
                truckNumber,
              },
            });
            if (truck) truckId = truck.id;
          }

          // Find trailer if provided
          const trailerNumber = getValue(row, ['Trailer', 'trailer']);
          let trailerId: string | null = null;
          if (trailerNumber) {
            const trailer = await prisma.trailer.findFirst({
              where: {
                companyId,
                deletedAt: null,
                trailerNumber,
              },
            });
            if (trailer) trailerId = trailer.id;
          }

          // Parse pickup/delivery locations
          const pickupLocation = getValue(row, ['Pickup location', 'Pickup Location', 'pickup_location']);
          const deliveryLocation = getValue(row, ['Delivery location', 'Delivery Location', 'delivery_location']);

          // Extract city/state from location strings (format: "City, State")
          const parseLocation = (location: string | null): { city: string; state: string } | null => {
            if (!location) return null;
            const parts = location.split(',').map((p) => p.trim());
            if (parts.length >= 2) {
              return { city: parts[0], state: parts[1] };
            }
            return null;
          };

          const pickup = parseLocation(pickupLocation);
          const delivery = parseLocation(deliveryLocation);

          const load = await prisma.load.create({
            data: {
              companyId,
              loadNumber,
              customerId: customer.id,
              truckId,
              trailerId,
              loadType: 'FTL', // Default
              equipmentType: 'DRY_VAN', // Default
              pickupCity: pickup?.city || '',
              pickupState: pickup?.state || '',
              deliveryCity: delivery?.city || '',
              deliveryState: delivery?.state || '',
              pickupDate: parseDate(getValue(row, ['Pickup Date', 'Pickup Date', 'pickup_date'])) || new Date(),
              deliveryDate: parseDate(getValue(row, ['DEL date', 'DEL Date', 'Delivery Date', 'delivery_date'])),
              revenue: parseFloat(getValue(row, ['Load pay', 'Load Pay', 'revenue']) || '0') || 0,
              weight: 0, // Default
              shipmentId: getValue(row, ['Shipment ID', 'Shipment ID', 'shipment_id']),
              stopsCount: parseInt(getValue(row, ['Stops count', 'Stops Count', 'stops_count']) || '0') || null,
              totalPay: parseFloat(getValue(row, ['Total pay', 'Total Pay', 'total_pay']) || '0') || null,
              totalMiles: parseFloat(getValue(row, ['Total miles', 'Total Miles', 'total_miles']) || '0') || null,
              lastNote: getValue(row, ['Last note', 'Last Note', 'last_note']),
              onTimeDelivery: getValue(row, ['On Time Delivery', 'On Time Delivery']) === 'Yes' || null,
              lastUpdate: parseDate(getValue(row, ['Last update', 'Last Update', 'last_update'])),
              status: mapLoadStatus(getValue(row, ['Load status', 'Load Status', 'status']) || 'PENDING'),
              mcNumber: getValue(row, ['MC Number', 'MC Number', 'mc_number']) || currentMcNumber || null,
            },
          });

          created.push(load);
        } catch (error: any) {
          errors.push({ row: i + 1, error: error.message || 'Failed to create load' });
        }
      }
      break;
    }

    default:
      return {
        success: false,
        created: 0,
        errors: [{ error: `Unknown entity type: ${entityType}` }],
      };
  }

  return {
    success: true,
    created: created.length,
    errors: errors.length,
    details: {
      created,
      errors,
    },
  };
}

function mapLoadStatus(status: string): LoadStatus {
  const statusMap: Record<string, LoadStatus> = {
    PENDING: LoadStatus.PENDING,
    ASSIGNED: LoadStatus.ASSIGNED,
    'EN ROUTE PICKUP': LoadStatus.EN_ROUTE_PICKUP,
    'AT PICKUP': LoadStatus.AT_PICKUP,
    LOADED: LoadStatus.LOADED,
    'EN ROUTE DELIVERY': LoadStatus.EN_ROUTE_DELIVERY,
    'AT DELIVERY': LoadStatus.AT_DELIVERY,
    DELIVERED: LoadStatus.DELIVERED,
    INVOICED: LoadStatus.INVOICED,
    PAID: LoadStatus.PAID,
    CANCELLED: LoadStatus.CANCELLED,
  };

  return statusMap[status.toUpperCase()] || LoadStatus.PENDING;
}

