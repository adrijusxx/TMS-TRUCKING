import { InvoiceStatus } from '@prisma/client';
import { BaseImporter } from './BaseImporter';
import type { ImportContext, RowProcessResult } from './types/importer-types';
import { SmartEnumMapper } from './utils/SmartEnumMapper';
import { INVOICE_STATUS_MAP } from './utils/enum-maps';
import { parseImportDate, parseImportNumber } from '@/lib/import-export/import-utils';

export class InvoiceImporter extends BaseImporter {

    protected getPrismaDelegate() { return this.prisma.invoice; }
    protected useCreateMany() { return false; }

    protected async preFetchLookups(_ctx: ImportContext) {
        const customers = await this.prisma.customer.findMany({
            where: { companyId: this.companyId, deletedAt: null },
            select: { id: true, name: true, customerNumber: true }
        });

        const customerMap = new Map<string, string>();
        for (const c of customers) {
            customerMap.set(c.name.toLowerCase(), c.id);
            if (c.customerNumber) customerMap.set(c.customerNumber.toLowerCase(), c.id);
        }

        return { customerMap };
    }

    protected async processRow(row: any, rowNum: number, ctx: ImportContext): Promise<RowProcessResult> {
        const { columnMapping, updateExisting, formatSettings } = ctx.options;
        const dateHint = formatSettings?.dateFormat as Parameters<typeof parseImportDate>[1];
        const { customerMap } = ctx.lookups;
        const mapping = columnMapping || {};
        const warnings: RowProcessResult['warnings'] = [];

        // Resolve customer
        const customerVal = this.getValue(row, 'customer', mapping, ['Customer', 'Bill To', 'Customer Name']);
        let customerId: string | null = null;
        if (customerVal) {
            customerId = customerMap.get(String(customerVal).toLowerCase().trim()) || null;
        }
        if (!customerId) {
            customerId = (Array.from(customerMap.values())[0] as string) || null;
            if (customerId) {
                warnings.push(this.warning(rowNum, 'Customer not found, defaulted to first available customer', 'customer'));
            } else {
                return { action: 'skip', error: this.error(rowNum, 'Customer not found and no customers exist in system', 'customer') };
            }
        }

        // Basic fields
        const invoiceNumber = this.getValue(row, 'invoiceNumber', mapping, ['Invoice #', 'Invoice ID', 'Number', 'ID'])
            || this.getPlaceholder('INV', rowNum);
        const invoiceDateVal = this.getValue(row, 'invoiceDate', mapping, ['Date', 'Invoice Date', 'Bill Date']);
        const invoiceDate = parseImportDate(invoiceDateVal, dateHint) || new Date();
        const dueDateVal = this.getValue(row, 'dueDate', mapping, ['Due Date', 'Due']);
        const dueDate = parseImportDate(dueDateVal, dateHint) || new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Financials
        const totalAmount = parseImportNumber(this.getValue(row, 'totalAmount', mapping, ['Amount', 'Total', 'Total Amount'])) || 0;
        const paidAmount = parseImportNumber(this.getValue(row, 'paidAmount', mapping, ['Paid', 'Paid Amount'])) || 0;
        const balance = totalAmount - paidAmount;

        // Status
        const statusVal = this.getValue(row, 'status', mapping, ['Status']);
        let status: InvoiceStatus;
        if (statusVal) {
            status = SmartEnumMapper.map(statusVal, INVOICE_STATUS_MAP);
        } else if (balance <= 0 && totalAmount > 0) {
            status = InvoiceStatus.PAID;
        } else {
            status = InvoiceStatus.DRAFT;
        }

        // Per-row DB dedup (invoices use unique constraint companyId_invoiceNumber)
        const existing = await this.prisma.invoice.findUnique({
            where: { companyId_invoiceNumber: { companyId: this.companyId, invoiceNumber } }
        });

        if (existing && !updateExisting) {
            return { action: 'skip', error: this.warning(rowNum, `Invoice # ${invoiceNumber} already exists, skipping row.`, 'Database Duplicate'), warnings };
        }

        const mcNumberId = await this.resolveMcNumberId(this.getValue(row, 'mcNumberId', mapping, ['MC', 'MC Number']));

        const invoiceFields = {
            customerId,
            invoiceDate,
            dueDate,
            totalAmount,
            total: totalAmount,
            subtotal: totalAmount,
            balance,
            status,
            notes: `Imported via CSV on ${new Date().toLocaleDateString()}`,
            updatedAt: new Date(),
            mcNumberId,
        };

        if (existing && updateExisting) {
            return {
                action: 'update',
                data: { _existingId: existing.id, ...invoiceFields },
                warnings,
            };
        }

        return {
            action: 'create',
            data: { companyId: this.companyId, invoiceNumber, ...invoiceFields, createdAt: new Date() },
            warnings,
        };
    }

    /**
     * Custom persist: invoices use inline create/update (preserves current behavior).
     */
    protected async persist(toCreate: any[], toUpdate: any[], ctx: ImportContext) {
        let createdCount = 0;
        let updatedCount = 0;

        for (const item of toCreate) {
            try {
                await this.prisma.invoice.create({ data: item });
                createdCount++;
            } catch (e: any) {
                ctx.errors.push(this.error(0, `Create failed: ${e.message}`));
            }
        }

        for (const item of toUpdate) {
            const { _existingId, ...data } = item;
            try {
                await this.prisma.invoice.update({ where: { id: _existingId }, data });
                updatedCount++;
            } catch (e: any) {
                ctx.errors.push(this.error(0, `Update failed: ${e.message}`));
            }
        }

        return { createdCount, updatedCount };
    }
}
