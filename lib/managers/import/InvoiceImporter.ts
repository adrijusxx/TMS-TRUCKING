
import { PrismaClient, Invoice, InvoiceStatus } from '@prisma/client';
import { BaseImporter, ImportResult } from './BaseImporter';
import { parseImportDate, parseImportNumber } from '@/lib/import-export/import-utils';

export class InvoiceImporter extends BaseImporter {
    constructor(prisma: PrismaClient, companyId: string, userId: string) {
        super(prisma, companyId, userId);
    }

    async import(data: any[], options: {
        previewOnly?: boolean;
        currentMcNumber?: string;
        updateExisting?: boolean;
        columnMapping?: Record<string, string>;
        importBatchId?: string;
    }): Promise<ImportResult> {
        const { previewOnly, updateExisting, currentMcNumber, columnMapping = {}, importBatchId } = options;
        const records = data;
        const mapping = columnMapping;
        const created: Invoice[] = [];
        const errors: Array<{ row: number; field?: string; error: string }> = [];
        const warnings: Array<{ row: number; field?: string; error: string }> = [];

        // 0. Pre-fetch Customers for lookup
        const customers = await this.prisma.customer.findMany({
            where: { companyId: this.companyId, deletedAt: null },
            select: { id: true, name: true, customerNumber: true }
        });

        // Create normalized maps for customer lookup
        const customerMap = new Map<string, string>(); // name/number -> id
        for (const c of customers) {
            customerMap.set(c.name.toLowerCase(), c.id);
            if (c.customerNumber) customerMap.set(c.customerNumber.toLowerCase(), c.id);
        }

        // 1. Process Records
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 1;

            try {
                // --- Resolve Customer ---
                const customerVal = this.getValue(row, 'customer', mapping, ['Customer', 'Bill To', 'Customer Name']);
                let customerId: string | null = null;

                if (customerVal) {
                    const custStr = String(customerVal).toLowerCase().trim();
                    if (customerMap.has(custStr)) {
                        customerId = customerMap.get(custStr)!;
                    }
                }

                if (!customerId) {
                    customerId = Array.from(customerMap.values())[0] || null;
                    if (customerId) {
                        warnings.push(this.warning(rowNum, `Customer not found, defaulted to first available customer`, 'customer'));
                    } else {
                        // Truly desperate: No customers exist at all
                        errors.push(this.error(rowNum, `Customer not found and no customers exist in system`, 'customer'));
                        continue;
                    }
                }

                // --- Basic Fields ---
                const invoiceNumber = this.getValue(row, 'invoiceNumber', mapping, ['Invoice #', 'Invoice ID', 'Number', 'ID'])
                    || this.getPlaceholder('INV', rowNum);

                const invoiceDateVal = this.getValue(row, 'invoiceDate', mapping, ['Date', 'Invoice Date', 'Bill Date']);
                const invoiceDate = parseImportDate(invoiceDateVal) || new Date();

                const dueDateVal = this.getValue(row, 'dueDate', mapping, ['Due Date', 'Due']);
                const dueDate = parseImportDate(dueDateVal) || new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default Net 30

                // --- Financials ---
                const totalAmount = parseImportNumber(this.getValue(row, 'totalAmount', mapping, ['Amount', 'Total', 'Total Amount'])) || 0;
                const paidAmount = parseImportNumber(this.getValue(row, 'paidAmount', mapping, ['Paid', 'Paid Amount'])) || 0;
                const balance = totalAmount - paidAmount;

                // --- Status ---
                let status: InvoiceStatus = InvoiceStatus.DRAFT;
                const statusVal = this.getValue(row, 'status', mapping, ['Status']);

                if (statusVal) {
                    const s = String(statusVal).toUpperCase();
                    if (s.includes('PAID')) status = InvoiceStatus.PAID;
                    else if (s.includes('SENT')) status = InvoiceStatus.SENT;
                    else if (s.includes('DRAFT')) status = InvoiceStatus.DRAFT;
                    else if (s.includes('OVERDUE')) status = InvoiceStatus.OVERDUE;
                } else if (balance <= 0 && totalAmount > 0) {
                    status = InvoiceStatus.PAID;
                }

                // Check for duplicate
                const existing = await this.prisma.invoice.findUnique({
                    where: {
                        companyId_invoiceNumber: {
                            companyId: this.companyId,
                            invoiceNumber
                        }
                    }
                });

                if (existing && !updateExisting) {
                    warnings.push(this.warning(rowNum, `Invoice # ${invoiceNumber} already exists, skipping row.`, 'Database Duplicate'));
                    continue;
                }

                // --- Create Invoice ---
                const invoice = await this.prisma.invoice.create({
                    data: {
                        companyId: this.companyId,
                        invoiceNumber,
                        customerId,
                        invoiceDate,
                        dueDate,
                        totalAmount: totalAmount, // Alias
                        total: totalAmount,       // Required field
                        subtotal: totalAmount,    // Required field (assume calculated or tax-inclusive)
                        balance,
                        status,
                        notes: `Imported via CSV on ${new Date().toLocaleDateString()}`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        mcNumberId: await this.resolveMcNumberId(this.getValue(row, 'mcNumberId', mapping, ['MC', 'MC Number']))
                    }
                });

                created.push(invoice);

            } catch (err: any) {
                errors.push(this.error(rowNum, `Unexpected error: ${err.message}`));
            }
        }

        return this.success({
            total: records.length,
            created: created.length,
            updated: 0,
            skipped: records.length - created.length - errors.length,
            errors: errors.length
        }, created, errors, warnings);
    }
}
