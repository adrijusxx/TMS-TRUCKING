import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { exportToCSV } from '@/lib/export';
import { csvFileToJSON, parseCSV } from '@/lib/import-export/csv-import';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { MigrationImportService } from '@/lib/services/MigrationImportService';
import { getCurrentMcNumber } from '@/lib/mc-number-filter';
import { z } from 'zod';
import { TruckStatus, LoadStatus } from '@prisma/client';
import type { EntityType, FieldMappingConfig } from '@/lib/types/migration';
import { LoadImporter } from '@/lib/managers/import/LoadImporter';

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

    // Build base filter with MC number if applicable
    let baseFilter = await buildMcNumberWhereClause(session, request);

    // Admin-only: Override MC filter based on view mode
    if (isAdmin && mcViewMode === 'all') {
      // Remove MC number filter to show all MCs (admin only)
      const { mcNumberId, mcNumber, ...filterWithoutMc } = baseFilter as any;
      baseFilter = filterWithoutMc;
    } else if (isAdmin && mcViewMode && mcViewMode !== 'filtered' && mcViewMode !== 'all' && mcViewMode !== null) {
      // Filter by specific MC number ID (admin selecting specific MC)
      // Handle both "mc:ID" format and plain ID format
      const mcId = mcViewMode.startsWith('mc:') ? mcViewMode.substring(3) : mcViewMode;
      const mcNumberRecord = await prisma.mcNumber.findUnique({
        where: { id: mcId },
        select: { number: true, companyId: true },
      });
      if (mcNumberRecord) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { companyId: true, userCompanies: { select: { companyId: true } } },
        });
        const accessibleCompanyIds = [
          user?.companyId,
          ...(user?.userCompanies?.map((uc) => uc.companyId) || []),
        ].filter(Boolean) as string[];

        if (accessibleCompanyIds.includes(mcNumberRecord.companyId)) {
          const trimmedMcNumber = mcNumberRecord.number?.trim();
          baseFilter = {
            ...baseFilter,
            ...(trimmedMcNumber ? { mcNumber: trimmedMcNumber } : {}),
          } as typeof baseFilter & { mcNumber?: string };
        }
      }
    }
    // Non-admin users: always use baseFilter (their assigned MC)

    // Fetch data based on entity type
    const where: any = {
      ...baseFilter,
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
        data = await prisma.customer.findMany({
          where,
          select: {
            customerNumber: true,
            name: true,
            type: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            phone: true,
            email: true,
          },
        });
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
          'Load Number': invoice.loadIds && invoice.loadIds.length > 0 ? invoice.loadIds.join(', ') : '',
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

    // Get import mode (create, update, or upsert)
    const importMode = (formData.get('importMode') as string) || 'create'; // 'create' | 'update' | 'upsert'
    // Also check for legacy 'updateExisting' parameter for backward compatibility
    const updateExistingParam = formData.get('updateExisting') === 'true';
    const updateExisting = updateExistingParam || importMode === 'update' || importMode === 'upsert';

    // Preview mode - validate and return preview data without saving
    const previewOnly = formData.get('previewOnly') === 'true';

    console.log(`[Import] importMode=${importMode}, updateExistingParam=${updateExistingParam}, updateExisting=${updateExisting}, previewOnly=${previewOnly}`);

    // Get MC number ID from form data, or fallback to session MC number
    const formMcNumberId = formData.get('mcNumberId') as string | null;
    let mcNumberId: string | undefined = undefined;

    if (formMcNumberId) {
      // Validate MC number ID belongs to company
      const mcNumber = await prisma.mcNumber.findFirst({
        where: {
          id: formMcNumberId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });
      if (mcNumber) {
        mcNumberId = mcNumber.id;
      }
    } else {
      // Fallback to session MC number
      const { getCurrentMcNumber } = await import('@/lib/mc-number-filter');
      const { mcNumber: sessionMcNumber } = await getCurrentMcNumber(session, request);
      if (sessionMcNumber) {
        const mcNumber = await prisma.mcNumber.findFirst({
          where: {
            companyId: session.user.companyId,
            number: sessionMcNumber,
            deletedAt: null,
          },
        });
        if (mcNumber) {
          mcNumberId = mcNumber.id;
        }
      }
    }

    // Helper to resolve mcNumberId to MC number string for entities that use mcNumber field
    let currentMcNumber: string | undefined = undefined;
    if (mcNumberId) {
      const mcNumberRecord = await prisma.mcNumber.findUnique({
        where: { id: mcNumberId },
        select: { number: true },
      });
      if (mcNumberRecord?.number) {
        currentMcNumber = mcNumberRecord.number.trim();
      }
    } else {
      // Legacy support: also check for mcNumber string (for backward compatibility)
      const formMcNumber = formData.get('mcNumber') as string | null;
      if (formMcNumber) {
        // Normalize MC number: trim whitespace
        currentMcNumber = formMcNumber.trim() || undefined;
      } else {
        // Fallback to session MC number
        const { getCurrentMcNumber } = await import('@/lib/mc-number-filter');
        const { mcNumber } = await getCurrentMcNumber(session, request);
        currentMcNumber = mcNumber?.trim() || undefined;
      }
    }

    // Get column mapping if provided
    let columnMapping: Record<string, string> = {};
    const mappingStr = formData.get('columnMapping') as string | null;
    if (mappingStr) {
      try {
        columnMapping = JSON.parse(mappingStr);
      } catch (e) {
        // Column mapping parse error - continue with default mapping
      }
    }

    // Get value resolutions if provided (for resolving ambiguous values)
    let valueResolutions: Record<string, Record<string, string>> = {};
    const resolutionsStr = formData.get('valueResolutions') as string | null;
    if (resolutionsStr) {
      try {
        valueResolutions = JSON.parse(resolutionsStr);
      } catch (e) {
        // Value resolutions parse error - continue with empty resolutions
      }
    }

    // Get fixed values if provided (manual overrides for all rows)
    let fixedValues: Record<string, string> = {};
    const fixedValuesStr = formData.get('fixedValues') as string | null;
    if (fixedValuesStr) {
      try {
        fixedValues = JSON.parse(fixedValuesStr);
      } catch (e) {
        // Ignore parse error
      }
    }
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

    // Normalize headers from Excel/CSV
    const normalizeKey = (key: string) => String(key || '').trim().toLowerCase().replace(/\s+/g, '_');

    // Enrich rows with fixed values (manual overrides)
    if (importResult?.data && Object.keys(fixedValues).length > 0) {
      importResult.data = importResult.data.map((row: any) => {
        const enriched = { ...row };
        Object.entries(fixedValues).forEach(([key, val]) => {
          // Add both as-is and normalized version to ensure getValue finds it
          const normalized = normalizeKey(key);
          if (enriched[normalized] === undefined || enriched[normalized] === null || enriched[normalized] === '') {
            enriched[normalized] = val;
          }
          if (enriched[key] === undefined || enriched[key] === null || enriched[key] === '') {
            enriched[key] = val;
          }
        });
        return enriched;
      });
    }
    let created: any[] = [];
    let errors: any[] = importResult.errors || [];
    let unresolvedValues: Array<{ row: number; field: string; value: string; error: string }> = [];
    let updatedCount = 0; // Track updated items count (for drivers specifically)

    // State name to code mapping
    const stateNameToCode: Record<string, string> = {
      'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
      'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
      'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
      'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
      'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
      'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
      'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
      'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
      'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
      'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
      'district of columbia': 'DC', 'washington dc': 'DC', 'dc': 'DC',
    };

    // Helper to convert state name to 2-letter code
    const normalizeState = (state: string | null | undefined): string | null => {
      if (!state) return null;
      const stateStr = String(state).trim();

      // If already 2 characters, return as-is (assuming it's already a code)
      if (stateStr.length === 2) {
        return stateStr.toUpperCase();
      }

      // Try to find in mapping
      const stateLower = stateStr.toLowerCase();
      const code = stateNameToCode[stateLower];
      if (code) {
        return code;
      }

      // Try partial match (e.g., "New York" might be split)
      for (const [name, code] of Object.entries(stateNameToCode)) {
        // Check if state name contains the key or vice versa
        if (name.includes(stateLower) || stateLower.includes(name)) {
          return code;
        }
        // Also try matching individual words
        const stateWords = stateLower.split(/\s+/);
        const nameWords = name.split(/\s+/);
        if (stateWords.some(sw => nameWords.some(nw => nw.includes(sw) || sw.includes(nw)))) {
          return code;
        }
      }

      // Try common abbreviations that might be in the data
      const abbreviationMap: Record<string, string> = {
        'calif': 'CA', 'california': 'CA',
        'fla': 'FL', 'florida': 'FL',
        'tex': 'TX', 'texas': 'TX',
        'ny': 'NY', 'new york': 'NY',
        'ill': 'IL', 'illinois': 'IL',
        'pa': 'PA', 'pennsylvania': 'PA',
        'oh': 'OH', 'ohio': 'OH',
        'ga': 'GA', 'georgia': 'GA',
        'nc': 'NC', 'north carolina': 'NC',
        'mi': 'MI', 'michigan': 'MI',
        'nj': 'NJ', 'new jersey': 'NJ',
        'va': 'VA', 'virginia': 'VA',
        'wa': 'WA', 'washington': 'WA',
        'az': 'AZ', 'arizona': 'AZ',
        'ma': 'MA', 'massachusetts': 'MA',
        'tn': 'TN', 'tennessee': 'TN',
        'in': 'IN', 'indiana': 'IN',
        'mo': 'MO', 'missouri': 'MO',
        'md': 'MD', 'maryland': 'MD',
        'wi': 'WI', 'wisconsin': 'WI',
        'co': 'CO', 'colorado': 'CO',
        'mn': 'MN', 'minnesota': 'MN',
        'sc': 'SC', 'south carolina': 'SC',
        'al': 'AL', 'alabama': 'AL',
        'la': 'LA', 'louisiana': 'LA',
        'ky': 'KY', 'kentucky': 'KY',
        'or': 'OR', 'oregon': 'OR',
        'ok': 'OK', 'oklahoma': 'OK',
        'ct': 'CT', 'connecticut': 'CT',
        'ia': 'IA', 'iowa': 'IA',
        'ut': 'UT', 'utah': 'UT',
        'ar': 'AR', 'arkansas': 'AR',
        'nv': 'NV', 'nevada': 'NV',
        'ms': 'MS', 'mississippi': 'MS',
        'ks': 'KS', 'kansas': 'KS',
        'nm': 'NM', 'new mexico': 'NM',
        'ne': 'NE', 'nebraska': 'NE',
        'wv': 'WV', 'west virginia': 'WV',
        'id': 'ID', 'idaho': 'ID',
        'hi': 'HI', 'hawaii': 'HI',
        'nh': 'NH', 'new hampshire': 'NH',
        'me': 'ME', 'maine': 'ME',
        'mt': 'MT', 'montana': 'MT',
        'ri': 'RI', 'rhode island': 'RI',
        'de': 'DE', 'delaware': 'DE',
        'sd': 'SD', 'south dakota': 'SD',
        'nd': 'ND', 'north dakota': 'ND',
        'ak': 'AK', 'alaska': 'AK',
        'dc': 'DC', 'district of columbia': 'DC',
        'vt': 'VT', 'vermont': 'VT',
        'wy': 'WY', 'wyoming': 'WY',
      };

      const abbrevCode = abbreviationMap[stateLower];
      if (abbrevCode) {
        return abbrevCode;
      }

      // If not found, return null (validation will catch it, but we'll try to use empty string as fallback)
      return null;
    };

    // Helper to get value from row (rows already have normalized keys from Excel/CSV import)
    // Uses column mapping if provided: maps system field names to Excel column names
    const getValue = (row: any, headerNames: string[]): any => {
      if (!row || typeof row !== 'object') return null;

      // Build reverse mapping: system field -> Excel column
      const reverseMapping: Record<string, string> = {};
      Object.entries(columnMapping).forEach(([excelCol, systemField]) => {
        if (systemField && systemField !== '__none__') {
          reverseMapping[systemField] = excelCol;
        }
      });

      // Try normalized keys first (since Excel/CSV import normalizes them)
      for (const headerName of headerNames) {
        // First, check if there's a column mapping for this system field
        const mappedExcelCol = reverseMapping[headerName];
        if (mappedExcelCol) {
          const mappedNormalized = normalizeKey(mappedExcelCol);
          // Try mapped Excel column
          if (row[mappedNormalized] !== undefined && row[mappedNormalized] !== null && row[mappedNormalized] !== '') {
            return row[mappedNormalized];
          }
          // Try original mapped column name
          if (row[mappedExcelCol] !== undefined && row[mappedExcelCol] !== null && row[mappedExcelCol] !== '') {
            return row[mappedExcelCol];
          }
        }

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

    // Helper to parse date - handles various formats
    const parseDate = (value: any): Date | null => {
      if (!value) return null;
      if (value instanceof Date) return value;

      // Handle string dates
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed || trimmed === '' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'na') {
          return null;
        }

        // Try parsing as-is
        let date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          return date;
        }

        // Try common Excel date formats
        // Excel serial date (days since 1900-01-01)
        const excelSerialMatch = trimmed.match(/^(\d+)(\.\d+)?$/);
        if (excelSerialMatch) {
          const excelSerial = parseFloat(excelSerialMatch[1]);
          // Excel epoch is 1900-01-01, but Excel incorrectly treats 1900 as a leap year
          const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
          date = new Date(excelEpoch.getTime() + excelSerial * 24 * 60 * 60 * 1000);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }

        // Try MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD formats
        const dateFormats = [
          /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY or DD/MM/YYYY
          /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
          /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY or DD-MM-YYYY
        ];

        for (const format of dateFormats) {
          const match = trimmed.match(format);
          if (match) {
            let year, month, day;
            if (format === dateFormats[1]) {
              // YYYY-MM-DD
              year = parseInt(match[1]);
              month = parseInt(match[2]) - 1; // JS months are 0-indexed
              day = parseInt(match[3]);
            } else {
              // Try MM/DD/YYYY first (US format)
              month = parseInt(match[1]) - 1;
              day = parseInt(match[2]);
              year = parseInt(match[3]);
              // If month > 12, it's probably DD/MM/YYYY
              if (month > 11) {
                day = parseInt(match[1]);
                month = parseInt(match[2]) - 1;
                year = parseInt(match[3]);
              }
            }
            date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
              return date;
            }
          }
        }
      }

      // Try parsing as number (timestamp or Excel serial)
      if (typeof value === 'number') {
        // If it's a reasonable timestamp (after 1970), use it
        if (value > 0 && value < 10000000000000) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        // Otherwise might be Excel serial date
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Last resort: try standard Date constructor
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
      // Import customers - batch processing for performance
      const BATCH_SIZE = 500;
      const customersToCreate: any[] = [];
      const existingCustomers = new Set<string>(); // customerNumber and name (lowercase)

      // Pre-fetch existing customers to avoid duplicate checks
      const existingCustomersData = await prisma.customer.findMany({
        where: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
        select: { customerNumber: true, name: true },
      });
      existingCustomersData.forEach(c => {
        existingCustomers.add(c.customerNumber);
        existingCustomers.add(c.name.toLowerCase().trim());
      });

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

          // Check if customer already exists
          if (existingCustomers.has(customerNumber) || existingCustomers.has(name.toLowerCase().trim())) {
            errors.push({ row: i + 1, error: `Customer already exists: ${name}` });
            continue;
          }

          const rawType = getValue(row, ['Customer type', 'Customer Type', 'type']);
          const customerType = mapCustomerType(rawType);

          // Collect all unmapped fields for metadata
          const allFields = Object.keys(row);
          const mappedFieldNames = [
            'Company name', 'Company Name', 'name', 'customer_name',
            'Customer Number', 'Customer Number', 'customer_number',
            'Customer type', 'Customer Type', 'type',
            'MC Number', 'MC Number', 'mc_number',
            'Location', 'location',
            'Website', 'website',
            'Reference number', 'Reference Number', 'reference_number',
            'Address', 'address',
            'City', 'city',
            'State', 'state',
            'ZIP', 'Zip', 'zip',
            'Contact number', 'Contact Number', 'Phone', 'phone', 'contact_number',
            'Email', 'email',
            'Billing Address', 'Billing Address', 'billing_address',
            'Billing emails', 'Billing Emails', 'billing_emails',
            'Billing type', 'Billing Type', 'billing_type',
            'Rate confirmation required', 'Rate Confirmation Required',
            'Status', 'status',
            'Tags', 'tags',
            'Warning', 'warning',
            'Credit rate', 'Credit Rate', 'credit_rate',
            'Risk level', 'Risk Level', 'risk_level',
            'Commnets', 'Comments', 'comments',
          ];
          const unmappedFields: Record<string, any> = {};
          for (const field of allFields) {
            const normalizedField = normalizeKey(field);
            const isMapped = mappedFieldNames.some(mf => normalizeKey(mf) === normalizedField);
            if (!isMapped) {
              const value = row[field];
              if (value !== null && value !== undefined && value !== '') {
                unmappedFields[field] = value;
              }
            }
          }

          // Build metadata if there are unmapped fields
          const metadata = Object.keys(unmappedFields).length > 0 ? {
            sourceSystem: 'ThirdPartyTMS',
            migratedAt: new Date().toISOString(),
            migrationVersion: '1.0',
            unmappedFields,
          } : undefined;

          customersToCreate.push({
            companyId: session.user.companyId,
            customerNumber,
            name,
            type: customerType,
            // Accepts both numeric MC numbers (e.g., "160847") and string values (e.g., company names) from CSV
            // If multiple values in CSV cell (e.g., "160847, 1090857"), uses FIRST value only
            // Priority: CSV column > Form MC selection > undefined
            mcNumber: (() => {
              const csvMcValue = getValue(row, ['MC Number', 'MC Number', 'mc_number']);
              if (csvMcValue) {
                const csvStr = csvMcValue.toString().trim();
                // Handle multiple values - split by comma, semicolon, pipe, or slash
                const values = csvStr.split(/[,;|/]/).map((v: string) => v.trim()).filter((v: string) => v);
                return values.length > 0 ? values[0] : undefined;
              }
              return currentMcNumber || undefined;
            })(),
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
            legacyTags: parseTags(getValue(row, ['Tags', 'tags'])),
            warning: getValue(row, ['Warning', 'warning']),
            creditRate: parseFloat(String(getValue(row, ['Credit rate', 'Credit Rate', 'credit_rate']) || '0')) || null,
            riskLevel: getValue(row, ['Risk level', 'Risk Level', 'risk_level']),
            comments: getValue(row, ['Commnets', 'Comments', 'comments']),
            metadata,
          });

          existingCustomers.add(customerNumber);
          existingCustomers.add(name.toLowerCase().trim());
        } catch (error: any) {
          errors.push({ row: i + 1, error: error.message || 'Failed to process customer' });
        }
      }

      // PREVIEW MODE: Return data without saving
      if (previewOnly) {
        const validRows = customersToCreate.map((c, index) => ({
          row: index + 1, // Approximation
          name: c.name,
          customerNumber: c.customerNumber,
          type: c.type || 'Unknown',
          email: c.email,
          status: 'New'
        }));

        return NextResponse.json({
          success: true,
          preview: true,
          data: {
            totalRows: importResult.data.length,
            validCount: validRows.length,
            invalidCount: errors.length,
            warningCount: 0,
            valid: validRows.slice(0, 100),
            invalid: errors,
            warnings: []
          }
        });
      }

      // Batch create customers for better performance
      for (let i = 0; i < customersToCreate.length; i += BATCH_SIZE) {
        const batch = customersToCreate.slice(i, i + BATCH_SIZE);
        try {
          await prisma.customer.createMany({
            data: batch as any,
            skipDuplicates: true,
          });
          // Fetch created customers to get their IDs
          const createdBatch = await prisma.customer.findMany({
            where: {
              companyId: session.user.companyId,
              customerNumber: { in: batch.map(c => c.customerNumber) },
            },
            select: {
              id: true,
              customerNumber: true,
              name: true,
              type: true,
              address: true,
              city: true,
              state: true,
              zip: true,
              phone: true,
              email: true,
              mcNumber: true,
              isActive: true,
              createdAt: true,
            },
          });
          created.push(...createdBatch);
        } catch (error: any) {
          // If batch fails, try individual creates
          for (let j = 0; j < batch.length; j++) {
            const customerData = batch[j];
            try {
              const { companyId, ...rest } = customerData;
              // Ensure we don't pass null to legacyTags if it's there
              const dataToCreate = {
                ...rest,
                company: { connect: { id: companyId } },
              };

              const customer = await prisma.customer.create({
                data: dataToCreate as any,
              });
              created.push(customer);
            } catch (err: any) {
              errors.push({ row: i * BATCH_SIZE + j + 1, error: err.message || 'Failed to create customer' });
            }
          }
        }
      }
    } else if (entity === 'trucks') {
      // Import trucks - batch processing for performance
      const BATCH_SIZE = 500;
      const trucksToCreate: any[] = [];
      const existingTrucks = new Set<string>(); // truckNumber and VIN

      // Pre-fetch existing trucks to avoid duplicate checks
      const existingTrucksData = await prisma.truck.findMany({
        where: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
        select: { truckNumber: true, vin: true },
      });
      existingTrucksData.forEach(t => {
        existingTrucks.add(t.truckNumber);
        if (t.vin) existingTrucks.add(t.vin);
      });

      // Helper function to resolve MC number string to McNumber ID
      // OPTIMIZATION: Pre-fetch MC Numbers for efficient lookup to avoid DB queries inside loop
      const companyMcNumbers = await prisma.mcNumber.findMany({
        where: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
        select: { id: true, number: true, companyName: true, isDefault: true },
      });

      // Default MC ID
      const defaultMcNumberId = companyMcNumbers.find(mc => mc.isDefault)?.id || companyMcNumbers[0]?.id;

      // Create lookup maps for MC numbers
      const mcNumberMap = new Map<string, string>(); // number/name -> id
      companyMcNumbers.forEach(mc => {
        if (mc.number) {
          mcNumberMap.set(mc.number.trim(), mc.id);
          mcNumberMap.set(mc.number.trim().toLowerCase(), mc.id);
        }
        if (mc.companyName) {
          mcNumberMap.set(mc.companyName.trim().toLowerCase(), mc.id);
        }
        mcNumberMap.set(mc.id, mc.id); // Also map ID to ID
      });

      // Helper function to resolve MC number string to McNumber ID (OPTIMIZED: In-memory only)
      const resolveMcNumberId = (mcValue: string | null | undefined): string | undefined => {
        if (!mcValue) return defaultMcNumberId;

        const mcStr = String(mcValue).trim();
        if (!mcStr) return defaultMcNumberId;

        // Check direct ID match (cuid)
        if (mcStr.length === 25 && mcStr.startsWith('cm')) {
          const idMatch = companyMcNumbers.find(mc => mc.id === mcStr);
          if (idMatch) return idMatch.id;
        }

        // Check map
        return mcNumberMap.get(mcStr) || mcNumberMap.get(mcStr.toLowerCase()) || defaultMcNumberId;
        /*
        if (!mcValue) {
          // If no value, try to find default MC number for the company
          const defaultMcNumber = await prisma.mcNumber.findFirst({
            where: {
              companyId: session.user.companyId,
              deletedAt: null,
              isDefault: true,
            },
            select: { id: true },
          });
          return defaultMcNumber?.id;
        }
        
        const mcStr = String(mcValue).trim();
        if (!mcStr) return undefined;
        
        // First, check if it's already an ID (cuid format)
        if (mcStr.length === 25 && mcStr.startsWith('cm')) {
          const mcNumber = await prisma.mcNumber.findFirst({
            where: {
              id: mcStr,
              companyId: session.user.companyId,
              deletedAt: null,
            },
            select: { id: true },
          });
          if (mcNumber) return mcNumber.id;
        }
        
        // Try to find by MC number first
        let mcNumber = await prisma.mcNumber.findFirst({
          where: {
            companyId: session.user.companyId,
            deletedAt: null,
            number: { equals: mcStr, mode: 'insensitive' },
          },
          select: { id: true },
        });
        
        // If not found by number, try by company name
        if (!mcNumber) {
          mcNumber = await prisma.mcNumber.findFirst({
            where: {
              companyId: session.user.companyId,
              deletedAt: null,
              companyName: { equals: mcStr, mode: 'insensitive' },
            },
            select: { id: true },
          });
        }
        
        // If still not found, try to find default MC number for the company
        if (!mcNumber) {
          mcNumber = await prisma.mcNumber.findFirst({
            where: {
              companyId: session.user.companyId,
              deletedAt: null,
              isDefault: true,
            },
            select: { id: true },
          });
        }
        
          return mcNumber?.id;
          */
      };

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

          // Check if truck already exists
          if (existingTrucks.has(truckNumber) || existingTrucks.has(vin)) {
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

          const rawStatus = getValue(row, ['Status', 'status']);
          const truckStatus = mapTruckStatus(rawStatus);

          // Resolve MC number to ID
          const mcValue = (() => {
            const csvMcValue = getValue(row, ['MC number', 'MC Number', 'mc_number']);
            if (csvMcValue) {
              const csvStr = csvMcValue.toString().trim();
              // Handle multiple values - split by comma, semicolon, pipe, or slash
              const values = csvStr.split(/[,;|/]/).map((v: string) => v.trim()).filter((v: string) => v);
              return values.length > 0 ? values[0] : undefined;
            }
            return currentMcNumber || undefined;
          })();

          // OPTIMIZATION: removed await
          const mcNumberId = resolveMcNumberId(mcValue);
          // Allow null mcNumberId - can be assigned later via bulk edit

          trucksToCreate.push({
            companyId: session.user.companyId,
            mcNumberId: mcNumberId || null,
            truckNumber,
            vin,
            make: getValue(row, ['Make', 'make']) || '',
            model: getValue(row, ['Model', 'model']) || '',
            year: parseInt(String(getValue(row, ['Year', 'year']) || new Date().getFullYear())) || new Date().getFullYear(),
            licensePlate: getValue(row, ['Plate number', 'Plate Number', 'license_plate']) || '',
            state: getValue(row, ['State', 'state']) || '',
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
            notes: getValue(row, ['Notes', 'notes']),
            warnings: getValue(row, ['Warnings', 'warnings']),
          });

          existingTrucks.add(truckNumber);
          if (vin) existingTrucks.add(vin);
        } catch (error: any) {
          errors.push({ row: i + 1, error: error.message || 'Failed to process truck' });
        }
      }

      // PREVIEW MODE: Return data without saving
      if (previewOnly) {
        const validRows = trucksToCreate.map((t, index) => ({
          row: index + 1, // Approximation as we pushed to array
          truckNumber: t.truckNumber,
          vin: t.vin,
          make: t.make,
          model: t.model,
          year: t.year,
          status: t.status
        }));

        return NextResponse.json({
          success: true,
          preview: true,
          data: {
            totalRows: importResult.data.length,
            validCount: validRows.length,
            invalidCount: errors.length,
            warningCount: 0,
            valid: validRows.slice(0, 100),
            invalid: errors,
            warnings: []
          }
        });
      }

      // Batch create trucks for better performance
      for (let i = 0; i < trucksToCreate.length; i += BATCH_SIZE) {
        const batch = trucksToCreate.slice(i, i + BATCH_SIZE);
        try {
          await prisma.truck.createMany({
            data: batch as any,
            skipDuplicates: true,
          });
          // Fetch created trucks to get their IDs
          const createdBatch = await prisma.truck.findMany({
            where: {
              companyId: session.user.companyId,
              truckNumber: { in: batch.map(t => t.truckNumber) },
            },
          });
          created.push(...createdBatch);
        } catch (error: any) {
          // If batch fails, try individual creates
          for (let j = 0; j < batch.length; j++) {
            const truckData = batch[j];
            try {
              const { companyId, ...rest } = truckData;
              const truck = await prisma.truck.create({
                data: {
                  ...rest,
                  company: { connect: { id: companyId } },
                } as any,
              });
              created.push(truck);
            } catch (err: any) {
              errors.push({ row: i * BATCH_SIZE + j + 1, error: err.message || 'Failed to create truck' });
            }
          }
        }
      }
    } else if (entity === 'trailers') {
      // Import trailers - batch processing for performance
      const BATCH_SIZE = 500; // Increased for better performance with large imports
      const trailersToCreate: any[] = [];
      const existingTrailerNumbers = new Set<string>();
      const totalRows = importResult.data.length;

      // Pre-fetch existing trailers to avoid duplicate checks
      const existingTrailers = await prisma.trailer.findMany({
        where: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
        select: { trailerNumber: true },
      });
      existingTrailers.forEach(t => existingTrailerNumbers.add(t.trailerNumber));

      for (let i = 0; i < importResult.data.length; i++) {
        const row = importResult.data[i];
        try {
          const trailerNumber = getValue(row, ['unit_number', 'Unit number', 'Unit Number', 'trailer_number', 'Trailer Number']);
          if (!trailerNumber) {
            errors.push({ row: i + 1, error: 'Unit number is required' });
            continue;
          }

          if (existingTrailerNumbers.has(trailerNumber)) {
            errors.push({ row: i + 1, error: `Trailer already exists: ${trailerNumber}` });
            continue;
          }

          const make = getValue(row, ['make', 'Make']) || 'Unknown';
          const model = getValue(row, ['model', 'Model']) || 'Unknown';

          // Note: assignedTruckId will be resolved in batch after creation
          const assignedTruckNumber = getValue(row, ['assigned_truck', 'Assigned truck', 'Assigned Truck', 'assignedTruck', 'assigned_truck_id', 'assignedTruckId']);

          // Get operator driver (can be driver number or name)
          const operatorDriverValue = getValue(row, ['operator_(driver)', 'operator (driver)', 'Operator (Driver)', 'operator_driver', 'operatorDriver', 'Operator Driver', 'operator_driver_id', 'operatorDriverId']);

          // Resolve MC number value to ID
          const csvMcValue = getValue(row, ['mc_number', 'MC Number', 'MC number', 'mcNumber']);
          let mcNumberValue: string | null = null;

          if (csvMcValue) {
            const csvStr = csvMcValue.toString().trim();
            if (csvStr) {
              // Check if multiple values (separated by comma, semicolon, pipe, or slash)
              const multipleValues = csvStr.split(/[,;|/]/).map((v: string) => v.trim()).filter((v: string) => v);

              if (multipleValues.length > 1) {
                // Multiple MC numbers found - use the first one
                mcNumberValue = multipleValues[0];
              } else {
                // Single value
                mcNumberValue = csvStr;
              }
            }
          } else if (currentMcNumber) {
            // Fall back to form MC selection
            mcNumberValue = currentMcNumber;
          }

          trailersToCreate.push({
            companyId: session.user.companyId,
            trailerNumber,
            vin: getValue(row, ['vin', 'Vin', 'VIN']) || null,
            make,
            model,
            year: parseInt(String(getValue(row, ['year', 'Year']) || '0')) || null,
            licensePlate: getValue(row, ['plate_number', 'Plate number', 'Plate Number', 'license_plate', 'plateNumber']) || null,
            state: getValue(row, ['state', 'State', 'license_state', 'licenseState']) || null,
            mcNumberValue: mcNumberValue || null, // Store for later resolution to ID
            type: getValue(row, ['type', 'Type']) || null,
            ownership: getValue(row, ['ownership', 'Ownership']) || null,
            ownerName: getValue(row, ['owner_name', 'Owner name', 'Owner Name', 'ownerName']) || null,
            assignedTruckNumber: assignedTruckNumber || null, // Store for later resolution
            status: getValue(row, ['status', 'Status']) || null,
            fleetStatus: getValue(row, ['fleet_status', 'Fleet Status', 'Fleet status', 'fleetStatus']) || null,
            registrationExpiry: parseDate(
              getValue(row, ['registration_expiry', 'Registration expiry date', 'Registration Expiry Date', 'registration_expiry_date'])
            ),
            inspectionExpiry: parseDate(
              getValue(row, ['inspection_expiry', 'Annual inspection expiry date', 'Annual Inspection Expiry Date', 'inspection_expiry_date', 'annual_inspection_expiry_date'])
            ),
            insuranceExpiry: parseDate(
              getValue(row, ['insurance_expiry', 'Insurance expiry date', 'Insurance Expiry Date', 'insurance_expiry_date', 'insuranceExpiryDate'])
            ),
            operatorDriverValue: operatorDriverValue || null, // Store for later resolution
            tags: (() => {
              const tagsValue = getValue(row, ['tags', 'Tags', 'tag', 'Tag']);
              if (!tagsValue) return null;
              // Parse tags - can be comma-separated string or JSON array
              if (typeof tagsValue === 'string') {
                try {
                  // Try parsing as JSON first
                  const parsed = JSON.parse(tagsValue);
                  if (Array.isArray(parsed)) {
                    return parsed;
                  }
                } catch {
                  // Not JSON, treat as comma-separated string
                  const tagsArray = tagsValue.split(',').map((t: string) => t.trim()).filter((t: string) => t);
                  return tagsArray.length > 0 ? tagsArray : null;
                }
              }
              return null;
            })(),
          });

          existingTrailerNumbers.add(trailerNumber);
        } catch (error: any) {
          errors.push({ row: i + 1, error: error.message || 'Failed to process trailer' });
        }
      }

      // Pre-fetch MC Numbers for resolution (trailers require mcNumberId, not mcNumber string)
      const mcNumbersForResolution = await prisma.mcNumber.findMany({
        where: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
        select: { id: true, number: true, companyName: true },
      });

      // Create maps to resolve MC number values to IDs
      // Map by numeric MC number
      const mcNumberValueMap = new Map<string, string>();
      // Map by company name (case-insensitive)
      const mcCompanyNameMap = new Map<string, string>();

      mcNumbersForResolution.forEach(mc => {
        // Map by numeric MC number
        if (mc.number) {
          const normalizedNumber = mc.number.trim();
          mcNumberValueMap.set(normalizedNumber, mc.id);
          mcNumberValueMap.set(normalizedNumber.toLowerCase(), mc.id);
        }
        // Map by company name - multiple variations for better matching
        if (mc.companyName) {
          const normalizedName = mc.companyName.trim().toLowerCase();
          mcCompanyNameMap.set(normalizedName, mc.id);
          // Try without spaces
          mcCompanyNameMap.set(normalizedName.replace(/\s+/g, ''), mc.id);
          // Try without special characters (II, INC, etc.)
          mcCompanyNameMap.set(normalizedName.replace(/[^a-z0-9]/gi, ''), mc.id);
          // Try with common variations (II vs 2, INC vs INCORPORATED)
          mcCompanyNameMap.set(normalizedName.replace(/\bii\b/g, '2'), mc.id);
          mcCompanyNameMap.set(normalizedName.replace(/\b2\b/g, 'ii'), mc.id);
          mcCompanyNameMap.set(normalizedName.replace(/\binc\b/g, 'incorporated'), mc.id);
          mcCompanyNameMap.set(normalizedName.replace(/\bincorporated\b/g, 'inc'), mc.id);
        }
      });

      // Helper function to resolve MC number value to ID with improved matching
      const resolveMcNumberId = (mcValue: string | null | undefined, fieldName: string = 'MC Number'): string | null => {
        if (!mcValue) return null;

        const trimmed = mcValue.toString().trim();
        if (!trimmed) return null;

        // First, check if there's a manual resolution provided
        const fieldResolutions = (valueResolutions && valueResolutions[fieldName]) || (valueResolutions && valueResolutions['mcNumber']) || (valueResolutions && valueResolutions['MC Number']) || {};
        if (fieldResolutions && fieldResolutions[trimmed]) {
          return fieldResolutions[trimmed];
        }

        const lowerTrimmed = trimmed.toLowerCase();

        // Try exact match by numeric MC number
        let mcId = mcNumberValueMap.get(trimmed) || mcNumberValueMap.get(lowerTrimmed);
        if (mcId) {
          return mcId;
        }

        // Try exact match by company name (case-insensitive)
        mcId = mcCompanyNameMap.get(lowerTrimmed);
        if (mcId) {
          return mcId;
        }

        // Try by company name with multiple variations and normalization
        const normalizeString = (str: string): string => {
          return str
            .toLowerCase()
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[.,\-_]/g, '') // Remove punctuation
            .replace(/\bllc\b/gi, '')
            .replace(/\binc\b/gi, '')
            .replace(/\bincorporated\b/gi, '')
            .replace(/\bcorp\b/gi, '')
            .replace(/\bcorporation\b/gi, '')
            .replace(/\bii\b/gi, '2')
            .replace(/\biii\b/gi, '3')
            .replace(/\biv\b/gi, '4')
            .trim();
        };

        const normalizedValue = normalizeString(trimmed);

        // Try normalized matching
        for (const [companyName, id] of mcCompanyNameMap.entries()) {
          const normalizedCompany = normalizeString(companyName);
          if (normalizedCompany === normalizedValue) {
            return id;
          }
        }

        // Try partial/fuzzy matching - check if the value contains any company name or vice versa
        for (const [companyName, id] of mcCompanyNameMap.entries()) {
          const normalizedCompany = normalizeString(companyName);
          // Check if one contains the other (for substantial matches)
          if (
            (normalizedValue.length > 5 && normalizedCompany.length > 5) &&
            (normalizedValue.includes(normalizedCompany) || normalizedCompany.includes(normalizedValue))
          ) {
            // Calculate similarity - if more than 70% of characters match, consider it a match
            const longer = normalizedValue.length > normalizedCompany.length ? normalizedValue : normalizedCompany;
            const shorter = normalizedValue.length > normalizedCompany.length ? normalizedCompany : normalizedValue;
            const similarity = shorter.length / longer.length;
            if (similarity > 0.7) {
              return id;
            }
          }
        }

        // Try word-by-word matching (for company names with multiple words)
        const valueWords = normalizedValue.split(/\s+/).filter(w => w.length > 2);
        if (valueWords.length > 0) {
          for (const [companyName, id] of mcCompanyNameMap.entries()) {
            const normalizedCompany = normalizeString(companyName);
            const companyWords = normalizedCompany.split(/\s+/).filter(w => w.length > 2);

            // Check if most words match
            const matchingWords = valueWords.filter(word =>
              companyWords.some(cw => cw.includes(word) || word.includes(cw))
            );
            if (matchingWords.length >= Math.min(valueWords.length, companyWords.length) * 0.8) {
              return id;
            }
          }
        }

        // If currentMcNumber was provided from form, use it as fallback
        if (currentMcNumber) {
          mcId = mcNumberValueMap.get(currentMcNumber.trim()) ||
            mcNumberValueMap.get(currentMcNumber.trim().toLowerCase());
          if (mcId) {
            return mcId;
          }
        }

        return null;
      };

      // Pre-fetch trucks and drivers for assignment resolution
      const trucksForAssignment = await prisma.truck.findMany({
        where: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
        select: { id: true, truckNumber: true },
      });
      const truckNumberMap = new Map(trucksForAssignment.map(t => [t.truckNumber, t.id]));

      // Pre-fetch drivers for operator driver resolution
      const driversForAssignment = await prisma.driver.findMany({
        where: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
        select: { id: true, driverNumber: true, user: { select: { firstName: true, lastName: true } } },
      });
      const driverNumberMap = new Map<string, string>();
      const driverNameMap = new Map<string, string>();
      driversForAssignment.forEach(d => {
        driverNumberMap.set(d.driverNumber.toLowerCase().trim(), d.id);
        if (d.user) {
          const fullName = `${d.user.firstName} ${d.user.lastName}`.toLowerCase().trim();
          driverNameMap.set(fullName, d.id);
          driverNameMap.set(`${d.user.firstName} ${d.user.lastName}`.trim(), d.id);
        }
      });

      // Track unresolved values for value resolution dialog
      const unresolvedValues: Array<{ row: number; field: string; value: string; error: string }> = [];

      // PREVIEW MODE: Return data without saving
      if (previewOnly) {
        const validRows = trailersToCreate.map((t, index) => ({
          row: index + 1, // Approximation
          trailerNumber: t.trailerNumber,
          make: t.make || 'Unknown',
          type: t.type || 'Unknown',
          year: t.year || 'Unknown',
          status: t.status || 'Unknown'
        }));

        return NextResponse.json({
          success: true,
          preview: true,
          data: {
            totalRows: importResult.data.length,
            validCount: validRows.length,
            invalidCount: errors.length,
            warningCount: 0,
            valid: validRows.slice(0, 100),
            invalid: errors,
            warnings: []
          }
        });
      }

      // Batch create trailers for better performance
      for (let i = 0; i < trailersToCreate.length; i += BATCH_SIZE) {
        const batch = trailersToCreate.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(trailersToCreate.length / BATCH_SIZE);

        try {
          // Resolve assigned truck IDs, operator driver IDs, and MC number IDs before creating
          const batchWithResolvedIds: any[] = [];
          const failedResolutions: any[] = [];

          for (const t of batch) {
            try {
              const { assignedTruckNumber, operatorDriverValue, tags, mcNumberValue, ...rest } = t;
              const assignedTruckId = assignedTruckNumber ? truckNumberMap.get(assignedTruckNumber) || null : null;

              // Resolve operator driver ID
              let operatorDriverId: string | null = null;
              if (operatorDriverValue) {
                const driverValueStr = String(operatorDriverValue).trim();
                // Try by driver number first
                operatorDriverId = driverNumberMap.get(driverValueStr.toLowerCase()) || null;
                // If not found, try by name
                if (!operatorDriverId) {
                  operatorDriverId = driverNameMap.get(driverValueStr.toLowerCase()) || driverNameMap.get(driverValueStr) || null;
                }
              }

              // Resolve MC number value to ID (optional - can be assigned later via bulk edit)
              const mcNumberId = resolveMcNumberId(mcNumberValue, 'MC Number') || null;
              // Allow null mcNumberId - can be assigned later via bulk edit

              // Prepare tags as JSON for legacyTags field
              const legacyTags = tags && Array.isArray(tags) && tags.length > 0 ? tags : null;

              batchWithResolvedIds.push({
                ...rest,
                mcNumberId, // Use mcNumberId directly for createMany (doesn't support relations)
                ...(assignedTruckId ? { assignedTruckId } : {}),
                ...(operatorDriverId ? { operatorDriverId } : {}),
                ...(legacyTags ? { legacyTags: legacyTags } : {}),
              });
            } catch (err: any) {
              console.error(`[Import Trailers] Error processing trailer ${t.trailerNumber}:`, err.message);
              failedResolutions.push({
                trailerNumber: t.trailerNumber,
                error: err.message,
              });
            }
          }

          // Log failed resolutions (only if there are failures)
          if (failedResolutions.length > 0) {
            // Add to errors and unresolved values
            failedResolutions.forEach((fail, idx) => {
              const rowNum = i * BATCH_SIZE + batch.findIndex(t => t.trailerNumber === fail.trailerNumber) + 1;
              errors.push({
                row: rowNum,
                field: fail.field || 'MC Number',
                value: fail.value || fail.mcValue || 'N/A',
                error: fail.error
              });
              unresolvedValues.push({
                row: rowNum,
                field: fail.field || 'MC Number',
                value: fail.value || fail.mcValue || 'N/A',
                error: fail.error,
              });
            });
          }

          // Skip batch if no valid trailers
          if (batchWithResolvedIds.length === 0) {
            continue;
          }

          // First, try to create new trailers
          await prisma.trailer.createMany({
            data: batchWithResolvedIds as any,
            skipDuplicates: true,
          });

          // For trailers that weren't created (duplicates), update them instead
          const trailerNumbers = batchWithResolvedIds.map(t => t.trailerNumber);

          // Check if trailers exist (including soft-deleted ones to understand the situation)
          const existingTrailers = await prisma.trailer.findMany({
            where: {
              trailerNumber: { in: trailerNumbers },
              // Don't filter by companyId or deletedAt - check all trailers with these numbers
            },
            select: {
              id: true,
              trailerNumber: true,
              mcNumberId: true,
              companyId: true,
              deletedAt: true,
            },
          });

          // Separate trailers by status
          const activeTrailers = existingTrailers.filter(t =>
            t.companyId === session.user.companyId && t.deletedAt === null
          );
          const softDeletedTrailers = existingTrailers.filter(t => t.deletedAt !== null);
          const wrongCompanyTrailers = existingTrailers.filter(t =>
            t.companyId !== session.user.companyId && t.deletedAt === null
          );

          const existingNumbers = new Set(activeTrailers.map(t => t.trailerNumber));
          const trailersToUpdate = batchWithResolvedIds.filter(t => existingNumbers.has(t.trailerNumber));

          // Update existing active trailers with new data (especially mcNumberId)
          if (trailersToUpdate.length > 0) {
            for (const trailerData of trailersToUpdate) {
              try {
                // Find the existing trailer to get its ID
                const existingTrailer = activeTrailers.find(t => t.trailerNumber === trailerData.trailerNumber);
                if (existingTrailer) {
                  await prisma.trailer.update({
                    where: {
                      id: existingTrailer.id,
                    },
                    data: {
                      ...trailerData,
                      updatedAt: new Date(), // Ensure updatedAt is refreshed
                    },
                  });
                }
              } catch (updateError: any) {
                console.error(`[Import Trailers] Failed to update trailer ${trailerData.trailerNumber}:`, updateError.message);
                errors.push({
                  row: batch.findIndex(t => t.trailerNumber === trailerData.trailerNumber) + 1,
                  error: `Failed to update trailer: ${updateError.message}`
                });
              }
            }
          }

          // Handle soft-deleted trailers - restore them
          if (softDeletedTrailers.length > 0) {
            const softDeletedNumbers = new Set(softDeletedTrailers.map(t => t.trailerNumber));
            const trailersToRestore = batchWithResolvedIds.filter(t => softDeletedNumbers.has(t.trailerNumber));

            for (const trailerData of trailersToRestore) {
              try {
                // Find the soft-deleted trailer to get its ID
                const existingSoftDeleted = softDeletedTrailers.find(t => t.trailerNumber === trailerData.trailerNumber);
                if (existingSoftDeleted) {
                  await prisma.trailer.update({
                    where: {
                      id: existingSoftDeleted.id,
                    },
                    data: {
                      ...trailerData,
                      deletedAt: null, // Restore
                      isActive: true,
                      updatedAt: new Date(),
                    },
                  });
                }
              } catch (restoreError: any) {
                console.error(`[Import Trailers] Failed to restore trailer ${trailerData.trailerNumber}:`, restoreError.message);
                errors.push({
                  row: batch.findIndex(t => t.trailerNumber === trailerData.trailerNumber) + 1,
                  error: `Failed to restore trailer: ${restoreError.message}`
                });
              }
            }
          }

          // Fetch all trailers (both newly created and updated) to get their IDs
          const createdBatch = await prisma.trailer.findMany({
            where: {
              companyId: session.user.companyId,
              trailerNumber: { in: trailerNumbers },
              deletedAt: null,
            },
          });

          if (createdBatch.length < batchWithResolvedIds.length) {
            // Check which trailers weren't created/updated
            const createdNumbers = new Set(createdBatch.map(t => t.trailerNumber));
            const missingNumbers = batchWithResolvedIds.map(t => t.trailerNumber).filter(n => !createdNumbers.has(n));

            // Try to create missing trailers individually to see what the error is
            if (missingNumbers.length > 0 && missingNumbers.length <= 5) {
              const missingTrailerData = batchWithResolvedIds.filter(t => missingNumbers.includes(t.trailerNumber));
              for (const trailerData of missingTrailerData) {
                try {
                  const created = await prisma.trailer.create({
                    data: trailerData as any,
                  });
                  createdBatch.push(created);
                } catch (createError: any) {
                  console.error(`[Import Trailers] Failed to create missing trailer ${trailerData.trailerNumber}:`, createError.message);
                  errors.push({
                    row: batch.findIndex(t => t.trailerNumber === trailerData.trailerNumber) + 1,
                    error: `Failed to create trailer: ${createError.message}`
                  });
                }
              }
            }
          }

          created.push(...createdBatch);
        } catch (error: any) {
          // If batch fails, try individual creates
          for (let j = 0; j < batch.length; j++) {
            const trailerData = batch[j];
            try {
              const { assignedTruckNumber, operatorDriverValue, tags, mcNumberValue, ...rest } = trailerData as any;
              const assignedTruckId = assignedTruckNumber ? truckNumberMap.get(assignedTruckNumber) || null : null;

              // Resolve operator driver ID
              let operatorDriverId: string | null = null;
              if (operatorDriverValue) {
                const driverValueStr = String(operatorDriverValue).trim();
                operatorDriverId = driverNumberMap.get(driverValueStr.toLowerCase()) ||
                  driverNameMap.get(driverValueStr.toLowerCase()) ||
                  driverNameMap.get(driverValueStr) || null;
              }

              // Resolve MC number value to ID (optional - can be assigned later via bulk edit)
              const mcNumberId = resolveMcNumberId(mcNumberValue) || null;
              // Strict check removed: Allow null mcNumberId to match schema and batch logic

              // Prepare tags as JSON
              const legacyTags = tags && Array.isArray(tags) && tags.length > 0 ? tags : null;

              const trailer = await prisma.trailer.create({
                data: {
                  ...rest,
                  mcNumberId, // Use mcNumberId directly (same as batch create)
                  ...(assignedTruckId ? { assignedTruckId } : {}),
                  ...(operatorDriverId ? { operatorDriverId } : {}),
                  ...(legacyTags ? { legacyTags: legacyTags } : {}),
                }
              });
              created.push(trailer);
            } catch (err: any) {
              errors.push({ row: i * BATCH_SIZE + j + 1, error: err.message || 'Failed to create trailer' });
            }
          }
        }
      }

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
      const updateExisting = formData.get('importMode') === 'update';
      const importer = new LoadImporter(prisma, session.user.companyId, session.user.id);
      const result = await importer.importLoads(importResult.data, {
        previewOnly,
        currentMcNumber,
        mcNumberId,
        updateExisting
      });

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: { code: 'IMPORT_FAILED', message: result.errors[0]?.error || 'Import failed' },
          data: result,
        }, { status: 500 });
      }

      if (previewOnly) {
        return NextResponse.json({
          success: true,
          data: {
            entity,
            preview: result.preview,
            errors: result.errors.length,
            details: { errors: result.errors },
            summary: result.summary,
          },
        });
      }

      created = result.created;
      updatedCount = result.summary?.updated || 0;
      errors = [...errors, ...result.errors];






    } else if (entity === 'drivers') {
      // Import drivers - optimized with pre-fetching and batch transactions
      // Debug: Log updateExisting value
      console.log(`[Driver Import] Starting driver import with updateExisting=${updateExisting}, importMode=${formData.get('importMode')}`);
      console.log(`[Driver Import] Total rows to process: ${importResult.data.length}`);

      const bcrypt = await import('bcryptjs');
      const BATCH_SIZE = 200; // Smaller batch for drivers due to User+Driver relationship

      // Pre-fetch all trucks for efficient lookup
      const allTrucks = await prisma.truck.findMany({
        where: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
        select: { id: true, truckNumber: true },
      });

      // Pre-fetch all trailers for efficient lookup
      const allTrailers = await prisma.trailer.findMany({
        where: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
        select: { id: true, trailerNumber: true },
      });

      // Create truck lookup map
      const truckMap = new Map<string, string>(); // truckNumber -> id
      allTrucks.forEach((t) => {
        const normalized = t.truckNumber.toLowerCase().trim();
        truckMap.set(normalized, t.id);
        // Also store without leading zeros for flexible matching
        const noZeros = normalized.replace(/^0+/, '');
        if (noZeros !== normalized) {
          truckMap.set(noZeros, t.id);
        }
        // Also store original case
        truckMap.set(t.truckNumber.trim(), t.id);
      });

      // Create trailer lookup map
      const trailerMap = new Map<string, string>(); // trailerNumber -> id
      allTrailers.forEach((t) => {
        const normalized = t.trailerNumber.toLowerCase().trim();
        trailerMap.set(normalized, t.id);
        // Also store without leading zeros for flexible matching
        const noZeros = normalized.replace(/^0+/, '');
        if (noZeros !== normalized) {
          trailerMap.set(noZeros, t.id);
        }
        // Also store original case
        trailerMap.set(t.trailerNumber.trim(), t.id);
      });

      // Collect all emails from the import file to optimize DB query
      const allImportEmails = new Set<string>();
      for (const row of importResult.data) {
        const email = getValue(row, ['Email', 'email', 'Email Address', 'email_address', 'E-mail', 'e-mail', 'EmailAddress']);
        if (email) {
          allImportEmails.add(String(email).toLowerCase().trim());
        }
      }

      // Pre-fetch existing drivers and users to avoid duplicate checks
      // ALWAYS include soft-deleted drivers/users to detect unique constraint conflicts
      // The database unique constraints apply even to soft-deleted records
      const existingDrivers = await prisma.driver.findMany({
        where: {
          companyId: session.user.companyId,
          // Always fetch all drivers (including deleted) to check unique constraints
        },
        select: {
          id: true,
          driverNumber: true,
          userId: true,
          deletedAt: true, // Include to check if driver needs reactivation
          isActive: true, // Include to check if driver needs reactivation
          user: { select: { email: true } }
        },
      });

      // GLOBAL USER CHECK: Fetch users by email ignoring company scope to prevent unique constraint violations
      // This is critical because emails must be unique globally in the User table
      const existingUsers = await prisma.user.findMany({
        where: {
          email: { in: Array.from(allImportEmails), mode: 'insensitive' },
          // OR query to also get users for existing drivers in this company (just in case they aren't in the email list)
        },
        select: { id: true, email: true, deletedAt: true, companyId: true },
      });

      const existingDriverNumbers = new Set(existingDrivers.map(d => d.driverNumber.toLowerCase().trim()));

      // existingEmails tracks ALL emails known to the system (DB + currently processing batch)
      // Initialize with emails from DB
      const existingEmails = new Set([
        ...existingDrivers.filter(d => d.user?.email).map(d => d.user!.email.toLowerCase()),
        ...existingUsers.map(u => u.email.toLowerCase()),
      ]);

      // Create lookup maps for updates
      const driverByNumber = new Map(existingDrivers.map(d => [d.driverNumber.toLowerCase().trim(), d]));
      const driverByEmail = new Map(existingDrivers.filter(d => d.user?.email).map(d => [d.user!.email.toLowerCase(), d]));
      // User map now includes companyId to check for cross-company conflicts
      const userByEmail = new Map(existingUsers.map(u => [u.email.toLowerCase(), { ...u, id: u.id }]));

      // OPTIMIZATION: Pre-fetch MC Numbers for efficient lookup to avoid DB queries inside loop
      const companyMcNumbers = await prisma.mcNumber.findMany({
        where: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
        select: { id: true, number: true, companyName: true, isDefault: true },
      });

      // Default MC ID
      const defaultMcNumberId = companyMcNumbers.find(mc => mc.isDefault)?.id || companyMcNumbers[0]?.id;

      // Create lookup maps for MC numbers
      const mcNumberMap = new Map<string, string>(); // number/name -> id
      companyMcNumbers.forEach(mc => {
        if (mc.number) {
          mcNumberMap.set(mc.number.trim(), mc.id);
          mcNumberMap.set(mc.number.trim().toLowerCase(), mc.id);
        }
        if (mc.companyName) {
          mcNumberMap.set(mc.companyName.trim().toLowerCase(), mc.id);
        }
        mcNumberMap.set(mc.id, mc.id); // Also map ID to ID
      });

      // Helper function to resolve MC number string to McNumber ID (OPTIMIZED: In-memory only)
      const resolveMcNumberId = (mcValue: string | null | undefined): string | undefined => {
        if (!mcValue) return defaultMcNumberId;

        const mcStr = String(mcValue).trim();
        if (!mcStr) return defaultMcNumberId;

        // Check direct ID match (cuid)
        if (mcStr.length === 25 && mcStr.startsWith('cm')) {
          const idMatch = companyMcNumbers.find(mc => mc.id === mcStr);
          if (idMatch) return idMatch.id;
        }

        // Check map
        return mcNumberMap.get(mcStr) || mcNumberMap.get(mcStr.toLowerCase()) || defaultMcNumberId;
      };

      // OPTIMIZATION: Calcuate default password hash ONCE outside the loop
      // This is a massive performance improvement (avoiding 100+ bcrypt calls)
      const defaultPasswordHash = await bcrypt.hash('Driver123!', 10);

      const driversToCreate: Array<{ userData: any; driverData: any; rowIndex: number }> = [];
      const driversToUpdate: Array<{ driverId: string; userId: string | null; userData: any; driverData: any; rowIndex: number; needsReactivation?: boolean }> = [];

      for (let i = 0; i < importResult.data.length; i++) {
        const row = importResult.data[i];
        try {
          // Get required fields - try multiple column name variations
          const email = getValue(row, ['Email', 'email', 'Email Address', 'email_address', 'E-mail', 'e-mail', 'EmailAddress']);
          const firstName = getValue(row, ['First Name', 'First Name', 'first_name', 'FirstName', 'firstName', 'First', 'first', 'FName', 'fname']);
          const lastName = getValue(row, ['Last Name', 'Last Name', 'last_name', 'LastName', 'lastName', 'Last', 'last', 'LName', 'lname', 'Surname', 'surname']);
          // Handle "N/A" or "na" values for driver number - treat as empty to trigger auto-generation
          let rawDriverNumber = getValue(row, ['Driver Number', 'Driver Number', 'driver_number', 'DriverNumber', 'driverNumber', 'Driver #', 'Driver #', 'DriverNo', 'driver_no', 'Driver ID', 'driver_id']);
          if (rawDriverNumber && ['n/a', 'na', 'none', 'null'].includes(String(rawDriverNumber).toLowerCase().trim())) {
            rawDriverNumber = null;
          }
          const driverNumber = rawDriverNumber;

          const mcNumber = getValue(row, ['MC Number', 'mc_number', 'MC #', 'mc #', 'Motor Carrier', 'motor_carrier']); // This is company identifier, not driver number
          const licenseNumber = getValue(row, ['License Number', 'License Number', 'license_number', 'LicenseNumber', 'License', 'license', 'CDL', 'cdl', 'CDL Number', 'cdl_number', 'CDL #', 'cdl #']);
          const licenseState = getValue(row, ['License State', 'License State', 'license_state', 'LicenseState', 'State', 'state', 'License State Code', 'State Code', 'state_code', 'CDL State', 'cdl_state']);
          const phone = getValue(row, ['Phone', 'phone', 'Phone Number', 'phone_number', 'PhoneNumber', 'Phone #', 'phone #', 'Mobile', 'mobile', 'Cell', 'cell', 'Cell Phone', 'cell_phone', 'Contact Number', 'contact_number', 'Contact', 'contact']);

          // Generate driver number if not provided (use first initial + last name + row number)
          const firstInitial = firstName?.[0]?.toUpperCase() || '';
          const lastInitial = lastName?.[0]?.toUpperCase() || '';
          const lastNameShort = lastName?.toUpperCase().substring(0, 4) || 'UNKN';
          const finalDriverNumber = driverNumber || `DRV-${firstInitial}${lastInitial}-${lastNameShort}-${String(i + 1).padStart(3, '0')}`;

          // Generate license number if not provided (use driver number or generate)
          const finalLicenseNumber = licenseNumber || `LIC-${finalDriverNumber}`;

          // Default license state if not provided
          const finalLicenseState = licenseState || 'XX';

          // Validate required fields
          if (!email || !firstName || !lastName) {
            const missing = [];
            if (!email) missing.push('email');
            if (!firstName) missing.push('firstName');
            if (!lastName) missing.push('lastName');

            // Debug: Log what was found
            console.log(`[Driver Import] Row ${i + 1} missing fields:`, {
              missing,
              found: { email: !!email, firstName: !!firstName, lastName: !!lastName },
              rowKeys: Object.keys(row).slice(0, 10) // First 10 keys for debugging
            });

            // Missing required fields
            errors.push({
              row: i + 1,
              field: 'Required Fields',
              error: `Missing required fields: ${missing.join(', ')}. Available columns: ${Object.keys(row).slice(0, 10).join(', ')}...`,
            });
            continue;
          }

          // Check if driver or user already exists
          const normalizedDriverNumber = finalDriverNumber.toLowerCase().trim();
          const normalizedEmail = email.toLowerCase().trim();

          // Check for duplicates within the current import batch
          // If it's in existingDriverNumbers but NOT in driverByNumber (DB), it's a batch duplicate
          const isBatchDuplicate = existingDriverNumbers.has(normalizedDriverNumber) && !driverByNumber.has(normalizedDriverNumber);

          // Check for duplicate EMAIL within the current import batch
          // If it's in existingEmails but NOT in userByEmail (DB) AND NOT in driverByEmail (DB), it's a batch duplicate
          // OR if we just added it to existingEmails in previous iteration of this loop
          const isEmailBatchDuplicate = existingEmails.has(normalizedEmail) && !userByEmail.has(normalizedEmail) && !driverByEmail.has(normalizedEmail);

          if (isBatchDuplicate) {
            console.log(`[Driver Import] Row ${i + 1} skipped (batch duplicate driver number): ${finalDriverNumber}`);
            errors.push({
              row: i + 1,
              field: 'Driver Number',
              error: `Duplicate driver number in file: ${finalDriverNumber}`,
            });
            continue;
          }

          if (isEmailBatchDuplicate) {
            console.log(`[Driver Import] Row ${i + 1} skipped (batch duplicate email): ${email}`);
            errors.push({
              row: i + 1,
              field: 'Email',
              error: `Duplicate email in file: ${email}`,
            });
            continue;
          }

          const existingDriver = driverByNumber.get(normalizedDriverNumber) || driverByEmail.get(normalizedEmail);
          const existingUser = userByEmail.get(normalizedEmail);

          // CHECK FOR CROSS-COMPANY CONFLICTS
          // If user exists but belongs to a different company, we allow it now (Multi-Company Driver Support)
          // We will link the existing User ID to a new Driver profile in THIS company.
          if (existingUser && existingUser.companyId !== session.user.companyId) {
            console.log(`[Driver Import] Row ${i + 1}: Found existing user in another company (${existingUser.companyId}). Will link to current company.`);
            // DO NOT SKIP. Proceed to create Driver record using existingUser.id
            // Note: We should NOT update the User's core profile (name, etc) if they belong to another company, 
            // but for now, we will follow the standard flow which might update provided fields.
          }

          // Add email to existingEmails for subsequent batch duplicate checks
          existingEmails.add(normalizedEmail);

          // For existing users, get full user record if needed
          let existingUserRecord: any = null;
          if (existingUser && !existingDriver) {
            // Fetch full user record with ID
            existingUserRecord = await prisma.user.findUnique({
              where: { email: email.toLowerCase() },
              select: { id: true, mcNumberId: true },
            });
          }

          // Debug logging
          if (existingDriver) {
            console.log(`[Driver Import] Row ${i + 1}: Found existing driver ${finalDriverNumber} (deletedAt: ${existingDriver.deletedAt}, updateExisting: ${updateExisting})`);
          }
          if (existingUser && !existingDriver) {
            console.log(`[Driver Import] Row ${i + 1}: Found existing user ${email} (no driver record) - will create driver for existing user`);
          }

          // Parse dates and prepare data (needed for both create and update)
          const licenseExpiry = parseDate(getValue(row, ['License Expiry', 'License Expiry', 'license_expiry', 'LicenseExpiry', 'License Expiration', 'License Exp Date', 'license_exp_date', 'CDL Expiry', 'cdl_expiry', 'CDL Expiration', 'Expiration Date', 'expiration_date']));
          const medicalCardExpiry = parseDate(getValue(row, ['Medical Card Expiry', 'Medical Card Expiry', 'medical_card_expiry', 'MedicalCardExpiry', 'Medical Expiration', 'Medical Exp Date', 'medical_exp_date', 'Medical Card Exp', 'Medical Exp', 'DOT Medical Expiry', 'dot_medical_expiry']));
          const drugTestDate = parseDate(getValue(row, ['Drug Test Date', 'Drug Test Date', 'drug_test_date', 'DrugTestDate', 'Drug Test', 'drug_test', 'Last Drug Test', 'last_drug_test', 'Drug Screen Date', 'drug_screen_date']));
          const backgroundCheck = parseDate(getValue(row, ['Background Check', 'Background Check', 'background_check', 'BackgroundCheck', 'Background Check Date', 'background_check_date', 'Background Screening', 'background_screening']));

          // Default dates if not provided (required fields)
          const defaultLicenseExpiry = licenseExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
          const defaultMedicalExpiry = medicalCardExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

          // Parse pay type and rate
          const payTypeValue = getValue(row, ['Pay Type', 'Pay Type', 'pay_type', 'PayType', 'Payment Type', 'payment_type', 'Compensation Type', 'compensation_type']);
          const payType = payTypeValue ? (payTypeValue.toString().toUpperCase().replace(/[_\s-]/g, '_') as any) : 'PER_MILE';
          // Defaults to 0.60 if not provided or 0
          const payRateRaw = parseFloat(String(getValue(row, ['Pay Rate', 'Pay Rate', 'pay_rate', 'PayRate', 'Rate', 'rate', 'Pay Per Mile', 'pay_per_mile', 'Mile Rate', 'mile_rate', 'Hourly Rate', 'hourly_rate']) || '0'));
          // If payRate is 0 or NaN, default to 0.60
          const payRate = (!isNaN(payRateRaw) && payRateRaw > 0) ? payRateRaw : 0.60;



          // Get pay to
          const payTo = getValue(row, ['Pay to', 'Pay To', 'pay_to', 'PayTo', 'Pay To', 'Pay To Company', 'pay_to_company', 'Payee', 'payee']) || null;

          // Get driver type
          const driverTypeValue = getValue(row, ['Driver Type', 'Driver type', 'driver_type', 'DriverType', 'Type', 'type', 'Employee Type', 'employee_type']);
          let driverType: 'COMPANY_DRIVER' | 'LEASE' | 'OWNER_OPERATOR' = 'COMPANY_DRIVER';
          if (driverTypeValue) {
            const normalizedType = driverTypeValue.toString().toLowerCase().replace(/[_\s-]/g, '_');
            if (normalizedType.includes('owner') || normalizedType.includes('company_owner')) {
              driverType = 'OWNER_OPERATOR';
            } else if (normalizedType.includes('lease')) {
              driverType = 'LEASE';
            } else {
              driverType = 'COMPANY_DRIVER';
            }
          }

          // Get truck number
          const truckNumber = getValue(row, ['Truck', 'truck', 'Truck Number', 'truck_number', 'Truck#', 'truck#', 'Unit number', 'Unit Number', 'Unit']) || null;
          let currentTruckId: string | null = null;

          if (truckNumber) {
            const normalizedTruckNumber = String(truckNumber).trim().toLowerCase();
            const truckId = truckMap.get(normalizedTruckNumber) ||
              truckMap.get(String(truckNumber).trim()) ||
              truckMap.get(normalizedTruckNumber.replace(/^0+/, ''));

            if (truckId) {
              currentTruckId = truckId;
            }
          }

          // Get trailer number
          const trailerNumber = getValue(row, ['Trailer', 'trailer', 'Trailer Number', 'trailer_number', 'Trailer#', 'trailer#']) || null;
          let currentTrailerId: string | null = null;

          if (trailerNumber) {
            const normalizedTrailerNumber = String(trailerNumber).trim().toLowerCase();
            const trailerId = trailerMap.get(normalizedTrailerNumber) ||
              trailerMap.get(String(trailerNumber).trim()) ||
              trailerMap.get(normalizedTrailerNumber.replace(/^0+/, ''));

            if (trailerId) {
              currentTrailerId = trailerId;
            }
          }

          // Get additional fields
          const teamDriverValue = getValue(row, ['Team Driver', 'team_driver', 'Team', 'team', 'Is Team', 'is_team']);
          const teamDriver = teamDriverValue ? (['yes', 'true', '1', 'y'].includes(String(teamDriverValue).toLowerCase())) : false;

          const notesVal = getValue(row, ['Notes', 'notes', 'Note', 'note']) || '';
          const warningsVal = getValue(row, ['Warnings', 'warnings', 'Warning', 'warning']) || '';

          // Combine notes and warnings
          let finalNotes = notesVal;
          if (warningsVal) {
            finalNotes = finalNotes ? `${finalNotes}\n\nWARNING: ${warningsVal}` : `WARNING: ${warningsVal}`;
          }

          // Get assignment status and dispatch status
          const assignmentStatusValue = getValue(row, ['Assign status', 'Assign Status', 'assignment_status', 'Assignment Status', 'Assignment', 'assignment']) || 'READY_TO_GO';
          let assignmentStatus: 'READY_TO_GO' | 'NOT_READY' | 'TERMINATED' = 'READY_TO_GO';
          if (assignmentStatusValue) {
            const normalized = assignmentStatusValue.toString().toLowerCase().replace(/[_\s-]/g, '_');
            if (normalized.includes('not_ready') || normalized.includes('not ready')) {
              assignmentStatus = 'NOT_READY';
            } else if (normalized.includes('terminated')) {
              assignmentStatus = 'TERMINATED';
            } else {
              assignmentStatus = 'READY_TO_GO';
            }
          }

          const dispatchStatusValue = getValue(row, ['Dispatch status', 'Dispatch Status', 'dispatch_status', 'DispatchStatus', 'Dispatch', 'dispatch', 'Note', 'note']) || null;
          let dispatchStatus: 'DISPATCHED' | 'ENROUTE' | 'TERMINATION' | 'REST' | 'AVAILABLE' | null = null;
          if (dispatchStatusValue) {
            const normalized = dispatchStatusValue.toString().toLowerCase().replace(/[_\s-]/g, '_');
            if (normalized.includes('dispatched')) {
              dispatchStatus = 'DISPATCHED';
            } else if (normalized.includes('enroute') || normalized.includes('en route')) {
              dispatchStatus = 'ENROUTE';
            } else if (normalized.includes('rest') || normalized.includes('restruck')) {
              dispatchStatus = 'REST';
            } else if (normalized.includes('available')) {
              dispatchStatus = 'AVAILABLE';
            }
          }

          // Get driver status
          const driverStatusValue = getValue(row, ['Driver status', 'Driver Status', 'driver_status', 'DriverStatus', 'Status', 'status']) || 'AVAILABLE';
          let driverStatus: 'AVAILABLE' | 'ON_DUTY' | 'DRIVING' | 'OFF_DUTY' | 'SLEEPER_BERTH' | 'ON_LEAVE' | 'INACTIVE' | 'IN_TRANSIT' | 'DISPATCHED' = 'AVAILABLE';
          if (driverStatusValue) {
            const normalized = driverStatusValue.toString().toLowerCase().replace(/[_\s-]/g, '_');
            if (normalized.includes('in_transit') || normalized.includes('in transit')) {
              driverStatus = 'IN_TRANSIT';
            } else if (normalized.includes('dispatched')) {
              driverStatus = 'DISPATCHED';
            } else if (normalized.includes('on_duty') || normalized.includes('on duty')) {
              driverStatus = 'ON_DUTY';
            } else if (normalized.includes('driving')) {
              driverStatus = 'DRIVING';
            } else if (normalized.includes('off_duty') || normalized.includes('off duty')) {
              driverStatus = 'OFF_DUTY';
            } else if (normalized.includes('sleeper') || normalized.includes('berth')) {
              driverStatus = 'SLEEPER_BERTH';
            } else if (normalized.includes('leave') || normalized.includes('vacation')) {
              driverStatus = 'ON_LEAVE';
            } else if (normalized.includes('rest')) {
              driverStatus = 'OFF_DUTY';
            } else {
              driverStatus = 'AVAILABLE';
            }
          }

          // Use MC number from file if present, otherwise use currently selected MC number
          const driverMcNumber = (mcNumber || currentMcNumber || '').toString().trim() || null;

          // Resolve MC number string to ID
          // OPTIMIZATION: removed await as function is now synchronous
          const driverMcNumberId = driverMcNumber ? resolveMcNumberId(driverMcNumber) : null;

          if (existingDriver && updateExisting) {
            // Update existing driver (including soft-deleted ones - will reactivate them)
            const needsReactivation = !!existingDriver.deletedAt || !existingDriver.isActive;
            driversToUpdate.push({
              driverId: existingDriver.id,
              userId: existingDriver.userId || null,
              rowIndex: i + 1,
              needsReactivation, // Flag to reactivate soft-deleted drivers
              userData: {
                firstName,
                lastName,
                phone: phone || null,
                ...(needsReactivation ? {
                  deletedAt: null, // Reactivate soft-deleted user
                  isActive: true,  // Reactivate inactive user
                } : {}),
                ...(driverMcNumberId ? { mcNumberId: driverMcNumberId } : {}), // Update User's MC access
              },
              driverData: {
                licenseNumber: finalLicenseNumber,
                licenseState: finalLicenseState.length === 2 ? finalLicenseState : finalLicenseState.substring(0, 2).toUpperCase(),
                licenseExpiry: defaultLicenseExpiry,
                medicalCardExpiry: defaultMedicalExpiry,
                drugTestDate: drugTestDate || null,
                backgroundCheck: backgroundCheck || null,
                payType: payType === 'PER_MILE' || payType === 'PER_LOAD' || payType === 'PERCENTAGE' || payType === 'HOURLY' ? payType : 'PER_MILE',
                payRate: payRate || 0,

                payTo: payTo || null,
                driverType,
                status: driverStatus,
                employeeStatus: assignmentStatus === 'TERMINATED' ? 'TERMINATED' : 'ACTIVE', // Set employeeStatus
                assignmentStatus,
                dispatchStatus,
                homeTerminal: getValue(row, ['Home Terminal', 'Home Terminal', 'home_terminal', 'HomeTerminal', 'Terminal', 'terminal', 'Base Terminal', 'base_terminal', 'Home Base', 'home_base']) || null,
                emergencyContact: getValue(row, ['Emergency Contact', 'Emergency Contact', 'emergency_contact', 'EmergencyContact', 'Emergency Contact Name', 'emergency_contact_name', 'EC Name', 'ec_name']) || null,
                emergencyPhone: getValue(row, ['Emergency Phone', 'Emergency Phone', 'emergency_phone', 'EmergencyPhone', 'Emergency Contact Phone', 'emergency_contact_phone', 'EC Phone', 'ec_phone', 'Emergency #', 'emergency #']) || null,
                mcNumberId: driverMcNumberId || null,
                currentTruckId: currentTruckId || null,
                currentTrailerId: currentTrailerId || null,
                teamDriver,
                notes: finalNotes || null,
                ...(needsReactivation ? {
                  deletedAt: null, // Reactivate soft-deleted driver
                  isActive: true,  // Reactivate inactive driver
                } : {}),
              },
            });
            // Driver queued for update (tracked in driversToUpdate array)
            continue; // Skip creation logic
          } else if ((existingDriver || existingUser) && !updateExisting) {
            // Create mode: skip duplicates (only if updateExisting is false)
            // Check if it's a soft-deleted record
            const isSoftDeleted = (existingDriver && existingDriver.deletedAt) ||
              (existingUser && existingUser.deletedAt);

            const errorMsg = isSoftDeleted
              ? `Driver with ${finalDriverNumber} or ${email} is soft-deleted. Enable "Update existing drivers" to reactivate them.`
              : `Driver already exists: ${finalDriverNumber} or ${email}. Enable "Update existing drivers" to update them.`;

            console.log(`[Driver Import] Row ${i + 1} skipped (duplicate): ${errorMsg}`);

            errors.push({
              row: i + 1,
              field: 'Driver',
              error: errorMsg,
            });
            continue;
          } else if (existingDriver && !updateExisting) {
            // Driver exists but updateExisting is false
            errors.push({
              row: i + 1,
              field: 'Driver',
              error: `Driver already exists: ${finalDriverNumber}. Enable "Update existing drivers" to update them.`,
            });
            continue;
          }

          // Handle existing user without driver record (when updateExisting is true)
          if (existingUser && !existingDriver && updateExisting) {
            // Create driver for existing user immediately (not in batch)
            try {
              console.log(`[Driver Import] Row ${i + 1}: Creating driver for existing user ${email}`);

              // Get user ID from existingUserRecord or fetch it
              const userId = existingUserRecord?.id || existingUser?.id;
              if (!userId) {
                // Fetch user by email to get ID
                const userRecord = await prisma.user.findUnique({
                  where: { email: email.toLowerCase() },
                  select: { id: true, mcNumberId: true },
                });
                if (!userRecord) {
                  errors.push({
                    row: i + 1,
                    field: 'User',
                    error: `User ${email} not found in database`,
                  });
                  continue;
                }
                existingUserRecord = userRecord;
              }

              // Update user info if needed
              const userUpdateData: any = {};
              if (firstName) userUpdateData.firstName = firstName;
              if (lastName) userUpdateData.lastName = lastName;
              if (phone !== undefined) userUpdateData.phone = phone || null;
              if (driverMcNumberId) userUpdateData.mcNumberId = driverMcNumberId;

              // Reactivate user if needed
              if (existingUser && existingUser.deletedAt) {
                userUpdateData.deletedAt = null;
                userUpdateData.isActive = true;
              }

              if (Object.keys(userUpdateData).length > 0) {
                await prisma.user.update({
                  where: { id: existingUserRecord.id },
                  data: userUpdateData,
                });
              }

              // Create driver record linked to existing user
              const newDriver = await prisma.driver.create({
                data: {
                  userId: existingUserRecord.id,
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

                  payTo: payTo || null,
                  driverType,
                  status: driverStatus,
                  employeeStatus: assignmentStatus === 'TERMINATED' ? 'TERMINATED' : 'ACTIVE',
                  assignmentStatus,
                  dispatchStatus,
                  homeTerminal: getValue(row, ['Home Terminal', 'Home Terminal', 'home_terminal', 'HomeTerminal', 'Terminal', 'terminal', 'Base Terminal', 'base_terminal', 'Home Base', 'home_base']) || null,
                  emergencyContact: getValue(row, ['Emergency Contact', 'Emergency Contact', 'emergency_contact', 'EmergencyContact', 'Emergency Contact Name', 'emergency_contact_name', 'EC Name', 'ec_name']) || null,
                  emergencyPhone: getValue(row, ['Emergency Phone', 'Emergency Phone', 'emergency_phone', 'EmergencyPhone', 'Emergency Contact Phone', 'emergency_contact_phone', 'EC Phone', 'ec_phone', 'Emergency #', 'emergency #']) || null,
                  mcNumberId: driverMcNumberId || null,
                  currentTruckId: currentTruckId || null,
                  currentTrailerId: currentTrailerId || null,
                  teamDriver,
                  warnings: warningsVal || null,
                  notes: notesVal || null,
                  isActive: true,
                },
              });

              created.push(newDriver);
              console.log(`[Driver Import] Row ${i + 1}: Successfully created driver ${finalDriverNumber} for existing user ${email}`);

              // Add to existing sets to prevent duplicates in same batch
              existingDriverNumbers.add(normalizedDriverNumber);
              existingEmails.add(normalizedEmail);

              continue; // Skip batch creation for this row
            } catch (error: any) {
              console.error(`[Driver Import] Row ${i + 1}: Failed to create driver for existing user:`, error);
              errors.push({
                row: i + 1,
                field: 'Driver',
                error: `Failed to create driver for existing user: ${error.message}`,
              });
              continue;
            }
          }

          // Mark as processed to avoid duplicates in same batch
          existingDriverNumbers.add(normalizedDriverNumber);
          existingEmails.add(normalizedEmail);

          // Generate default password (user can change it later)
          // OPTIMIZATION: Use pre-calculated hash
          const defaultPassword = defaultPasswordHash;

          // Prepare user and driver data for batch creation
          // Note: driverMcNumber and driverMcNumberId are already defined above
          // Ensure we have an MC number ID (required field)
          // OPTIMIZATION: removed await
          const finalMcNumberId = driverMcNumberId || resolveMcNumberId(null);
          if (!finalMcNumberId) {
            errors.push({
              row: i + 1,
              field: 'MC Number',
              error: 'No MC number found. Please ensure at least one MC number exists for the company.',
            });
            continue;
          }

          driversToCreate.push({
            rowIndex: i + 1,
            userData: {
              email: email.toLowerCase(),
              password: defaultPassword,
              firstName,
              lastName,
              phone: phone || null,
              role: 'DRIVER',
              company: {
                connect: { id: session.user.companyId },
              },
              mcNumber: {
                connect: { id: finalMcNumberId },
              },
              mcAccess: [finalMcNumberId], // Driver has access to their assigned MC
            },
            driverData: {
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

              payTo: payTo || null,
              driverType,
              status: driverStatus,
              employeeStatus: assignmentStatus === 'TERMINATED' ? 'TERMINATED' : 'ACTIVE', // Explicitly set employeeStatus
              assignmentStatus,
              dispatchStatus,
              homeTerminal: getValue(row, ['Home Terminal', 'Home Terminal', 'home_terminal', 'HomeTerminal', 'Terminal', 'terminal', 'Base Terminal', 'base_terminal', 'Home Base', 'home_base']) || null,
              emergencyContact: getValue(row, ['Emergency Contact', 'Emergency Contact', 'emergency_contact', 'EmergencyContact', 'Emergency Contact Name', 'emergency_contact_name', 'EC Name', 'ec_name']) || null,
              emergencyPhone: getValue(row, ['Emergency Phone', 'Emergency Phone', 'emergency_phone', 'EmergencyPhone', 'Emergency Contact Phone', 'emergency_contact_phone', 'EC Phone', 'ec_phone', 'Emergency #', 'emergency #']) || null,
              mcNumberId: finalMcNumberId, // Use finalMcNumberId (ensured to be non-null)
              currentTruckId: currentTruckId || null,
              currentTrailerId: currentTrailerId || null,
              teamDriver,
              warnings: warningsVal || null,
              notes: notesVal || null,
              isActive: true, // Explicitly set isActive to true for new drivers
            },
          });

        } catch (error: any) {
          errors.push({
            row: i + 1,
            field: 'General',
            error: error.message || error.toString() || 'Failed to process driver',
          });
        }
      }

      console.log(`[Driver Import] Processing: ${driversToCreate.length} to create, ${driversToUpdate.length} to update, ${errors.length} errors so far`);
      if (errors.length > 0) {
        console.log(`[Driver Import] First 5 errors:`, errors.slice(0, 5));
      }

      // PREVIEW MODE: Return data without saving
      if (previewOnly) {
        // Create a combined list of valid operations for preview
        const validRows = [
          ...driversToCreate.map(d => ({
            row: d.rowIndex,
            name: `${d.userData.firstName} ${d.userData.lastName}`,
            driverNumber: d.driverData.driverNumber,
            email: d.userData.email,
            type: d.driverData.driverType,
            status: 'New',
            operation: 'Create'
          })),
          ...driversToUpdate.map(d => ({
            row: d.rowIndex,
            name: `${d.userData.firstName} ${d.userData.lastName}`,
            driverNumber: d.driverData.driverNumber || 'Existing',
            email: d.userData.email,
            type: d.driverData.driverType,
            status: d.needsReactivation ? 'Reactivate' : 'Update',
            operation: 'Update'
          }))
        ].sort((a, b) => a.row - b.row);

        return NextResponse.json({
          success: true,
          preview: true,
          data: {
            totalRows: importResult.data.length,
            validCount: validRows.length,
            invalidCount: errors.length,
            warningCount: 0, // Drivers don't have separate warnings yet in this logic (warnings are inside driver notes)
            valid: validRows.slice(0, 100), // Limit to 100 for UI performance
            invalid: errors,
            warnings: []
          }
        });
      }

      // Batch create drivers using transactions (User + Driver relationship)
      for (let i = 0; i < driversToCreate.length; i += BATCH_SIZE) {
        const batch = driversToCreate.slice(i, i + BATCH_SIZE);
        try {
          // Use transaction to create user + driver pairs in batch
          const results = await prisma.$transaction(
            batch.map((item) =>
              prisma.user.create({
                data: {
                  ...item.userData,
                  drivers: {
                    create: item.driverData,
                  },
                },
                include: { drivers: true },
              })
            )
          );
          created.push(...results.map(r => r.drivers[0]!));
        } catch (error: any) {
          // If batch fails, try individual creates
          for (const item of batch) {
            try {
              const user = await prisma.user.create({
                data: {
                  ...item.userData,
                  drivers: {
                    create: item.driverData,
                  },
                },
                include: { drivers: true },
              });
              created.push(user.drivers[0]!);
            } catch (err: any) {
              errors.push({
                row: item.rowIndex,
                field: 'General',
                error: err.message || 'Failed to create driver',
              });
            }
          }
        }
      }

      // Batch update existing drivers if update mode is enabled
      if (updateExisting && driversToUpdate.length > 0) {
        for (let i = 0; i < driversToUpdate.length; i += BATCH_SIZE) {
          const batch = driversToUpdate.slice(i, i + BATCH_SIZE);
          try {
            // Use transaction to update user + driver pairs in batch
            const results = await prisma.$transaction(async (tx) => {
              const updatePromises = batch.map(async (item) => {
                // Update user (only if user exists)
                if (item.userId) {
                  await tx.user.update({
                    where: { id: item.userId },
                    data: item.userData,
                  });
                }

                // Update driver
                const updatedDriver = await tx.driver.update({
                  where: { id: item.driverId },
                  data: item.driverData,
                });

                return updatedDriver;
              });

              return Promise.all(updatePromises);
            });
            created.push(...results); // Count updates as "created" for response
            updatedCount += results.length; // Track updated count
          } catch (error: any) {
            // If batch fails, try individual updates
            for (const item of batch) {
              try {
                // Update user (only if user exists)
                if (item.userId) {
                  await prisma.user.update({
                    where: { id: item.userId },
                    data: item.userData,
                  });
                }

                // Update driver
                const updatedDriver = await prisma.driver.update({
                  where: { id: item.driverId },
                  data: item.driverData,
                });

                created.push(updatedDriver);
                updatedCount += 1; // Track updated count
              } catch (err: any) {
                errors.push({
                  row: item.rowIndex,
                  field: 'General',
                  error: err.message || 'Failed to update driver',
                });
              }
            }
          }
        }
      }

    } else if (entity === 'users' || entity === 'dispatchers' || entity === 'employees') {
      // Import users/dispatchers/employees
      // Starting users import
      const bcrypt = await import('bcryptjs');

      // Get or create default MC number for the company
      let mcNumber = await prisma.mcNumber.findFirst({
        where: {
          companyId: session.user.companyId,
          isDefault: true,
        },
      });

      if (!mcNumber) {
        const company = await prisma.company.findUnique({
          where: { id: session.user.companyId },
        });
        mcNumber = await prisma.mcNumber.create({
          data: {
            companyId: session.user.companyId,
            number: company?.mcNumber || `MC-${Date.now()}`,
            companyName: company?.name || 'Company',
            type: 'CARRIER',
            isDefault: true,
          },
        });
      }

      // Pre-fetch existing users to avoid duplicate checks inside loop
      const existingUsers = await prisma.user.findMany({
        where: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
        select: { email: true, employeeNumber: true },
      });
      const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
      const existingEmployeeNumbers = new Set(existingUsers.filter(u => u.employeeNumber).map(u => u.employeeNumber!));

      // Collect users to create (for preview and batch creation)
      const usersToCreate: Array<{
        rowIndex: number;
        userData: any;
      }> = [];

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
          if (existingEmails.has(email.toLowerCase())) {
            errors.push({
              row: i + 1,
              field: 'User',
              error: `User with email ${email} already exists`,
            });
            continue;
          }

          // Map role - expanded to include HR, SAFETY, FLEET
          const normalizedRole = String(roleValue).trim().toUpperCase();
          let role: 'ADMIN' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER' | 'ACCOUNTANT' | 'HR' | 'SAFETY' | 'FLEET' = 'DISPATCHER';

          if (normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRATOR') role = 'ADMIN';
          else if (normalizedRole === 'DISPATCHER' || normalizedRole === 'DISPATCH') role = 'DISPATCHER';
          else if (normalizedRole === 'DRIVER') role = 'DRIVER';
          else if (normalizedRole === 'CUSTOMER') role = 'CUSTOMER';
          else if (normalizedRole === 'ACCOUNTANT' || normalizedRole === 'ACCOUNTING') role = 'ACCOUNTANT';
          else if (normalizedRole === 'HR' || normalizedRole === 'HUMAN RESOURCES') role = 'HR';
          else if (normalizedRole === 'SAFETY') role = 'SAFETY';
          else if (normalizedRole === 'FLEET' || normalizedRole === 'FLEET MANAGEMENT') role = 'FLEET';

          // Get employee status (active/inactive)
          const statusValue = getValue(row, ['Status', 'status', 'employee_status', 'Employee Status', 'Active', 'Is Active', 'isActive']);
          const isActive = !statusValue || ['active', 'yes', 'true', '1', 'y'].includes(String(statusValue).trim().toLowerCase());

          // Get employee number / login
          const employeeNumber = getValue(row, ['Employee Number', 'employee_number', 'Emp Number', 'login', 'Login', 'Username', 'username']);

          // Check for duplicate employee number
          if (employeeNumber && existingEmployeeNumbers.has(employeeNumber)) {
            errors.push({
              row: i + 1,
              field: 'Employee Number',
              error: `Employee number ${employeeNumber} already exists`,
            });
            continue;
          }

          // Get nickname
          const nickname = getValue(row, ['Nickname', 'nickname', 'Display Name', 'display_name', 'Preferred Name', 'preferred_name', 'Nick']);

          // Get tags (comma-separated)
          const tagsValue = getValue(row, ['Tags', 'tags', 'Labels', 'labels', 'Categories', 'categories']);
          const tags: string[] = tagsValue
            ? String(tagsValue).split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
            : [];

          // Get notes
          const notes = getValue(row, ['Notes', 'notes', 'Comments', 'comments', 'Description', 'description']);

          usersToCreate.push({
            rowIndex: i + 1,
            userData: {
              email: email.toLowerCase(),
              firstName,
              lastName,
              phone: getValue(row, ['Phone', 'phone', 'Phone Number', 'phone_number', 'PhoneNumber', 'Phone #', 'phone #', 'Mobile', 'mobile', 'Cell', 'cell', 'Cell Phone', 'cell_phone', 'Work Phone', 'work_phone']) || null,
              role,
              isActive,
              employeeNumber: employeeNumber || null,
              nickname: nickname || null,
              tags,
              notes: notes || null,
              companyId: session.user.companyId,
              mcNumberId: mcNumber.id,
            },
          });

          // Track to avoid duplicates within same file
          existingEmails.add(email.toLowerCase());
          if (employeeNumber) existingEmployeeNumbers.add(employeeNumber);

        } catch (error: any) {
          errors.push({
            row: i + 1,
            field: 'General',
            error: error.message || 'Failed to process user',
          });
        }
      }

      // PREVIEW MODE: Return data without saving
      if (previewOnly) {
        const validRows = usersToCreate.map(u => ({
          row: u.rowIndex,
          name: `${u.userData.firstName} ${u.userData.lastName}`,
          email: u.userData.email,
          role: u.userData.role,
          status: u.userData.isActive ? 'Active' : 'Inactive',
        }));

        return NextResponse.json({
          success: true,
          preview: true,
          data: {
            totalRows: importResult.data.length,
            validCount: validRows.length,
            invalidCount: errors.length,
            warningCount: 0,
            valid: validRows.slice(0, 100),
            invalid: errors,
            warnings: []
          }
        });
      }

      // Create users with batch processing
      const BATCH_SIZE = 50;
      const defaultPassword = await bcrypt.hash('User123!', 10);

      for (let i = 0; i < usersToCreate.length; i += BATCH_SIZE) {
        const batch = usersToCreate.slice(i, i + BATCH_SIZE);

        for (const item of batch) {
          try {
            const user = await prisma.user.create({
              data: {
                ...item.userData,
                password: defaultPassword,
              },
            });
            created.push(user);
          } catch (error: any) {
            errors.push({
              row: item.rowIndex,
              field: 'General',
              error: error.message || 'Failed to create user',
            });
          }
        }
      }


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

    // Extract unresolved values from errors (for value resolution dialog)
    const unresolvedValuesFromErrors: Array<{ row: number; field: string; value: string; error: string }> = [];
    errors.forEach((error: any) => {
      if (error.field && error.value && (error.error?.includes('could not be resolved') || error.error?.includes('not found'))) {
        unresolvedValuesFromErrors.push({
          row: error.row || 0,
          field: error.field,
          value: error.value,
          error: error.error || error.message || 'Could not be resolved',
        });
      }
    });

    // Merge with any unresolved values tracked during processing (e.g., from trailers)
    const allUnresolvedValues = [...unresolvedValuesFromErrors];
    if (typeof unresolvedValues !== 'undefined' && unresolvedValues.length > 0) {
      // Deduplicate by row + field + value
      const seen = new Set<string>();
      unresolvedValues.forEach(uv => {
        const key = `${uv.row}-${uv.field}-${uv.value}`;
        if (!seen.has(key)) {
          seen.add(key);
          allUnresolvedValues.push(uv);
        }
      });
    }

    console.log(`[Driver Import] Completed: ${created.length} created/updated, ${errors.length} errors`);

    // If entity is drivers and nothing was created/updated but there are errors, provide helpful message
    if (entity === 'drivers' && created.length === 0 && errors.length > 0) {
      const softDeletedCount = errors.filter((e: any) =>
        e.error?.includes('soft-deleted') || e.error?.includes('already exists')
      ).length;

      if (softDeletedCount > 0) {
        console.log(`[Driver Import] Warning: ${softDeletedCount} drivers were skipped (duplicates/soft-deleted). Enable "Update existing drivers" to reactivate them.`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        entity,
        created: created.length,
        updated: updatedCount,
        errors: errors.length,
        details: {
          created,
          errors,
        },
        unresolvedValues: allUnresolvedValues.length > 0 ? allUnresolvedValues : undefined,
        message: entity === 'drivers' && created.length === 0 && errors.length > 0
          ? `No drivers were imported. ${errors.length} error(s) occurred. Check error details below. If drivers are soft-deleted, enable "Update existing drivers" to reactivate them.`
          : undefined,
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

