
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { excelFileToJSON } from '@/lib/import-export/excel-import';
import { csvFileToJSON } from '@/lib/import-export/csv-import';

// Importers
import { CustomerImporter } from '@/lib/managers/import/CustomerImporter';
import { TruckImporter } from '@/lib/managers/import/TruckImporter';
import { TrailerImporter } from '@/lib/managers/import/TrailerImporter';
import { DriverImporter } from '@/lib/managers/import/DriverImporter';
import { LoadImporter } from '@/lib/managers/import/LoadImporter';
import { VendorImporter } from '@/lib/managers/import/VendorImporter';
import { LocationImporter } from '@/lib/managers/import/LocationImporter';
import { EmployeeImporter } from '@/lib/managers/import/EmployeeImporter';
import { SettlementImporter } from '@/lib/managers/import/SettlementImporter';
import { InvoiceImporter } from '@/lib/managers/import/InvoiceImporter';
import { LeadImporter } from '@/lib/managers/import/LeadImporter';

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
    const mcViewMode = searchParams.get('mc'); // 'all', 'current', or specific MC ID
    const isAdmin = session.user?.role === 'ADMIN';

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

    // Build base filter with MC number
    let baseFilter = await buildMcNumberWhereClause(session, request);

    // Admin-only: Override MC filter based on view mode
    if (isAdmin && mcViewMode === 'all') {
      const { mcNumberId: _id, ...filterWithoutMc } = baseFilter as any;
      baseFilter = filterWithoutMc;
    }

    const where: any = {
      ...baseFilter,
      deletedAt: null,
    };

    let data: any[] = [];
    let headers: string[] = [];

    switch (entity) {
      case 'loads':
        const loads = await prisma.load.findMany({
          where,
          include: {
            customer: { select: { name: true } },
            driver: { select: { user: { select: { firstName: true, lastName: true } } } },
            truck: { select: { truckNumber: true } },
          },
        });
        headers = ['Load Number', 'Status', 'Customer', 'Driver', 'Truck', 'Pickup City', 'Pickup State', 'Delivery City', 'Delivery State', 'Pickup Date', 'Delivery Date', 'Revenue', 'Distance'];
        data = loads.map((load: any) => ({
          'Load Number': load.loadNumber,
          Status: load.status,
          Customer: load.customer?.name || '',
          Driver: load.driver?.user ? `${load.driver.user.firstName} ${load.driver.user.lastName}` : '',
          Truck: load.truck?.truckNumber || '',
          'Pickup City': load.pickupCity || '',
          'Pickup State': load.pickupState || '',
          'Delivery City': load.deliveryCity || '',
          'Delivery State': load.deliveryState || '',
          'Pickup Date': load.pickupDate?.toISOString() || '',
          'Delivery Date': load.deliveryDate?.toISOString() || '',
          Revenue: load.revenue?.toString() || '',
          Distance: (load.totalMiles || 0).toString(),
        }));
        break;

      case 'trucks':
        const trucks = await prisma.truck.findMany({ where });
        headers = ['Truck Number', 'VIN', 'Make', 'Model', 'Year', 'License Plate', 'State', 'Status', 'Equipment Type', 'Capacity'];
        data = trucks.map((truck) => ({
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
        const drivers = await prisma.driver.findMany({
          where,
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        });
        headers = ['Email', 'First Name', 'Last Name', 'Driver Number', 'Phone', 'License Number', 'License State', 'Status'];
        data = drivers.map((driver) => ({
          Email: driver.user?.email || '',
          'First Name': driver.user?.firstName || '',
          'Last Name': driver.user?.lastName || '',
          'Driver Number': driver.driverNumber,
          Phone: driver.user?.phone || '',
          'License Number': driver.licenseNumber,
          'License State': driver.licenseState,
          Status: driver.status,
        }));
        break;

      case 'customers':
        const customers = await prisma.customer.findMany({
          where,
          select: { customerNumber: true, name: true, type: true, email: true, phone: true }
        });
        headers = ['Customer Number', 'Name', 'Type', 'Phone', 'Email'];
        data = customers.map((c) => ({
          'Customer Number': c.customerNumber,
          Name: c.name,
          Type: c.type,
          Phone: c.phone,
          Email: c.email,
        }));
        break;

      default:
        return NextResponse.json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Export not implemented for this entity' } }, { status: 400 });
    }

    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...data.map((row) =>
          headers.map((header) => {
            const value = String(row[header] || '');
            return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
          }).join(',')
        ),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${entity}-export.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: { entity, count: data.length, headers, rows: data } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

/**
 * POST /api/import-export/[entity]
 * Import entity data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { entity } = await params;

    let data: any[] = [];
    let previewOnly = false;
    let updateExisting = false;
    let treatAsHistorical = true; // Default: treat imported loads as historical (PAID)
    let currentMcNumber: string | undefined;
    let columnMapping: any = {};
    let autoCreate: any;

    const contentType = request.headers.get('content-type') || '';

    let filename = 'manual_import';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      data = body.data || [];
      previewOnly = body.previewOnly === true;
      updateExisting = body.updateExisting === true || body.importMode === 'update';
      treatAsHistorical = body.treatAsHistorical !== false; // Default true unless explicitly false
      currentMcNumber = body.currentMcNumber || body.mcNumberId;
      columnMapping = body.columnMapping || {};
      autoCreate = body.autoCreate;

      if (!data || data.length === 0) {
        return NextResponse.json({ success: false, error: { code: 'EMPTY_DATA', message: 'No data provided' } }, { status: 400 });
      }
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File | Blob;
      previewOnly = formData.get('previewOnly') === 'true';
      updateExisting = formData.get('updateExisting') === 'true' || formData.get('importMode') === 'update';
      currentMcNumber = formData.get('currentMcNumber') as string || formData.get('mcNumber') as string || formData.get('mcNumberId') as string || undefined;
      columnMapping = JSON.parse(formData.get('columnMapping') as string || '{}');

      if (!file) {
        return NextResponse.json({ success: false, error: { code: 'MISSING_FILE', message: 'No file provided' } }, { status: 400 });
      }

      // Parse file
      const buffer = Buffer.from(await file.arrayBuffer());
      filename = ((file as any).name || 'file.csv'); // Capture filename here
      const lowerFileName = filename.toLowerCase();

      const parsed = lowerFileName.endsWith('.csv')
        ? await csvFileToJSON(buffer.toString('utf-8'))
        : await excelFileToJSON(buffer);

      data = parsed.data;

      if (!data || data.length === 0) {
        return NextResponse.json({ success: false, error: { code: 'EMPTY_FILE', message: 'File is empty' } });
      }
    }


    // Route to appropriate importer
    let importer;
    const companyId = session.user.companyId;
    const userId = session.user.id;

    switch (entity) {
      case 'customers':
        importer = new CustomerImporter(prisma, companyId, userId);
        break;
      case 'trucks':
        importer = new TruckImporter(prisma, companyId, userId);
        break;
      case 'trailers':
        importer = new TrailerImporter(prisma, companyId, userId);
        break;
      case 'drivers':
        importer = new DriverImporter(prisma, companyId, userId);
        break;
      case 'vendors':
        importer = new VendorImporter(prisma, companyId, userId);
        break;
      case 'locations':
        importer = new LocationImporter(prisma, companyId, userId);
        break;
      case 'users':
      case 'dispatchers':
      case 'employees':
        importer = new EmployeeImporter(prisma, companyId, userId);
        break;
      case 'loads':
        importer = new LoadImporter(prisma, companyId, userId);
        break;
      case 'settlements':
        importer = new SettlementImporter(prisma, companyId, userId);
        break;
      case 'invoices':
        importer = new InvoiceImporter(prisma, companyId, userId);
        break;
      case 'recruiting-leads':
        importer = new LeadImporter(prisma, companyId, userId);
        break;
      default:
        // For other entity types, return parsed data for frontend processing
        return NextResponse.json({
          success: true,
          data: {
            entity,
            parsed: data,
            // Provide structure expected by client-side importers
            details: {
              created: [],
              errors: [],
              warnings: []
            }
          },
        });
    }

    // Create Import Batch if not preview
    let importBatchId: string | undefined;
    if (!previewOnly && session.user.id) {

      const batch = await prisma.importBatch.create({
        data: {
          entityType: entity,
          status: 'PENDING', // Will update to COMPLETED or FAILED
          recordCount: 0,
          filename: filename,
          userId: session.user.id,
          companyId: session.user.companyId,
        }
      });
      importBatchId = batch.id;
    }

    const importOptions: any = {
      previewOnly,
      updateExisting,
      currentMcNumber,
      columnMapping,
      importBatchId,
      ...(entity === 'loads' && { treatAsHistorical }),
      ...(entity === 'loads' && autoCreate && { autoCreate }),
    };
    const result = await importer.import(data, importOptions);

    // Update Batch Status
    if (importBatchId && result.summary) {
      await prisma.importBatch.update({
        where: { id: importBatchId },
        data: {
          status: 'COMPLETED',
          recordCount: (result.summary.created || 0) + (result.summary.updated || 0),
        }
      });
    }

    // Map result to standard BulkImportSidebar format if in preview only
    if (previewOnly) {
      return NextResponse.json({
        success: true,
        preview: true,
        data: {
          totalRows: data.length,
          validCount: result.summary?.created || 0,
          invalidCount: result.summary?.errors || 0,
          warningCount: 0,
          valid: result.created?.slice(0, 100) || [],
          invalid: result.errors,
          warnings: result.warnings || []
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        entity,
        importBatchId, // Return the batch ID
        created: result.summary?.created || 0,
        updated: result.summary?.updated || 0,
        errors: result.summary?.errors || 0,
        details: {
          created: result.created || [],
          errors: result.errors || [],
          warnings: result.warnings || []
        }
      }
    });

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
