import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { InvoiceStatus, ReconciliationStatus } from '@prisma/client';
import { calculateAgingDays } from '@/lib/utils/aging';

const BATCH_SIZE = 500; // Process invoices in batches for performance

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FILE', message: 'No file provided' } },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    if (data.length <= 1) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_DATA', message: 'No data rows found' } },
        { status: 400 }
      );
    }

    const headers = (data[0] as any[]).map((h: any) => String(h || '').trim());
    const rows = data.slice(1) as any[];

    // Normalize headers
    const normalizedHeaders = headers.map((h) =>
      String(h || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    );

    // Helper to get value from row
    const getValue = (row: any, headerNames: string[]): any => {
      for (const headerName of headerNames) {
        const normalized = headerName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const index = normalizedHeaders.indexOf(normalized);
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
      if (typeof value === 'number') {
        // Excel serial date
        return new Date((value - 25569) * 86400 * 1000);
      }
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    };

    // Pre-fetch customers for fast lookup
    const customers = await prisma.customer.findMany({
      where: { companyId: session.user.companyId, isActive: true },
      select: { id: true, name: true, customerNumber: true },
    });
    const customerMap = new Map<string, string>();
    customers.forEach((c) => {
      customerMap.set(c.name.toLowerCase(), c.id);
      if (c.customerNumber) {
        customerMap.set(c.customerNumber.toLowerCase(), c.id);
      }
    });

    // Pre-fetch loads for fast lookup
    const loads = await prisma.load.findMany({
      where: { companyId: session.user.companyId, deletedAt: null },
      select: { id: true, loadNumber: true },
    });
    const loadMap = new Map<string, string>();
    loads.forEach((l) => {
      loadMap.set(l.loadNumber.toLowerCase(), l.id);
    });

    const results = {
      created: 0,
      updated: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    // First pass: collect all invoice numbers to check existence in bulk
    const invoiceNumbers: string[] = [];
    const rowData: Array<{
      row: any;
      rowNumber: number;
      invoiceNumber: string;
      customerName: string;
      loadIdValue: any;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const invoiceNumber = getValue(row, [
        'Invoice ID',
        'invoice_id',
        'invoice_number',
        'invoice',
      ]);
      if (invoiceNumber) {
        invoiceNumbers.push(String(invoiceNumber));
        rowData.push({
          row,
          rowNumber: i + 2,
          invoiceNumber: String(invoiceNumber),
          customerName: getValue(row, ['Customer name', 'customer_name', 'customer']) || '',
          loadIdValue: getValue(row, ['Load ID', 'load_id', 'load']),
        });
      }
    }

    // Bulk check existing invoices
    const existingInvoices = await prisma.invoice.findMany({
      where: {
        invoiceNumber: { in: invoiceNumbers },
        customer: { companyId: session.user.companyId },
      },
      select: { id: true, invoiceNumber: true },
    });
    const existingInvoiceMap = new Map<string, string>();
    existingInvoices.forEach((inv) => {
      existingInvoiceMap.set(inv.invoiceNumber, inv.id);
    });

    // Process in batches for performance
    const invoicesToCreate: any[] = [];
    const invoicesToUpdate: any[] = [];

    for (let i = 0; i < rowData.length; i++) {
      const { row, rowNumber, invoiceNumber, customerName, loadIdValue } = rowData[i];

      try {
        // Get customer
        const customerId = customerName
          ? customerMap.get(customerName.toLowerCase())
          : null;

        if (!customerId) {
          results.errors.push({
            row: rowNumber,
            error: `Customer not found: ${customerName || 'N/A'}`,
          });
          continue;
        }

        // Get load ID
        const loadId = loadIdValue ? loadMap.get(String(loadIdValue).toLowerCase()) : null;

        // Parse dates
        const invoiceDate = parseDate(
          getValue(row, ['Date', 'date', 'invoice_date', 'Invoice Date'])
        ) || new Date();
        const dueDate = parseDate(
          getValue(row, ['Due Date', 'due_date', 'Due date'])
        ) || new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const paymentDate = parseDate(
          getValue(row, ['Payment date', 'payment_date', 'Payment Date'])
        );
        const collectedDate = parseDate(
          getValue(row, ['Collected date', 'collected_date', 'Collected Date'])
        );

        // Parse amounts
        const accrual = parseFloat(getValue(row, ['Accrual', 'accrual', 'Total', 'total']) || '0') || 0;
        const paid = parseFloat(getValue(row, ['Paid', 'paid', 'Amount Paid', 'amount_paid']) || '0') || 0;
        const balanceDue = parseFloat(
          getValue(row, ['Balance due', 'balance_due', 'Balance Due', 'balance']) || '0'
        ) || 0;

        // Calculate subtotal and tax (if not provided)
        const subtotal = accrual;
        const tax = 0; // Can be calculated if needed
        const total = accrual;
        const balance = balanceDue || (total - paid);

        // Get status
        const statusStr = getValue(row, [
          'Invoice status',
          'invoice_status',
          'Status',
          'status',
        ])?.toString().toUpperCase() || 'DRAFT';
        let status: InvoiceStatus = 'DRAFT';
        if (['SENT', 'INVOICED', 'POSTED'].includes(statusStr)) status = 'SENT';
        else if (statusStr === 'PAID') status = 'PAID';
        else if (statusStr === 'PARTIAL') status = 'PARTIAL';
        else if (statusStr === 'OVERDUE') status = 'OVERDUE';
        else if (statusStr === 'CANCELLED') status = 'CANCELLED';

        // Get reconciliation status
        const reconStatusStr = getValue(row, [
          'Reconciliation status',
          'reconciliation_status',
          'Reconciliation',
          'reconciliation',
        ])?.toString().toUpperCase() || 'NOT_RECONCILED';
        let reconciliationStatus: ReconciliationStatus = 'NOT_RECONCILED';
        if (reconStatusStr.includes('FULLY') || reconStatusStr === 'RECONCILED') {
          reconciliationStatus = 'FULLY_RECONCILED';
        } else if (reconStatusStr.includes('PARTIAL')) {
          reconciliationStatus = 'PARTIALLY_RECONCILED';
        }

        // Get other fields
        const mcNumber = getValue(row, ['MC number', 'mc_number', 'MC Number', 'mc'])?.toString() || null;
        const subStatus = getValue(row, ['Sub status', 'sub_status', 'Sub Status'])?.toString() || null;
        const invoiceNote = getValue(row, ['Invoice note', 'invoice_note', 'Invoice Note'])?.toString() || null;
        const paymentNote = getValue(row, ['Payment note', 'payment_note', 'Payment Note'])?.toString() || null;
        
        // Additional fields from spreadsheet (stored in notes if needed)
        const batchId = getValue(row, ['Batch ID', 'batch_id', 'Batch', 'batch'])?.toString() || null;
        const driverCarrier = getValue(row, ['Driver/Carrier', 'driver_carrier', 'Driver', 'Carrier'])?.toString() || null;
        const unitNumber = getValue(row, ['Unit number', 'unit_number', 'Unit Number', 'Unit'])?.toString() || null;
        const deliveryAppointment = getValue(row, ['Delivery appointment', 'delivery_appointment', 'Delivery Appointment'])?.toString() || null;
        const dispatcher = getValue(row, ['Dispatcher', 'dispatcher'])?.toString() || null;
        const invoiceNoteAuth = getValue(row, ['Invoice note auth', 'invoice_note_auth', 'Invoice Note Auth'])?.toString() || null;
        
        // Combine additional info into notes if needed
        const additionalNotes: string[] = [];
        if (batchId) additionalNotes.push(`Batch: ${batchId}`);
        if (driverCarrier) additionalNotes.push(`Driver/Carrier: ${driverCarrier}`);
        if (unitNumber) additionalNotes.push(`Unit: ${unitNumber}`);
        if (deliveryAppointment) additionalNotes.push(`Delivery: ${deliveryAppointment}`);
        if (dispatcher) additionalNotes.push(`Dispatcher: ${dispatcher}`);
        if (invoiceNoteAuth) additionalNotes.push(`Note Auth: ${invoiceNoteAuth}`);
        
        const combinedNotes = [
          invoiceNote,
          paymentNote,
          additionalNotes.length > 0 ? additionalNotes.join(' | ') : null,
        ].filter(Boolean).join(' | ') || null;

        const invoiceData = {
          customerId,
          invoiceNumber,
          loadIds: loadId ? [loadId] : [],
          subtotal,
          tax,
          total,
          amountPaid: paid,
          balance,
          status,
          invoiceDate,
          dueDate,
          paidDate: paymentDate,
          mcNumber,
          subStatus,
          reconciliationStatus,
          invoiceNote,
          paymentNote,
          loadId: loadId || null,
          notes: combinedNotes,
        };

        const existingInvoiceId = existingInvoiceMap.get(invoiceNumber);
        if (existingInvoiceId) {
          invoicesToUpdate.push({
            where: { id: existingInvoiceId },
            data: invoiceData,
          });
        } else {
          invoicesToCreate.push(invoiceData);
        }
      } catch (error: any) {
        results.errors.push({
          row: rowNumber,
          error: error.message || 'Failed to process row',
        });
      }
    }

    // Bulk create using createMany for better performance
    if (invoicesToCreate.length > 0) {
      // Split into smaller chunks for createMany (PostgreSQL limit)
      const chunkSize = 1000;
      for (let k = 0; k < invoicesToCreate.length; k += chunkSize) {
        const chunk = invoicesToCreate.slice(k, k + chunkSize);
        await prisma.invoice.createMany({
          data: chunk,
          skipDuplicates: true,
        });
      }
      results.created += invoicesToCreate.length;
    }

    // Bulk update - process in smaller batches to avoid overwhelming the database
    if (invoicesToUpdate.length > 0) {
      const updateChunkSize = 100;
      for (let k = 0; k < invoicesToUpdate.length; k += updateChunkSize) {
        const chunk = invoicesToUpdate.slice(k, k + updateChunkSize);
        await Promise.all(
          chunk.map((update) => prisma.invoice.update(update))
        );
      }
      results.updated += invoicesToUpdate.length;
    }

    return NextResponse.json({
      success: true,
      data: {
        total: rows.length,
        created: results.created,
        updated: results.updated,
        errors: results.errors,
        errorCount: results.errors.length,
      },
      message: `Imported ${results.created} new and updated ${results.updated} existing invoices`,
    });
  } catch (error: any) {
    console.error('Invoice import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to import invoices',
        },
      },
      { status: 500 }
    );
  }
}

