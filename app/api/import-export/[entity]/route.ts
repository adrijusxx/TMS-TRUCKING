import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { exportToCSV } from '@/lib/export';
import { csvFileToJSON, parseCSV } from '@/lib/import-export/csv-import';
import { z } from 'zod';

/**
 * GET /api/import-export/[entity]
 * Export entity data to CSV
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { entity } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Check permission based on entity type
    const permissionMap: Record<string, string> = {
      loads: 'loads.view',
      trucks: 'trucks.view',
      drivers: 'drivers.view',
      customers: 'customers.view',
      invoices: 'invoices.view',
      users: 'settings.view',
      dispatchers: 'settings.view',
      employees: 'settings.view',
      trailers: 'trucks.view',
      inspections: 'trucks.view',
      breakdowns: 'trucks.view',
      documents: 'documents.view',
    };

    const permission = permissionMap[entity];
    if (!permission || !hasPermission(session.user.role, permission as any)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    // Fetch data based on entity type
    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    let data: any[] = [];
    let headers: string[] = [];

    switch (entity) {
      case 'loads':
        data = await prisma.load.findMany({
          where,
          include: {
            customer: { select: { name: true } },
            driver: { select: { user: { select: { firstName: true, lastName: true } } } },
            truck: { select: { truckNumber: true } },
          },
        });
        headers = [
          'Load Number',
          'Status',
          'Customer',
          'Driver',
          'Truck',
          'Pickup City',
          'Pickup State',
          'Delivery City',
          'Delivery State',
          'Pickup Date',
          'Delivery Date',
          'Revenue',
          'Distance',
        ];
        data = data.map((load) => ({
          'Load Number': load.loadNumber,
          Status: load.status,
          Customer: load.customer?.name || '',
          Driver: load.driver ? `${load.driver.user.firstName} ${load.driver.user.lastName}` : '',
          Truck: load.truck?.truckNumber || '',
          'Pickup City': load.pickupCity || '',
          'Pickup State': load.pickupState || '',
          'Delivery City': load.deliveryCity || '',
          'Delivery State': load.deliveryState || '',
          'Pickup Date': load.pickupDate?.toISOString() || '',
          'Delivery Date': load.deliveryDate?.toISOString() || '',
          Revenue: load.revenue?.toString() || '',
          Distance: (load.route?.totalDistance || load.totalMiles || 0).toString(),
        }));
        break;

      case 'trucks':
        data = await prisma.truck.findMany({ where });
        headers = [
          'Truck Number',
          'VIN',
          'Make',
          'Model',
          'Year',
          'License Plate',
          'State',
          'Status',
          'Equipment Type',
          'Capacity',
        ];
        data = data.map((truck) => ({
          'Truck Number': truck.truckNumber,
          VIN: truck.vin,
          Make: truck.make,
          Model: truck.model,
          Year: truck.year.toString(),
          'License Plate': truck.licensePlate,
          State: truck.state,
          Status: truck.status,
          'Equipment Type': truck.equipmentType,
          Capacity: truck.capacity.toString(),
        }));
        break;

      case 'drivers':
        data = await prisma.driver.findMany({
          where,
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            currentTruck: { select: { truckNumber: true } },
          },
        });
        headers = [
          'Email',
          'First Name',
          'Last Name',
          'Driver Number',
          'Phone',
          'License Number',
          'License State',
          'License Expiry',
          'Medical Card Expiry',
          'Drug Test Date',
          'Background Check',
          'Pay Type',
          'Pay Rate',
          'Home Terminal',
          'Emergency Contact',
          'Emergency Phone',
          'Status',
        ];
        data = data.map((driver) => ({
          Email: driver.user.email,
          'First Name': driver.user.firstName,
          'Last Name': driver.user.lastName,
          'Driver Number': driver.driverNumber,
          Phone: driver.user.phone || '',
          'License Number': driver.licenseNumber,
          'License State': driver.licenseState,
          'License Expiry': driver.licenseExpiry ? driver.licenseExpiry.toISOString().split('T')[0] : '',
          'Medical Card Expiry': driver.medicalCardExpiry ? driver.medicalCardExpiry.toISOString().split('T')[0] : '',
          'Drug Test Date': driver.drugTestDate ? driver.drugTestDate.toISOString().split('T')[0] : '',
          'Background Check': driver.backgroundCheck ? driver.backgroundCheck.toISOString().split('T')[0] : '',
          'Pay Type': driver.payType,
          'Pay Rate': driver.payRate.toString(),
          'Home Terminal': driver.homeTerminal || '',
          'Emergency Contact': driver.emergencyContact || '',
          'Emergency Phone': driver.emergencyPhone || '',
          Status: driver.status,
        }));
        break;

      case 'users':
      case 'dispatchers':
      case 'employees':
        data = await prisma.user.findMany({
          where: {
            companyId: session.user.companyId,
            deletedAt: null,
            ...(entity === 'dispatchers' ? { role: 'DISPATCHER' } : {}),
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        headers = [
          'Email',
          'First Name',
          'Last Name',
          'Phone',
          'Role',
          'Is Active',
          'Last Login',
        ];
        data = data.map((user) => ({
          Email: user.email,
          'First Name': user.firstName,
          'Last Name': user.lastName,
          Phone: user.phone || '',
          Role: user.role,
          'Is Active': user.isActive ? 'Yes' : 'No',
          'Last Login': user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : '',
        }));
        break;

      case 'customers':
        data = await prisma.customer.findMany({ where });
        headers = [
          'Customer Number',
          'Name',
          'Type',
          'Address',
          'City',
          'State',
          'Zip',
          'Phone',
          'Email',
        ];
        data = data.map((customer) => ({
          'Customer Number': customer.customerNumber,
          Name: customer.name,
          Type: customer.type,
          Address: customer.address,
          City: customer.city,
          State: customer.state,
          Zip: customer.zip,
          Phone: customer.phone,
          Email: customer.email,
        }));
        break;

      case 'invoices':
        data = await prisma.invoice.findMany({
          where,
          include: {
            load: { select: { loadNumber: true } },
            customer: { select: { name: true } },
          },
        });
        headers = [
          'Invoice Number',
          'Load Number',
          'Customer',
          'Amount',
          'Status',
          'Due Date',
          'Issue Date',
        ];
        data = data.map((invoice) => ({
          'Invoice Number': invoice.invoiceNumber,
          'Load Number': invoice.load?.loadNumber || '',
          Customer: invoice.customer?.name || '',
          Amount: invoice.amount.toString(),
          Status: invoice.status,
          'Due Date': invoice.dueDate?.toISOString() || '',
          'Issue Date': invoice.issueDate?.toISOString() || '',
        }));
        break;

      case 'breakdowns':
        data = await prisma.breakdown.findMany({
          where,
          include: {
            truck: { select: { truckNumber: true } },
            driver: { select: { user: { select: { firstName: true, lastName: true } } } },
          },
        });
        headers = [
          'Breakdown Number',
          'Truck',
          'Driver',
          'Type',
          'Status',
          'Priority',
          'Location',
          'Reported At',
          'Total Cost',
        ];
        data = data.map((bd) => ({
          'Breakdown Number': bd.breakdownNumber,
          Truck: bd.truck?.truckNumber || '',
          Driver: bd.driver ? `${bd.driver.user.firstName} ${bd.driver.user.lastName}` : '',
          Type: bd.breakdownType,
          Status: bd.status,
          Priority: bd.priority,
          Location: bd.location,
          'Reported At': bd.reportedAt.toISOString(),
          'Total Cost': bd.totalCost?.toString() || '',
        }));
        break;

      default:
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_ENTITY', message: 'Invalid entity type' } },
          { status: 400 }
        );
    }

    if (format === 'csv') {
      // Generate CSV content
      const csvContent = [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header] || '';
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(',')
        ),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${entity}-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        entity,
        count: data.length,
        headers,
        rows: data,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to export data',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/import-export/[entity]
 * Import entity data from CSV
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { entity } = await params;

    // Check permission - allow multiple permissions per entity
    const permissionMap: Record<string, string[]> = {
      loads: ['loads.create'],
      trucks: ['trucks.create'],
      trailers: ['trucks.create', 'trucks.view'], // Trailers: allow create or view (for dispatchers)
      drivers: ['drivers.create', 'drivers.view'], // Drivers: allow create or view
      customers: ['customers.create'],
      invoices: ['invoices.create'],
      users: ['settings.view'], // Users: allow settings view
      dispatchers: ['settings.view'], // Dispatchers: allow settings view
      employees: ['settings.view'], // Employees: allow settings view
      breakdowns: ['trucks.edit', 'trucks.view'], // Breakdowns: allow edit or view
      inspections: ['trucks.edit', 'trucks.view'], // Inspections: allow edit or view
      vendors: ['customers.create', 'customers.view'], // Vendors: allow create or view
      locations: ['customers.create', 'customers.view'], // Locations: allow create or view
      inventory: ['trucks.view'], // Inventory uses trucks.view permission
      documents: ['documents.upload'],
    };

    const permissions = permissionMap[entity];
    if (!permissions || !permissions.some(permission => hasPermission(session.user.role, permission as any))) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | Blob;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FILE', message: 'No file provided' } },
        { status: 400 }
      );
    }

    // Get file name - check for name property or use fallback
    const fileName = ((file as any).name || (file as any).filename || 'file').toLowerCase();
    
    // Parse CSV or Excel file
    let importResult: any;
    
    try {
      if (fileName.endsWith('.csv')) {
        // CSV file - convert to text
        const bytes = await file.arrayBuffer();
        const text = Buffer.from(bytes).toString('utf-8');
        importResult = await csvFileToJSON(text);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Excel file - convert to Buffer for server-side processing
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const { excelFileToJSON } = await import('@/lib/import-export/excel-import');
        importResult = await excelFileToJSON(buffer);
      } else {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_FILE', message: 'Only CSV and Excel files are supported' } },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error('File parsing error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: error.message || 'Failed to parse file',
          },
        },
        { status: 500 }
      );
    }

    // Check if parsing failed completely (not just validation errors)
    if (!importResult || !importResult.data || importResult.data.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse file or file is empty',
          details: importResult?.errors || [{ error: 'No data found in file' }],
        },
        data: importResult,
      });
    }

    // Process imports based on entity type
    let created: any[] = [];
    let errors: any[] = importResult.errors || [];

    // Normalize headers from Excel/CSV
    const normalizeKey = (key: string) => String(key || '').trim().toLowerCase().replace(/\s+/g, '_');

    // Helper to get value from row (rows already have normalized keys from Excel/CSV import)
    const getValue = (row: any, headerNames: string[]): any => {
      if (!row || typeof row !== 'object') return null;
      
      // Try normalized keys first (since Excel/CSV import normalizes them)
      for (const headerName of headerNames) {
        const normalized = normalizeKey(headerName);
        
        // Direct access with normalized key
        if (row[normalized] !== undefined && row[normalized] !== null && row[normalized] !== '') {
          return row[normalized];
        }
        
        // Try exact match (case-insensitive)
        const rowKeys = Object.keys(row);
        for (const key of rowKeys) {
          if (normalizeKey(key) === normalized) {
            const value = row[key];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
        }
        
        // Try original header name (in case it wasn't normalized)
        if (row[headerName] !== undefined && row[headerName] !== null && row[headerName] !== '') {
          return row[headerName];
        }
      }
      return null;
    };

    // Helper to convert null to undefined for optional Zod fields
    const nullToUndefined = <T>(value: T | null): T | undefined => {
      return value === null ? undefined : value;
    };

    // Helper to parse date
    const parseDate = (value: any): Date | null => {
      if (!value) return null;
      if (value instanceof Date) return value;
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    };

    // Helper to parse tags
    const parseTags = (value: any): any => {
      if (!value) return null;
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        const tags = value.split(',').map((t) => t.trim()).filter((t) => t);
        return tags.length > 0 ? tags : null;
      }
      return null;
    };

    // Helper to map customer type from Excel to CustomerType enum
    const mapCustomerType = (typeValue: any): 'DIRECT' | 'BROKER' | 'FREIGHT_FORWARDER' | 'THIRD_PARTY_LOGISTICS' => {
      if (!typeValue) return 'DIRECT';
      const normalized = String(typeValue).trim().toLowerCase();
      
      // Direct matches
      if (normalized === 'direct' || normalized === 'shipper') return 'DIRECT';
      if (normalized === 'broker') return 'BROKER';
      if (normalized === 'freight_forwarder' || normalized === 'freight forwarder' || normalized === 'forwarder') return 'FREIGHT_FORWARDER';
      if (normalized === 'third_party_logistics' || normalized === 'third party logistics' || normalized === '3pl' || normalized === '3pls') return 'THIRD_PARTY_LOGISTICS';
      
      // Common variations
      if (normalized === 'carrier') return 'DIRECT'; // Carrier is typically a direct customer
      
      // Fallback to DIRECT for unknown values
      return 'DIRECT';
    };

    // Helper to map vendor type from Excel to VendorType enum
    const mapVendorType = (typeValue: any): 'SUPPLIER' | 'PARTS_VENDOR' | 'SERVICE_PROVIDER' | 'FUEL_VENDOR' | 'REPAIR_SHOP' | 'TIRE_SHOP' | 'OTHER' => {
      if (!typeValue) return 'SUPPLIER';
      const normalized = String(typeValue).trim().toUpperCase();
      
      // Direct matches
      if (normalized === 'SUPPLIER' || normalized === 'SUPPLIERS') return 'SUPPLIER';
      if (normalized === 'PARTS_VENDOR' || normalized === 'PARTS' || normalized === 'PARTS VENDOR') return 'PARTS_VENDOR';
      if (normalized === 'SERVICE_PROVIDER' || normalized === 'SERVICE PROVIDER' || normalized === 'BILLS' || normalized === 'SERVICES') return 'SERVICE_PROVIDER';
      if (normalized === 'FUEL_VENDOR' || normalized === 'FUEL VENDOR' || normalized === 'FUEL') return 'FUEL_VENDOR';
      if (normalized === 'REPAIR_SHOP' || normalized === 'REPAIR SHOP' || normalized === 'REPAIR') return 'REPAIR_SHOP';
      if (normalized === 'TIRE_SHOP' || normalized === 'TIRE SHOP' || normalized === 'TIRE') return 'TIRE_SHOP';
      if (normalized === 'OTHER') return 'OTHER';
      
      // Fallback to SUPPLIER for unknown values
      return 'SUPPLIER';
    };

    if (entity === 'customers') {
      // Import customers
      for (let i = 0; i < importResult.data.length; i++) {
        const row = importResult.data[i];
        try {
          const name = getValue(row, ['Company name', 'Company Name', 'name', 'customer_name']);
          if (!name) {
            errors.push({ row: i + 1, error: 'Company name is required' });
            continue;
          }

          const customerNumber =
            getValue(row, ['Customer Number', 'Customer Number', 'customer_number']) ||
            `CUST-${Date.now()}-${i}`;

          const existing = await prisma.customer.findFirst({
            where: {
              companyId: session.user.companyId,
              deletedAt: null,
              OR: [{ customerNumber }, { name: { equals: name, mode: 'insensitive' } }],
            },
          });

          if (existing) {
            errors.push({ row: i + 1, error: `Customer already exists: ${name}` });
            continue;
          }

          const rawType = getValue(row, ['Customer type', 'Customer Type', 'type']);
          const customerType = mapCustomerType(rawType);

          const customer = await prisma.customer.create({
            data: {
              companyId: session.user.companyId,
              customerNumber,
              name,
              type: customerType,
              mcNumber: getValue(row, ['MC Number', 'MC Number', 'mc_number']),
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
                String(getValue(row, ['Rate confirmation required', 'Rate Confirmation Required']) || '').toLowerCase() === 'yes',
              status: getValue(row, ['Status', 'status']),
              tags: parseTags(getValue(row, ['Tags', 'tags'])),
              warning: getValue(row, ['Warning', 'warning']),
              creditRate: parseFloat(String(getValue(row, ['Credit rate', 'Credit Rate', 'credit_rate']) || '0')) || null,
              riskLevel: getValue(row, ['Risk level', 'Risk Level', 'risk_level']),
              comments: getValue(row, ['Commnets', 'Comments', 'comments']),
            },
          });

          created.push(customer);
        } catch (error: any) {
          errors.push({ row: i + 1, error: error.message || 'Failed to create customer' });
        }
      }
    } else if (entity === 'trucks') {
      // Import trucks
      for (let i = 0; i < importResult.data.length; i++) {
        const row = importResult.data[i];
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

          const existing = await prisma.truck.findFirst({
            where: {
              companyId: session.user.companyId,
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

          // Map Excel status values to TruckStatus enum
          const mapTruckStatus = (statusValue: any): 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'INACTIVE' => {
            if (!statusValue) return 'AVAILABLE';
            const normalized = String(statusValue).trim().toUpperCase().replace(/[_\s]/g, '_');
            
            // Direct matches
            if (normalized === 'AVAILABLE') return 'AVAILABLE';
            if (normalized === 'IN_USE' || normalized === 'INUSE' || normalized === 'IN_TRANSIT' || normalized === 'INTRANSIT') return 'IN_USE';
            if (normalized === 'MAINTENANCE' || normalized === 'MAINT') return 'MAINTENANCE';
            if (normalized === 'OUT_OF_SERVICE' || normalized === 'OUTOFSERVICE' || normalized === 'OOS') return 'OUT_OF_SERVICE';
            if (normalized === 'INACTIVE') return 'INACTIVE';
            
            // Fallback to AVAILABLE for unknown values
            return 'AVAILABLE';
          };

          const rawStatus = getValue(row, ['Status', 'status']);
          const truckStatus = mapTruckStatus(rawStatus);

          const truck = await prisma.truck.create({
            data: {
              companyId: session.user.companyId,
              truckNumber,
              vin,
              make: getValue(row, ['Make', 'make']) || '',
              model: getValue(row, ['Model', 'model']) || '',
              year: parseInt(String(getValue(row, ['Year', 'year']) || new Date().getFullYear())) || new Date().getFullYear(),
              licensePlate: getValue(row, ['Plate number', 'Plate Number', 'license_plate']) || '',
              state: getValue(row, ['State', 'state']) || '',
              mcNumber: getValue(row, ['MC number', 'MC Number', 'mc_number']),
              equipmentType: 'DRY_VAN',
              capacity: 45000,
              status: truckStatus,
              fleetStatus: getValue(row, ['Fleet Status', 'Fleet Status', 'fleet_status']),
              ownership: getValue(row, ['Ownership', 'ownership']),
              ownerName: getValue(row, ['Owner name', 'Owner Name', 'owner_name']),
              odometerReading: parseFloat(String(getValue(row, ['Odometer', 'odometer']) || '0')) || 0,
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
    } else if (entity === 'trailers') {
      // Import trailers
      console.log(`[Trailers Import] Starting import of ${importResult.data.length} trailers for company ${session.user.companyId}`);
      for (let i = 0; i < importResult.data.length; i++) {
        const row = importResult.data[i];
        try {
          const trailerNumber = getValue(row, ['unit_number', 'Unit number', 'Unit Number', 'trailer_number']);
          if (!trailerNumber) {
            errors.push({ row: i + 1, error: 'Unit number is required' });
            continue;
          }

          const existing = await prisma.trailer.findFirst({
            where: {
              companyId: session.user.companyId,
              deletedAt: null,
              trailerNumber,
            },
          });

          if (existing) {
            errors.push({ row: i + 1, error: `Trailer already exists: ${trailerNumber}` });
            continue;
          }

          const make = getValue(row, ['make', 'Make']) || 'Unknown';
          const model = getValue(row, ['model', 'Model']) || 'Unknown';

          const assignedTruckNumber = getValue(row, ['assigned_truck', 'Assigned truck', 'Assigned Truck']);
          let assignedTruckId: string | null = null;
          if (assignedTruckNumber) {
            const truck = await prisma.truck.findFirst({
              where: {
                companyId: session.user.companyId,
                deletedAt: null,
                truckNumber: assignedTruckNumber,
              },
            });
            if (truck) assignedTruckId = truck.id;
          }

          const trailer = await prisma.trailer.create({
            data: {
              companyId: session.user.companyId,
              trailerNumber,
              vin: getValue(row, ['vin', 'Vin', 'VIN']) || null,
              make,
              model,
              year: parseInt(String(getValue(row, ['year', 'Year']) || '0')) || null,
              licensePlate: getValue(row, ['plate_number', 'Plate number', 'Plate Number', 'license_plate']) || null,
              state: getValue(row, ['state', 'State']) || null,
              mcNumber: getValue(row, ['mc_number', 'MC Number', 'MC Number']) || null,
              type: getValue(row, ['type', 'Type']) || null,
              ownership: getValue(row, ['ownership', 'Ownership']) || null,
              ownerName: getValue(row, ['owner_name', 'Owner name', 'Owner Name']) || null,
              assignedTruckId,
              status: getValue(row, ['status', 'Status']) || null,
              fleetStatus: getValue(row, ['fleet_status', 'Fleet Status', 'Fleet Status']) || null,
              registrationExpiry: parseDate(
                getValue(row, ['registration_expiry', 'Registration expiry date', 'Registration Expiry Date'])
              ),
              inspectionExpiry: parseDate(
                getValue(row, ['inspection_expiry', 'Annual inspection expiry date', 'Annual Inspection Expiry Date'])
              ),
              insuranceExpiry: parseDate(
                getValue(row, ['insurance_expiry', 'Insurance expiry date', 'Insurance Expiry Date'])
              ),
              tags: parseTags(getValue(row, ['tags', 'Tags'])),
            },
          });

          created.push(trailer);
          console.log(`[Trailers Import] Created trailer ${trailerNumber} (${trailer.id})`);
        } catch (error: any) {
          console.error(`[Trailers Import] Error creating trailer at row ${i + 1}:`, error);
          errors.push({ row: i + 1, error: error.message || 'Failed to create trailer' });
        }
      }
      console.log(`[Trailers Import] Completed: ${created.length} created, ${errors.length} errors`);
    } else if (entity === 'vendors') {
      // Import vendors
      for (let i = 0; i < importResult.data.length; i++) {
        const row = importResult.data[i];
        try {
          const name = getValue(row, ['Vendor name', 'Vendor Name', 'name']);
          if (!name) {
            errors.push({ row: i + 1, error: 'Vendor name is required' });
            continue;
          }

          const vendorNumber =
            getValue(row, ['ID', 'id', 'Vendor Number', 'vendor_number']) ||
            `VEND-${Date.now()}-${i}`;

          const existing = await prisma.vendor.findFirst({
            where: {
              companyId: session.user.companyId,
              deletedAt: null,
              OR: [{ vendorNumber }, { name: { equals: name, mode: 'insensitive' } }],
            },
          });

          if (existing) {
            errors.push({ row: i + 1, error: `Vendor already exists: ${name}` });
            continue;
          }

          const rawVendorType = getValue(row, ['Type', 'type']);
          const vendorType = mapVendorType(rawVendorType);

          const vendor = await prisma.vendor.create({
            data: {
              companyId: session.user.companyId,
              vendorNumber,
              name,
              type: vendorType,
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
    } else if (entity === 'locations') {
      // Import locations
      for (let i = 0; i < importResult.data.length; i++) {
        const row = importResult.data[i];
        try {
          const name = getValue(row, ['Place name', 'Place Name', 'name']);
          const address = getValue(row, ['Address', 'address']);
          const city = getValue(row, ['City', 'city']);
          const state = getValue(row, ['State', 'state']);

          if (!name || !address || !city || !state) {
            errors.push({ row: i + 1, error: 'Place name, Address, City, and State are required' });
            continue;
          }

          const locationNumber = `LOC-${Date.now()}-${i}`;

          const existing = await prisma.location.findFirst({
            where: {
              companyId: session.user.companyId,
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
              companyId: session.user.companyId,
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
    } else if (entity === 'loads') {
      // Import loads from CSV/Excel - OPTIMIZED FOR BULK IMPORT
      const { createLoadSchema } = await import('@/lib/validations/load');
      const { LoadType, EquipmentType, LoadStatus } = await import('@prisma/client');

      console.log(`[Loads Import] Starting optimized bulk import for ${importResult.data.length} rows...`);

      // STEP 1: Pre-fetch all related entities into memory maps for O(1) lookups
      console.log('[Loads Import] Pre-fetching customers, trucks, trailers, and drivers...');
      const [allCustomers, allTrucks, allTrailers, allDrivers, existingLoads] = await Promise.all([
        prisma.customer.findMany({
          where: {
            companyId: session.user.companyId,
            deletedAt: null,
          },
          select: { id: true, name: true, customerNumber: true },
        }),
        prisma.truck.findMany({
          where: {
            companyId: session.user.companyId,
            deletedAt: null,
          },
          select: { id: true, truckNumber: true },
        }),
        prisma.trailer.findMany({
          where: {
            companyId: session.user.companyId,
            deletedAt: null,
          },
          select: { id: true, trailerNumber: true },
        }),
        prisma.driver.findMany({
          where: {
            companyId: session.user.companyId,
            deletedAt: null,
          },
          select: { 
            id: true, 
            driverNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        }),
        prisma.load.findMany({
          where: {
            companyId: session.user.companyId,
            deletedAt: null,
          },
          select: { loadNumber: true },
        }),
      ]);

      // Create lookup maps
      const customerMap = new Map<string, string>(); // name/number -> id
      const truckMap = new Map<string, string>(); // truckNumber -> id
      const trailerMap = new Map<string, string>(); // trailerNumber -> id
      const driverMap = new Map<string, string>(); // driverNumber/name/email -> id
      const existingLoadNumbers = new Set<string>();

      allCustomers.forEach((c) => {
        if (c.name) customerMap.set(c.name.toLowerCase(), c.id);
        if (c.customerNumber) customerMap.set(c.customerNumber.toLowerCase(), c.id);
      });

      allTrucks.forEach((t) => {
        truckMap.set(t.truckNumber.toLowerCase(), t.id);
      });

      allTrailers.forEach((t) => {
        trailerMap.set(t.trailerNumber.toLowerCase(), t.id);
      });

      allDrivers.forEach((d) => {
        // Map by driver number
        if (d.driverNumber) {
          driverMap.set(d.driverNumber.toLowerCase(), d.id);
        }
        // Map by full name
        if (d.user.firstName && d.user.lastName) {
          const fullName = `${d.user.firstName} ${d.user.lastName}`.toLowerCase();
          driverMap.set(fullName, d.id);
          driverMap.set(fullName.replace(/\s+/g, ''), d.id); // Also map without spaces
          // Also map by last name only (common in Excel)
          driverMap.set(d.user.lastName.toLowerCase(), d.id);
          // Map by first name + last name variations
          driverMap.set(`${d.user.firstName.toLowerCase()} ${d.user.lastName.toLowerCase()}`, d.id);
        }
        // Map by email
        if (d.user.email) {
          driverMap.set(d.user.email.toLowerCase(), d.id);
        }
      });

      existingLoads.forEach((l) => existingLoadNumbers.add(l.loadNumber));

      console.log(`[Loads Import] Pre-fetched ${allCustomers.length} customers, ${allTrucks.length} trucks, ${allTrailers.length} trailers, ${allDrivers.length} drivers`);

      // STEP 2: Process all rows and prepare data
      const BATCH_SIZE = 500; // Process in batches of 500
      const preparedLoads: Array<{ rowIndex: number; data: any; stops?: any[] }> = [];

      for (let i = 0; i < importResult.data.length; i++) {
        const row = importResult.data[i];
        try {
          // Find customer by name or customer number - use getValue helper to handle normalized keys
          let customerId: string | null = null;
          const customerName = getValue(row, ['Customer', 'customer', 'Customer Name', 'customer_name']);
          
          if (customerName) {
            // Use map lookup instead of database query
            const customerKey = customerName.toLowerCase().trim();
            customerId = customerMap.get(customerKey) || null;

            // If not found by exact match, try partial match
            if (!customerId) {
              for (const [key, id] of customerMap.entries()) {
                if (key.includes(customerKey) || customerKey.includes(key)) {
                  customerId = id;
                  break;
                }
              }
            }

            if (!customerId) {
              errors.push({
                row: i + 1,
                field: 'Customer',
                error: `Customer not found: ${customerName}. Please create the customer first.`,
              });
              continue;
            }
          } else {
            errors.push({
              row: i + 1,
              field: 'Customer',
              error: 'Customer is required',
            });
            continue;
          }

          // Find truck if provided - use map lookup
          const truckNumber = getValue(row, ['Truck', 'truck', 'Truck Number', 'truck_number']);
          let truckId: string | null = null;
          if (truckNumber) {
            const truckKey = String(truckNumber).trim().toLowerCase();
            truckId = truckMap.get(truckKey) || null;
            if (!truckId) {
              console.log(`[Loads Import] Truck "${truckNumber}" not found in database`);
            }
          }

          // Find trailer if provided - use map lookup
          const trailerNumber = getValue(row, ['Trailer', 'trailer', 'Trailer Number', 'trailer_number']);
          let trailerId: string | null = null;
          if (trailerNumber) {
            const trailerKey = String(trailerNumber).trim().toLowerCase();
            trailerId = trailerMap.get(trailerKey) || null;
            if (!trailerId) {
              console.log(`[Loads Import] Trailer "${trailerNumber}" not found in database`);
            }
          }

          // Find driver if provided - use map lookup (Driver/Carrier column)
          const driverValue = getValue(row, ['Driver/Carrier', 'Driver', 'Carrier', 'driver', 'carrier', 'driver_carrier', 'Driver Name', 'driver_name', 'Assigned Driver', 'assigned_driver']);
          let driverId: string | null = null;
          if (driverValue) {
            const driverKey = String(driverValue).toLowerCase().trim();
            console.log(`[Loads Import] Row ${i + 1}: Looking for driver "${driverValue}" (normalized: "${driverKey}")`);
            console.log(`[Loads Import] Available driver keys (first 5):`, Array.from(driverMap.keys()).slice(0, 5));
            
            driverId = driverMap.get(driverKey) || null;

            // If not found by exact match, try partial match (check if any part of the name matches)
            if (!driverId) {
              // Try matching by last name or any word in the name
              const driverWords = driverKey.split(/\s+/).filter(w => w.length > 2); // Filter out short words
              console.log(`[Loads Import] Row ${i + 1}: No exact match, trying partial match with words:`, driverWords);
              for (const [key, id] of driverMap.entries()) {
                const keyWords = key.split(/\s+/);
                // Check if any word from Excel matches any word in the driver name
                const hasMatch = driverWords.some(excelWord => 
                  keyWords.some(keyWord => 
                    keyWord.includes(excelWord) || excelWord.includes(keyWord)
                  )
                );
                if (hasMatch) {
                  driverId = id;
                  console.log(`[Loads Import] Row ${i + 1}: Matched driver "${driverValue}" to "${key}" (ID: ${id})`);
                  break;
                }
              }
              if (!driverId) {
                console.log(`[Loads Import] Row ${i + 1}: Could not find driver "${driverValue}" in database`);
              }
            } else {
              console.log(`[Loads Import] Row ${i + 1}: Exact match for driver "${driverValue}" (ID: ${driverId})`);
            }
          } else {
            console.log(`[Loads Import] Row ${i + 1}: No driver value found in Excel row`);
          }

          // Parse pickup/delivery locations
          const pickupLocation = getValue(row, ['Pickup location', 'Pickup Location', 'pickup_location', 'Pickup', 'pickup']);
          const deliveryLocation = getValue(row, ['Delivery location', 'Delivery Location', 'delivery_location', 'Delivery', 'delivery']);

          // Extract city/state from location strings
          const parseLocation = (location: string | null): { city: string; state: string; address?: string } | null => {
            if (!location) return null;
            const parts = String(location).split(',').map((p) => p.trim());
            if (parts.length >= 2) {
              return { 
                city: parts[0], 
                state: parts[1],
                address: parts.length > 2 ? parts.slice(0, -2).join(', ') : parts[0]
              };
            }
            return null;
          };

          const pickup = parseLocation(pickupLocation);
          const delivery = parseLocation(deliveryLocation);

          // Get pickup/delivery addresses
          const pickupAddress = getValue(row, ['Pickup Address', 'pickup_address', 'Pickup address']) || pickup?.address || '';
          const deliveryAddress = getValue(row, ['Delivery Address', 'delivery_address', 'Delivery address']) || delivery?.address || '';

          // Get cities and states
          const pickupCity = pickup?.city || getValue(row, ['Pickup City', 'PickupCity', 'pickup_city']) || '';
          const pickupState = pickup?.state || getValue(row, ['Pickup State', 'PickupState', 'pickup_state']) || '';
          const deliveryCity = delivery?.city || getValue(row, ['Delivery City', 'DeliveryCity', 'delivery_city']) || '';
          const deliveryState = delivery?.state || getValue(row, ['Delivery State', 'DeliveryState', 'delivery_state']) || '';

          // Map CSV/Excel columns to load schema
          const loadData: any = {
            loadNumber: getValue(row, ['Load ID', 'Load ID', 'load_id', 'Load Number', 'LoadNumber', 'load_number']) ||
              getValue(row, ['Shipment ID', 'Shipment ID', 'shipment_id']) ||
              `LOAD-${Date.now()}-${i}`,
            customerId,
            driverId: driverId || undefined,
            truckId: truckId || undefined,
            trailerId: trailerId || undefined,
            trailerNumber: trailerNumber || undefined,
            loadType: LoadType.FTL,
            // Map equipment type from Excel (default to DRY_VAN if not found)
            equipmentType: (() => {
              const eqType = getValue(row, ['Equipment type', 'Equipment Type', 'equipment_type', 'Equipment']);
              if (!eqType) return EquipmentType.DRY_VAN;
              const normalized = String(eqType).trim().toUpperCase().replace(/[_\s-]/g, '_');
              // Map common variations
              if (normalized.includes('DRY') || normalized === 'VAN' || normalized === 'DRY_VAN') return EquipmentType.DRY_VAN;
              if (normalized.includes('REEFER') || normalized.includes('REFRIGERATED')) return EquipmentType.REEFER;
              if (normalized.includes('FLAT') && !normalized.includes('STEP')) return EquipmentType.FLATBED;
              if (normalized.includes('STEP') || normalized.includes('STEPDECK')) return EquipmentType.STEP_DECK;
              if (normalized.includes('LOWBOY') || normalized.includes('LOW_BOY')) return EquipmentType.LOWBOY;
              if (normalized.includes('TANK')) return EquipmentType.TANKER;
              if (normalized.includes('CONESTOGA')) return EquipmentType.CONESTOGA;
              if (normalized.includes('POWER') || normalized.includes('POWER_ONLY')) return EquipmentType.POWER_ONLY;
              if (normalized.includes('HOTSHOT')) return EquipmentType.HOTSHOT;
              return EquipmentType.DRY_VAN; // Default fallback
            })(),
            pickupLocation: pickupLocation || pickupCity || 'Unknown',
            pickupAddress: pickupAddress || pickupCity || 'Unknown',
            pickupCity: pickupCity || 'Unknown',
            pickupState: pickupState && pickupState.length === 2 ? pickupState : '',
            pickupZip: getValue(row, ['Pickup ZIP', 'Pickup Zip', 'pickup_zip', 'Pickup ZIP Code']) || '00000', // Default to '00000' if missing (required by schema)
            deliveryLocation: deliveryLocation || deliveryCity || 'Unknown',
            deliveryAddress: deliveryAddress || deliveryCity || 'Unknown',
            deliveryCity: deliveryCity || 'Unknown',
            deliveryState: deliveryState && deliveryState.length === 2 ? deliveryState : '',
            deliveryZip: getValue(row, ['Delivery ZIP', 'Delivery Zip', 'delivery_zip', 'Delivery ZIP Code']) || '00000', // Default to '00000' if missing (required by schema)
            pickupDate: parseDate(getValue(row, ['Pickup Date', 'PickupDate', 'pickup_date'])) || new Date(),
            deliveryDate: parseDate(getValue(row, ['DEL date', 'DEL Date', 'Delivery Date', 'DeliveryDate', 'delivery_date'])),
            revenue: (() => {
              const revenueValue = getValue(row, ['Load pay', 'Load Pay', 'Revenue', 'revenue', 'Pay', 'pay']);
              if (!revenueValue) {
                console.log(`[Loads Import] No revenue value found for load ${getValue(row, ['Load ID', 'Load ID', 'load_id', 'Load Number', 'LoadNumber', 'load_number'])}`);
                return 0;
              }
              // Remove currency symbols and commas, then parse
              const cleaned = String(revenueValue).replace(/[$,\s]/g, '');
              const parsed = parseFloat(cleaned);
              if (isNaN(parsed)) {
                console.log(`[Loads Import] Could not parse revenue value: "${revenueValue}"`);
                return 0;
              }
              console.log(`[Loads Import] Parsed revenue: "${revenueValue}" -> ${parsed}`);
              return parsed;
            })(),
            driverPay: (() => {
              const payValue = getValue(row, ['Total pay', 'Total Pay', 'total_pay', 'Driver Pay', 'driver_pay']);
              if (!payValue) return undefined;
              // Remove currency symbols and commas, then parse
              const cleaned = String(payValue).replace(/[$,\s]/g, '');
              const parsed = parseFloat(cleaned);
              return isNaN(parsed) ? undefined : parsed;
            })(),
            weight: parseFloat(String(getValue(row, ['Weight', 'weight']) || '1')) || 1, // Default to 1 to satisfy positive requirement
            // Convert null to undefined for optional fields (Zod .optional() allows undefined but not null)
            commodity: nullToUndefined(getValue(row, ['Commodity', 'commodity'])),
            shipmentId: nullToUndefined(getValue(row, ['Shipment ID', 'Shipment ID', 'shipment_id'])),
            stopsCount: (() => { 
              const v = getValue(row, ['Stops count', 'Stops Count', 'stops_count']);
              if (v === null || v === '') return undefined;
              const parsed = parseInt(String(v));
              return isNaN(parsed) ? undefined : parsed;
            })(),
            totalPay: (() => { 
              const v = getValue(row, ['Total pay', 'Total Pay', 'total_pay']);
              if (v === null || v === '') return undefined;
              // Remove currency symbols and commas, then parse
              const cleaned = String(v).replace(/[$,\s]/g, '');
              const parsed = parseFloat(cleaned);
              return isNaN(parsed) ? undefined : parsed;
            })(),
            serviceFee: (() => {
              const v = getValue(row, ['Service fee', 'Service Fee', 'service_fee', 'Service Fee Amount', 'service_fee_amount']);
              if (v === null || v === '') return undefined;
              // Remove currency symbols and commas, then parse
              const cleaned = String(v).replace(/[$,\s]/g, '');
              const parsed = parseFloat(cleaned);
              return isNaN(parsed) ? undefined : parsed;
            })(),
            totalMiles: (() => { 
              const v = getValue(row, ['Total miles', 'Total Miles', 'total_miles']);
              if (v === null || v === '') return undefined;
              // Remove commas and parse
              const cleaned = String(v).replace(/[,\s]/g, '');
              const parsed = parseFloat(cleaned);
              return isNaN(parsed) ? undefined : parsed;
            })(),
            lastNote: nullToUndefined(getValue(row, ['Last note', 'Last Note', 'last_note', 'Notes', 'notes'])),
            onTimeDelivery: getValue(row, ['On Time Delivery', 'On Time Delivery', 'on_time_delivery']) === 'Yes' ? true : undefined,
            lastUpdate: nullToUndefined(parseDate(getValue(row, ['Last update', 'Last Update', 'last_update']))),
          };

          // Validate using schema
          const validated = createLoadSchema.parse(loadData);

          // Check if load number already exists (using pre-fetched set)
          if (existingLoadNumbers.has(validated.loadNumber)) {
            errors.push({
              row: i + 1,
              field: 'Load Number',
              error: `Load number already exists: ${validated.loadNumber}`,
            });
            continue;
          }

          // Convert dates from strings to Date objects
          let pickupDate: Date | null = null;
          let deliveryDate: Date | null = null;
          
          if (validated.pickupDate) {
            pickupDate = validated.pickupDate instanceof Date 
              ? validated.pickupDate 
              : new Date(validated.pickupDate);
          }
          
          if (validated.deliveryDate) {
            deliveryDate = validated.deliveryDate instanceof Date 
              ? validated.deliveryDate 
              : new Date(validated.deliveryDate);
          }

          // Prepare load data (remove stops from main load data if present)
          const { stops, loadedMiles, emptyMiles, totalMiles, ...loadDataWithoutStops } = validated;

          // Prepare load data for batch creation
          const loadCreateData: any = {
            ...loadDataWithoutStops,
            // Location fields
            pickupLocation: validated.pickupLocation || null,
            pickupAddress: validated.pickupAddress || null,
            pickupCity: validated.pickupCity || null,
            pickupState: validated.pickupState || null,
            pickupZip: validated.pickupZip || null,
            deliveryLocation: validated.deliveryLocation || null,
            deliveryAddress: validated.deliveryAddress || null,
            deliveryCity: validated.deliveryCity || null,
            deliveryState: validated.deliveryState || null,
            deliveryZip: validated.deliveryZip || null,
            // Date fields (converted to Date objects)
            pickupDate: pickupDate || null,
            deliveryDate: deliveryDate || null,
            pickupTimeStart: validated.pickupTimeStart 
              ? (validated.pickupTimeStart instanceof Date ? validated.pickupTimeStart : new Date(validated.pickupTimeStart))
              : null,
            pickupTimeEnd: validated.pickupTimeEnd 
              ? (validated.pickupTimeEnd instanceof Date ? validated.pickupTimeEnd : new Date(validated.pickupTimeEnd))
              : null,
            deliveryTimeStart: validated.deliveryTimeStart 
              ? (validated.deliveryTimeStart instanceof Date ? validated.deliveryTimeStart : new Date(validated.deliveryTimeStart))
              : null,
            deliveryTimeEnd: validated.deliveryTimeEnd 
              ? (validated.deliveryTimeEnd instanceof Date ? validated.deliveryTimeEnd : new Date(validated.deliveryTimeEnd))
              : null,
            loadedMiles: loadedMiles ?? null,
            emptyMiles: emptyMiles ?? null,
            totalMiles: totalMiles ?? (loadedMiles != null && emptyMiles != null ? loadedMiles + emptyMiles : null),
            companyId: session.user.companyId,
            // Map load status from Excel (default to PENDING if not found)
            status: (() => {
              const statusValue = getValue(row, ['Load status', 'Load Status', 'load_status', 'Status', 'status']);
              if (!statusValue) return LoadStatus.PENDING;
              const normalized = String(statusValue).trim().toUpperCase().replace(/[_\s-]/g, '_');
              // Map common variations
              if (normalized === 'PENDING' || normalized === 'NEW') return LoadStatus.PENDING;
              if (normalized === 'ASSIGNED' || normalized === 'DISPATCHED') return LoadStatus.ASSIGNED;
              if (normalized.includes('EN_ROUTE_PICKUP') || normalized.includes('EN ROUTE PICKUP') || normalized.includes('ROUTE_PICKUP')) return LoadStatus.EN_ROUTE_PICKUP;
              if (normalized === 'AT_PICKUP' || normalized.includes('AT PICKUP') || normalized === 'PICKUP') return LoadStatus.AT_PICKUP;
              if (normalized === 'LOADED' || normalized === 'PICKED_UP') return LoadStatus.LOADED;
              if (normalized.includes('EN_ROUTE_DELIVERY') || normalized.includes('EN ROUTE DELIVERY') || normalized.includes('ROUTE_DELIVERY')) return LoadStatus.EN_ROUTE_DELIVERY;
              if (normalized === 'AT_DELIVERY' || normalized.includes('AT DELIVERY') || normalized === 'DELIVERY') return LoadStatus.AT_DELIVERY;
              if (normalized === 'DELIVERED' || normalized === 'COMPLETED') return LoadStatus.DELIVERED;
              if (normalized === 'INVOICED' || normalized === 'INVOICE') return LoadStatus.INVOICED;
              if (normalized === 'PAID' || normalized === 'PAYMENT') return LoadStatus.PAID;
              if (normalized === 'CANCELLED' || normalized === 'CANCELED' || normalized === 'CANCEL') return LoadStatus.CANCELLED;
              return LoadStatus.PENDING; // Default fallback
            })(),
            // Ensure all numeric fields are properly set
            weight: validated.weight || 1,
            revenue: validated.revenue || 0,
            driverPay: validated.driverPay || null,
            fuelAdvance: validated.fuelAdvance || 0,
            expenses: 0,
            hazmat: validated.hazmat || false,
            // Include additional fields from Excel
            shipmentId: validated.shipmentId || null,
            stopsCount: validated.stopsCount || null,
            totalPay: validated.totalPay || null,
            totalMiles: validated.totalMiles || null,
            serviceFee: validated.serviceFee || null,
          };
          
          // Log the load data being created for debugging
          if (i < 3) { // Log first 3 loads
            console.log(`[Loads Import] Load ${i + 1} data:`, {
              loadNumber: loadCreateData.loadNumber,
              revenue: loadCreateData.revenue,
              driverPay: loadCreateData.driverPay,
              totalPay: loadCreateData.totalPay,
              totalMiles: loadCreateData.totalMiles,
              shipmentId: loadCreateData.shipmentId,
              stopsCount: loadCreateData.stopsCount,
            });
          }

          // Store prepared load (with stops if any)
          preparedLoads.push({
            rowIndex: i + 1,
            data: loadCreateData,
            stops: stops && stops.length > 0 ? stops.map((stop) => ({
              stopType: stop.stopType,
              sequence: stop.sequence,
              company: stop.company || null,
              address: stop.address,
              city: stop.city,
              state: stop.state,
              zip: stop.zip,
              phone: stop.phone || null,
              earliestArrival: stop.earliestArrival 
                ? (stop.earliestArrival instanceof Date ? stop.earliestArrival : new Date(stop.earliestArrival))
                : null,
              latestArrival: stop.latestArrival 
                ? (stop.latestArrival instanceof Date ? stop.latestArrival : new Date(stop.latestArrival))
                : null,
              contactName: stop.contactName || null,
              contactPhone: stop.contactPhone || null,
              items: stop.items ? stop.items : null,
              totalPieces: stop.totalPieces || null,
              totalWeight: stop.totalWeight || null,
              notes: stop.notes || null,
              specialInstructions: stop.specialInstructions || null,
            })) : undefined,
          });

          // Track load number to avoid duplicates in same batch
          existingLoadNumbers.add(validated.loadNumber);
        } catch (error: any) {
          // Handle Zod validation errors
          if (error.name === 'ZodError' && error.issues) {
            const validationErrors = error.issues.map((err: any) => 
              `${err.path.join('.')}: ${err.message}`
            ).join('; ');
            console.error(`[Loads Import] Validation error at row ${i + 1}:`, validationErrors);
            errors.push({
              row: i + 1,
              field: 'Validation',
              error: validationErrors || 'Validation failed',
            });
          } else {
            console.error(`[Loads Import] Error at row ${i + 1}:`, error);
            errors.push({
              row: i + 1,
              field: 'General',
              error: error.message || 'Failed to prepare load',
            });
          }
        }
      }

      console.log(`[Loads Import] Prepared ${preparedLoads.length} loads for batch creation`);

      // STEP 3: Batch create loads in transactions
      const loadsWithStops: typeof preparedLoads = [];
      const loadsWithoutStops: typeof preparedLoads = [];

      // Separate loads with and without stops
      preparedLoads.forEach((load) => {
        if (load.stops && load.stops.length > 0) {
          loadsWithStops.push(load);
        } else {
          loadsWithoutStops.push(load);
        }
      });

      // Batch create loads without stops using createMany (much faster)
      if (loadsWithoutStops.length > 0) {
        console.log(`[Loads Import] Creating ${loadsWithoutStops.length} loads without stops in batches of ${BATCH_SIZE}...`);
        for (let i = 0; i < loadsWithoutStops.length; i += BATCH_SIZE) {
          const batch = loadsWithoutStops.slice(i, i + BATCH_SIZE);
          const batchLoadNumbers = batch.map((l) => l.data.loadNumber);
          
          // First, check which loads already exist
          const existingLoads = await prisma.load.findMany({
            where: {
              loadNumber: { in: batchLoadNumbers },
              companyId: session.user.companyId,
            },
            select: { id: true, loadNumber: true, deletedAt: true },
          });
          
          const existingLoadNumbers = new Set(existingLoads.map(l => l.loadNumber));
          const newLoads = batch.filter(l => !existingLoadNumbers.has(l.data.loadNumber));
          const deletedLoads = existingLoads.filter(l => l.deletedAt !== null);
          const activeLoads = existingLoads.filter(l => l.deletedAt === null);
          
          console.log(`[Loads Import] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${newLoads.length} new, ${activeLoads.length} existing active, ${deletedLoads.length} deleted`);
          
          // Update existing active loads with new data
          if (activeLoads.length > 0) {
            const activeLoadNumbers = activeLoads.map(l => l.loadNumber);
            const loadsToUpdate = batch.filter(l => activeLoadNumbers.includes(l.data.loadNumber));
            
            for (const load of loadsToUpdate) {
              try {
                await prisma.load.update({
                  where: {
                    loadNumber: load.data.loadNumber,
                    companyId: session.user.companyId,
                  },
                  data: {
                    ...load.data,
                    id: undefined, // Don't update the ID
                    createdAt: undefined, // Don't update createdAt
                    updatedAt: undefined, // Let Prisma handle updatedAt
                  },
                });
              } catch (error: any) {
                console.error(`[Loads Import] Error updating load ${load.data.loadNumber}:`, error);
                errors.push({
                  row: load.rowIndex,
                  field: 'General',
                  error: `Failed to update load: ${error.message}`,
                });
              }
            }
            console.log(`[Loads Import] Updated ${loadsToUpdate.length} existing loads`);
          }
          
          // Restore and update soft-deleted loads
          if (deletedLoads.length > 0) {
            const restoredLoadNumbers = deletedLoads.map(l => l.loadNumber);
            const loadsToRestore = batch.filter(l => restoredLoadNumbers.includes(l.data.loadNumber));
            
            for (const load of loadsToRestore) {
              try {
                await prisma.load.update({
                  where: {
                    loadNumber: load.data.loadNumber,
                    companyId: session.user.companyId,
                  },
                  data: {
                    ...load.data,
                    deletedAt: null,
                    id: undefined, // Don't update the ID
                    createdAt: undefined, // Don't update createdAt
                    updatedAt: undefined, // Let Prisma handle updatedAt
                  },
                });
              } catch (error: any) {
                console.error(`[Loads Import] Error restoring load ${load.data.loadNumber}:`, error);
                errors.push({
                  row: load.rowIndex,
                  field: 'General',
                  error: `Failed to restore load: ${error.message}`,
                });
              }
            }
            console.log(`[Loads Import] Restored and updated ${loadsToRestore.length} soft-deleted loads`);
          }
          
          // Create new loads
          if (newLoads.length > 0) {
            try {
              const createResult = await prisma.load.createMany({
                data: newLoads.map((l) => l.data),
                skipDuplicates: false, // We've already filtered duplicates
              });
              console.log(`[Loads Import] createMany result:`, { count: createResult.count, batchSize: newLoads.length });
            } catch (error: any) {
              console.error(`[Loads Import] Error in batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
              // Fall back to individual creates for this batch
              for (const load of newLoads) {
                try {
                  await prisma.load.create({ data: load.data });
                } catch (err: any) {
                  errors.push({
                    row: load.rowIndex,
                    field: 'General',
                    error: err.message || 'Failed to create load',
                  });
                }
              }
            }
          }
          
          // Wait a bit for the database to commit
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Fetch all loads (newly created + existing + restored)
          const createdBatch = await prisma.load.findMany({
            where: {
              loadNumber: { in: batchLoadNumbers },
              companyId: session.user.companyId,
              deletedAt: null,
            },
            select: { id: true, loadNumber: true, createdAt: true, status: true },
          });
          
          console.log(`[Loads Import] Batch ${Math.floor(i / BATCH_SIZE) + 1}: Found ${createdBatch.length} loads total`);
          console.log(`[Loads Import] Load numbers in batch:`, batchLoadNumbers.slice(0, 5));
          console.log(`[Loads Import] Found load numbers:`, createdBatch.map(l => l.loadNumber).slice(0, 5));
          
          // Create status history entries for all loads (new, updated, and restored)
          if (createdBatch.length > 0) {
            const statusHistoryEntries = createdBatch.map((load) => ({
              loadId: load.id,
              status: load.status,
              notes: 'Imported from Excel',
              createdBy: session.user.id,
            }));
            
            try {
              await prisma.loadStatusHistory.createMany({
                data: statusHistoryEntries,
                skipDuplicates: false,
              });
              console.log(`[Loads Import] Created ${statusHistoryEntries.length} status history entries`);
            } catch (error: any) {
              console.error(`[Loads Import] Error creating status history:`, error);
              // Don't fail the import if status history creation fails
            }
          }
          
          created.push(...createdBatch);
        }
      }

      // Create loads with stops individually (but still in transactions for better performance)
      if (loadsWithStops.length > 0) {
        console.log(`[Loads Import] Creating ${loadsWithStops.length} loads with stops in batches of ${BATCH_SIZE}...`);
        for (let i = 0; i < loadsWithStops.length; i += BATCH_SIZE) {
          const batch = loadsWithStops.slice(i, i + BATCH_SIZE);
          const createdLoads = await prisma.$transaction(
            batch.map((load) =>
              prisma.load.create({
                data: {
                  ...load.data,
                  stops: {
                    create: load.stops!,
                  },
                },
              })
            ),
            { timeout: 30000 } // 30 second timeout per batch
          );
          
          // Create status history entries for loads with stops
          if (createdLoads.length > 0) {
            const statusHistoryEntries = createdLoads.map((load) => ({
              loadId: load.id,
              status: load.status,
              notes: 'Imported from Excel',
              createdBy: session.user.id,
            }));
            
            try {
              await prisma.loadStatusHistory.createMany({
                data: statusHistoryEntries,
                skipDuplicates: false,
              });
              console.log(`[Loads Import] Created ${statusHistoryEntries.length} status history entries for loads with stops`);
            } catch (error: any) {
              console.error(`[Loads Import] Error creating status history for loads with stops:`, error);
            }
          }
          
          const createdBatch = await prisma.load.findMany({
            where: {
              loadNumber: { in: batch.map((l) => l.data.loadNumber) },
              companyId: session.user.companyId,
            },
          });
          created.push(...createdBatch);
          console.log(`[Loads Import] Batch ${Math.floor(i / BATCH_SIZE) + 1}: Created ${createdBatch.length} loads with stops`);
        }
      }
      
      console.log(`[Loads Import] Completed: ${created.length} created, ${errors.length} errors`);
    } else if (entity === 'drivers') {
      // Import drivers
      console.log(`[Drivers Import] Starting import for ${importResult.data.length} rows...`);
      const bcrypt = await import('bcryptjs');
      
      for (let i = 0; i < importResult.data.length; i++) {
        const row = importResult.data[i];
        console.log(`[Drivers Import] Processing row ${i + 1}...`);
        console.log(`[Drivers Import] Row keys:`, Object.keys(row));
        try {
          // Get required fields - try multiple column name variations
          const email = getValue(row, ['Email', 'email', 'Email Address', 'email_address', 'E-mail', 'e-mail', 'EmailAddress']);
          const firstName = getValue(row, ['First Name', 'First Name', 'first_name', 'FirstName', 'firstName', 'First', 'first', 'FName', 'fname']);
          const lastName = getValue(row, ['Last Name', 'Last Name', 'last_name', 'LastName', 'lastName', 'Last', 'last', 'LName', 'lname', 'Surname', 'surname']);
          const driverNumber = getValue(row, ['Driver Number', 'Driver Number', 'driver_number', 'DriverNumber', 'driverNumber', 'Driver #', 'Driver #', 'DriverNo', 'driver_no', 'Driver ID', 'driver_id']);
          const mcNumber = getValue(row, ['MC Number', 'mc_number', 'MC #', 'mc #', 'Motor Carrier', 'motor_carrier']); // This is company identifier, not driver number
          const licenseNumber = getValue(row, ['License Number', 'License Number', 'license_number', 'LicenseNumber', 'License', 'license', 'CDL', 'cdl', 'CDL Number', 'cdl_number', 'CDL #', 'cdl #']);
          const licenseState = getValue(row, ['License State', 'License State', 'license_state', 'LicenseState', 'State', 'state', 'License State Code', 'State Code', 'state_code', 'CDL State', 'cdl_state']);
          const phone = getValue(row, ['Phone', 'phone', 'Phone Number', 'phone_number', 'PhoneNumber', 'Phone #', 'phone #', 'Mobile', 'mobile', 'Cell', 'cell', 'Cell Phone', 'cell_phone', 'Contact Number', 'contact_number', 'Contact', 'contact']);
          
          console.log(`[Drivers Import] Row ${i + 1} extracted values:`, {
            email: email ? '✓' : '✗',
            firstName: firstName ? '✓' : '✗',
            lastName: lastName ? '✓' : '✗',
            driverNumber: driverNumber ? '✓' : '✗',
            licenseNumber: licenseNumber ? '✓' : '✗',
            licenseState: licenseState ? '✓' : '✗',
            phone: phone ? '✓' : '✗',
          });
          
          // Generate driver number if not provided (use first initial + last name + row number)
          const firstInitial = firstName?.[0]?.toUpperCase() || '';
          const lastInitial = lastName?.[0]?.toUpperCase() || '';
          const lastNameShort = lastName?.toUpperCase().substring(0, 4) || 'UNKN';
          const finalDriverNumber = driverNumber || `DRV-${firstInitial}${lastInitial}-${lastNameShort}-${String(i + 1).padStart(3, '0')}`;
          
          // Generate license number if not provided (use driver number or generate)
          const finalLicenseNumber = licenseNumber || `LIC-${finalDriverNumber}`;
          
          // Default license state if not provided
          const finalLicenseState = licenseState || 'XX';
          
          console.log(`[Drivers Import] Row ${i + 1} field mapping:`, {
            mcNumber: mcNumber || 'N/A',
            driverNumber: finalDriverNumber,
            licenseNumber: finalLicenseNumber,
            licenseState: finalLicenseState,
          });
          
          // Validate required fields
          if (!email || !firstName || !lastName) {
            const missing = [];
            if (!email) missing.push('email');
            if (!firstName) missing.push('firstName');
            if (!lastName) missing.push('lastName');
            console.error(`[Drivers Import] Row ${i + 1} missing required fields:`, missing);
            errors.push({
              row: i + 1,
              field: 'Required Fields',
              error: `Missing required fields: ${missing.join(', ')}`,
            });
            continue;
          }
          
          console.log(`[Drivers Import] Row ${i + 1} using generated values:`, {
            driverNumber: finalDriverNumber,
            licenseNumber: finalLicenseNumber,
            licenseState: finalLicenseState,
          });
          
          // Check if driver already exists
          const existingDriver = await prisma.driver.findFirst({
            where: {
              OR: [
                { driverNumber: finalDriverNumber },
                { user: { email: email.toLowerCase() } },
              ],
              companyId: session.user.companyId,
            },
          });
          
          if (existingDriver) {
            errors.push({
              row: i + 1,
              field: 'Driver',
              error: `Driver already exists: ${finalDriverNumber} or ${email}`,
            });
            continue;
          }
          
          // Check if user already exists
          const existingUser = await prisma.user.findFirst({
            where: {
              email: email.toLowerCase(),
              companyId: session.user.companyId,
            },
          });
          
          if (existingUser) {
            errors.push({
              row: i + 1,
              field: 'User',
              error: `User with email ${email} already exists`,
            });
            continue;
          }
          
          // Parse dates - try multiple column name variations
          const licenseExpiry = parseDate(getValue(row, ['License Expiry', 'License Expiry', 'license_expiry', 'LicenseExpiry', 'License Expiration', 'License Exp Date', 'license_exp_date', 'CDL Expiry', 'cdl_expiry', 'CDL Expiration', 'Expiration Date', 'expiration_date']));
          const medicalCardExpiry = parseDate(getValue(row, ['Medical Card Expiry', 'Medical Card Expiry', 'medical_card_expiry', 'MedicalCardExpiry', 'Medical Expiration', 'Medical Exp Date', 'medical_exp_date', 'Medical Card Exp', 'Medical Exp', 'DOT Medical Expiry', 'dot_medical_expiry']));
          const drugTestDate = parseDate(getValue(row, ['Drug Test Date', 'Drug Test Date', 'drug_test_date', 'DrugTestDate', 'Drug Test', 'drug_test', 'Last Drug Test', 'last_drug_test', 'Drug Screen Date', 'drug_screen_date']));
          const backgroundCheck = parseDate(getValue(row, ['Background Check', 'Background Check', 'background_check', 'BackgroundCheck', 'Background Check Date', 'background_check_date', 'Background Screening', 'background_screening']));
          
          // Default dates if not provided (required fields)
          const defaultLicenseExpiry = licenseExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
          const defaultMedicalExpiry = medicalCardExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
          
          // Parse pay type and rate - try multiple column name variations
          const payTypeValue = getValue(row, ['Pay Type', 'Pay Type', 'pay_type', 'PayType', 'Payment Type', 'payment_type', 'Compensation Type', 'compensation_type']);
          const payType = payTypeValue ? (payTypeValue.toString().toUpperCase().replace(/[_\s-]/g, '_') as any) : 'PER_MILE';
          const payRate = parseFloat(String(getValue(row, ['Pay Rate', 'Pay Rate', 'pay_rate', 'PayRate', 'Rate', 'rate', 'Pay Per Mile', 'pay_per_mile', 'Mile Rate', 'mile_rate', 'Hourly Rate', 'hourly_rate']) || '0')) || 0;
          
          // Generate default password (user can change it later)
          const defaultPassword = await bcrypt.hash('Driver123!', 10);
          
          // Create user first
          const user = await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              password: defaultPassword,
              firstName,
              lastName,
              phone: phone || null,
              role: 'DRIVER',
              companyId: session.user.companyId,
            },
          });
          
          // Create driver
          const driver = await prisma.driver.create({
            data: {
              userId: user.id,
              companyId: session.user.companyId,
              driverNumber: finalDriverNumber,
              licenseNumber: finalLicenseNumber,
              licenseState: finalLicenseState.length === 2 ? finalLicenseState : finalLicenseState.substring(0, 2).toUpperCase(),
              licenseExpiry: defaultLicenseExpiry,
              medicalCardExpiry: defaultMedicalExpiry,
              drugTestDate: drugTestDate || null,
              backgroundCheck: backgroundCheck || null,
              payType: payType === 'PER_MILE' || payType === 'PER_LOAD' || payType === 'PERCENTAGE' || payType === 'HOURLY' ? payType : 'PER_MILE',
              payRate: payRate || 0,
              homeTerminal: getValue(row, ['Home Terminal', 'Home Terminal', 'home_terminal', 'HomeTerminal', 'Terminal', 'terminal', 'Base Terminal', 'base_terminal', 'Home Base', 'home_base']) || null,
              emergencyContact: getValue(row, ['Emergency Contact', 'Emergency Contact', 'emergency_contact', 'EmergencyContact', 'Emergency Contact Name', 'emergency_contact_name', 'EC Name', 'ec_name']) || null,
              emergencyPhone: getValue(row, ['Emergency Phone', 'Emergency Phone', 'emergency_phone', 'EmergencyPhone', 'Emergency Contact Phone', 'emergency_contact_phone', 'EC Phone', 'ec_phone', 'Emergency #', 'emergency #']) || null,
            },
          });
          
          created.push(driver);
          console.log(`[Drivers Import] Created driver ${finalDriverNumber} (${driver.id})`);
        } catch (error: any) {
          console.error(`[Drivers Import] Error creating driver at row ${i + 1}:`, error);
          console.error(`[Drivers Import] Row data:`, {
            email,
            firstName,
            lastName,
            driverNumber,
            licenseNumber,
            licenseState,
            phone,
            licenseExpiry: defaultLicenseExpiry,
            medicalCardExpiry: defaultMedicalExpiry,
            payType,
            payRate,
          });
          errors.push({
            row: i + 1,
            field: 'General',
            error: error.message || error.toString() || 'Failed to create driver',
          });
        }
      }
      
      console.log(`[Drivers Import] Completed: ${created.length} created, ${errors.length} errors`);
    } else if (entity === 'users' || entity === 'dispatchers' || entity === 'employees') {
      // Import users/dispatchers/employees
      console.log(`[Users Import] Starting import for ${importResult.data.length} rows...`);
      const bcrypt = await import('bcryptjs');
      
      for (let i = 0; i < importResult.data.length; i++) {
        const row = importResult.data[i];
        try {
          // Get required fields - try multiple column name variations
          const email = getValue(row, ['Email', 'email', 'Email Address', 'email_address', 'E-mail', 'e-mail', 'EmailAddress']);
          const firstName = getValue(row, ['First Name', 'First Name', 'first_name', 'FirstName', 'firstName', 'First', 'first', 'FName', 'fname']);
          const lastName = getValue(row, ['Last Name', 'Last Name', 'last_name', 'LastName', 'lastName', 'Last', 'last', 'LName', 'lname', 'Surname', 'surname']);
          const roleValue = getValue(row, ['Role', 'role', 'User Role', 'user_role', 'UserRole', 'Position', 'position', 'Job Title', 'job_title', 'Title', 'title']) || (entity === 'dispatchers' ? 'DISPATCHER' : entity === 'employees' ? 'DISPATCHER' : 'DISPATCHER');
          
          // Validate required fields
          if (!email || !firstName || !lastName) {
            errors.push({
              row: i + 1,
              field: 'Required Fields',
              error: 'Missing required fields: email, firstName, or lastName',
            });
            continue;
          }
          
          // Check if user already exists
          const existingUser = await prisma.user.findFirst({
            where: {
              email: email.toLowerCase(),
              companyId: session.user.companyId,
            },
          });
          
          if (existingUser) {
            errors.push({
              row: i + 1,
              field: 'User',
              error: `User with email ${email} already exists`,
            });
            continue;
          }
          
          // Map role
          const normalizedRole = String(roleValue).trim().toUpperCase();
          let role: 'ADMIN' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER' | 'ACCOUNTANT' = 'DISPATCHER';
          
          if (normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRATOR') role = 'ADMIN';
          else if (normalizedRole === 'DISPATCHER' || normalizedRole === 'DISPATCH') role = 'DISPATCHER';
          else if (normalizedRole === 'DRIVER') role = 'DRIVER';
          else if (normalizedRole === 'CUSTOMER') role = 'CUSTOMER';
          else if (normalizedRole === 'ACCOUNTANT' || normalizedRole === 'ACCOUNTING') role = 'ACCOUNTANT';
          
          // Generate default password (user can change it later)
          const defaultPassword = await bcrypt.hash('User123!', 10);
          
          // Create user
          const user = await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              password: defaultPassword,
              firstName,
              lastName,
              phone: getValue(row, ['Phone', 'phone', 'Phone Number', 'phone_number', 'PhoneNumber', 'Phone #', 'phone #', 'Mobile', 'mobile', 'Cell', 'cell', 'Cell Phone', 'cell_phone', 'Work Phone', 'work_phone']) || null,
              role,
              companyId: session.user.companyId,
            },
          });
          
          created.push(user);
          console.log(`[Users Import] Created user ${email} (${user.id}) with role ${role}`);
        } catch (error: any) {
          console.error(`[Users Import] Error creating user at row ${i + 1}:`, error);
          errors.push({
            row: i + 1,
            field: 'General',
            error: error.message || 'Failed to create user',
          });
        }
      }
      
      console.log(`[Users Import] Completed: ${created.length} created, ${errors.length} errors`);
    } else {
      // For other entity types, return parsed data for frontend processing
      return NextResponse.json({
        success: true,
        data: {
          entity,
          parsed: importResult.data,
          summary: importResult.summary,
          errors: importResult.errors,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        entity,
        created: created.length,
        errors: errors.length,
        details: {
          created,
          errors,
        },
      },
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to import data',
        },
      },
      { status: 500 }
    );
  }
}

