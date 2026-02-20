/**
 * Invoice Document Builder
 *
 * Validates required documents for an invoice and builds a merged PDF package
 * combining Invoice + Rate Confirmation + POD + BOL into a single file.
 */

import React from 'react';
import path from 'path';
import fs from 'fs/promises';
import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '@/lib/prisma';
import { InvoicePDF } from '@/lib/pdf/templates/InvoicePDF';
import { RateConPDF } from '@/lib/pdf/templates/RateConPDF';
import { InvoiceManager } from '@/lib/managers/InvoiceManager';
import { PdfMergeService, DocumentInput } from '@/lib/services/PdfMergeService';

export interface DocumentValidationResult {
  ready: boolean;
  missing: string[];
}

export interface DocumentPackageResult {
  buffer: Uint8Array;
  filename: string;
}

export class InvoiceDocumentBuilder {
  /**
   * Check that all required documents exist for an invoice's loads.
   */
  static async validateDocuments(
    invoiceId: string,
    loadIds: string[]
  ): Promise<DocumentValidationResult> {
    const missing: string[] = [];

    for (const loadId of loadIds) {
      const load = await prisma.load.findUnique({
        where: { id: loadId },
        select: { loadNumber: true },
      });
      const label = load?.loadNumber || loadId;

      // Check Rate Confirmation
      const rateCon = await prisma.rateConfirmation.findUnique({
        where: { loadId },
      });
      if (!rateCon) {
        missing.push(`Rate Confirmation for Load #${label}`);
      }

      // Check POD document
      const pod = await prisma.document.findFirst({
        where: { loadId, type: 'POD', deletedAt: null },
      });
      if (!pod) {
        missing.push(`POD for Load #${label}`);
      }

      // Check BOL document
      const bol = await prisma.document.findFirst({
        where: { loadId, type: 'BOL', deletedAt: null },
      });
      if (!bol) {
        missing.push(`BOL for Load #${label}`);
      }
    }

    return { ready: missing.length === 0, missing };
  }

  /**
   * Build the merged PDF package for an invoice.
   * Order: Invoice PDF → Rate Con(s) → POD(s) → BOL(s)
   */
  static async buildPackage(
    invoiceId: string,
    companyId: string
  ): Promise<DocumentPackageResult> {
    const documents: DocumentInput[] = [];

    // 1. Generate Invoice PDF
    const invoicePdf = await this.generateInvoicePdf(invoiceId, companyId);
    documents.push({ buffer: invoicePdf.buffer, mimeType: 'application/pdf', label: 'Invoice' });

    // 2. Fetch invoice to get load IDs
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { loadIds: true, invoiceNumber: true },
    });
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    // 3. For each load, collect Rate Con, POD, BOL
    for (const loadId of invoice.loadIds) {
      const rateConPdf = await this.generateRateConPdf(loadId, companyId);
      if (rateConPdf) {
        documents.push({ buffer: rateConPdf, mimeType: 'application/pdf', label: `Rate Con - ${loadId}` });
      }

      const podDoc = await this.fetchUploadedDocument(loadId, 'POD');
      if (podDoc) {
        documents.push(podDoc);
      }

      const bolDoc = await this.fetchUploadedDocument(loadId, 'BOL');
      if (bolDoc) {
        documents.push(bolDoc);
      }
    }

    // 4. Merge all into single PDF
    const merged = await PdfMergeService.merge(documents);

    return {
      buffer: merged,
      filename: `invoice-package-${invoice.invoiceNumber}.pdf`,
    };
  }

  /**
   * Generate Invoice PDF buffer using the shared template and factoring logic.
   */
  private static async generateInvoicePdf(
    invoiceId: string,
    companyId: string
  ): Promise<{ buffer: Uint8Array }> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: {
          select: {
            id: true, name: true, customerNumber: true,
            address: true, city: true, state: true, zip: true,
            email: true, phone: true,
          },
        },
      },
    });
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    const company = await prisma.company.findUnique({ where: { id: companyId } });

    const loads = invoice.loadIds.length > 0
      ? await prisma.load.findMany({
          where: { id: { in: invoice.loadIds }, companyId },
          select: {
            id: true, loadNumber: true, revenue: true,
            pickupCity: true, pickupState: true,
            deliveryCity: true, deliveryState: true,
            pickupDate: true, deliveryDate: true,
            mcNumberId: true,
          },
        })
      : [];

    // Apply MC branding overrides
    const brandingCompany = await this.applyMcBranding(company, loads);

    // Finalize with factoring info
    const invoiceManager = new InvoiceManager();
    const finalization = await invoiceManager.finalizeInvoice(invoiceId);

    const pdfElement = React.createElement(InvoicePDF, {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        balance: invoice.balance,
        notes: invoice.notes || undefined,
      },
      customer: invoice.customer,
      company: brandingCompany,
      loads: loads as any,
      remitToAddress: finalization.success ? finalization.remitToAddress : null,
      noticeOfAssignment: finalization.success ? finalization.noticeOfAssignment : null,
    });

    const buffer = await renderToBuffer(pdfElement as any);
    return { buffer: new Uint8Array(buffer) };
  }

  /**
   * Generate Rate Confirmation PDF buffer for a load.
   */
  private static async generateRateConPdf(
    loadId: string,
    companyId: string
  ): Promise<Uint8Array | null> {
    const rateCon = await prisma.rateConfirmation.findUnique({ where: { loadId } });
    if (!rateCon) return null;

    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        driver: { include: { user: { select: { firstName: true, lastName: true } } } },
        truck: { select: { truckNumber: true } },
        customer: { select: { name: true, customerNumber: true, phone: true, email: true } },
        stops: { orderBy: { sequence: 'asc' } },
      },
    });
    if (!load) return null;

    const company = await prisma.company.findUnique({ where: { id: companyId } });

    const rateConProps: any = {
      load: {
        loadNumber: load.loadNumber,
        pickupDate: load.pickupDate,
        deliveryDate: load.deliveryDate,
        pickupAddress: load.pickupAddress || undefined,
        pickupCity: load.pickupCity,
        pickupState: load.pickupState,
        pickupZip: load.pickupZip || undefined,
        deliveryAddress: load.deliveryAddress || undefined,
        deliveryCity: load.deliveryCity,
        deliveryState: load.deliveryState,
        deliveryZip: load.deliveryZip || undefined,
        commodity: load.commodity || undefined,
        weight: load.weight || undefined,
        totalMiles: load.totalMiles || undefined,
        revenue: load.revenue,
        equipmentType: load.equipmentType || undefined,
      },
      stops: load.stops?.map((s: any) => ({
        sequence: s.sequence,
        type: s.type,
        address: s.address || undefined,
        city: s.city,
        state: s.state,
        zip: s.zip || undefined,
        scheduledDate: s.scheduledDate || undefined,
      })),
      company: company ? {
        name: company.name, address: company.address || undefined,
        city: company.city || undefined, state: company.state || undefined,
        zip: company.zip || undefined, phone: company.phone || undefined,
        email: company.email || undefined, mcNumber: company.mcNumber || undefined,
        dotNumber: company.dotNumber || undefined,
      } : null,
      customer: load.customer ? {
        name: load.customer.name,
        customerNumber: load.customer.customerNumber || undefined,
        phone: load.customer.phone || undefined,
        email: load.customer.email || undefined,
      } : null,
      driver: load.driver ? {
        name: load.driver.user ? `${load.driver.user.firstName} ${load.driver.user.lastName}` : 'N/A',
      } : null,
      truck: load.truck ? { truckNumber: load.truck.truckNumber } : null,
    };
    const pdfElement = React.createElement(RateConPDF, rateConProps);

    const buffer = await renderToBuffer(pdfElement as any);
    return new Uint8Array(buffer);
  }

  /**
   * Fetch an uploaded document file (POD or BOL) from local storage.
   */
  private static async fetchUploadedDocument(
    loadId: string,
    type: 'POD' | 'BOL'
  ): Promise<DocumentInput | null> {
    const doc = await prisma.document.findFirst({
      where: { loadId, type, deletedAt: null },
      select: { fileUrl: true, fileName: true, mimeType: true },
    });
    if (!doc) return null;

    try {
      // fileUrl is relative like "/uploads/documents/xyz.pdf"
      const filePath = path.join(process.cwd(), 'public', doc.fileUrl);
      const fileBuffer = await fs.readFile(filePath);

      return {
        buffer: new Uint8Array(fileBuffer),
        mimeType: doc.mimeType,
        label: `${type} - ${doc.fileName}`,
      };
    } catch (error) {
      console.error(`[InvoiceDocumentBuilder] Failed to read ${type} file for load ${loadId}:`, error);
      return null;
    }
  }

  /**
   * Apply MC number branding overrides to company info.
   */
  private static async applyMcBranding(company: any, loads: any[]): Promise<any> {
    const brandingCompany = { ...company };
    const mcNumberId = loads.length > 0 ? loads[0].mcNumberId : null;

    if (mcNumberId) {
      const mcNumber = await prisma.mcNumber.findUnique({ where: { id: mcNumberId } });
      if (mcNumber) {
        const branding = mcNumber.branding
          ? (typeof mcNumber.branding === 'string' ? JSON.parse(mcNumber.branding) : mcNumber.branding)
          : {};
        if (mcNumber.address) brandingCompany.address = mcNumber.address;
        if (mcNumber.city) brandingCompany.city = mcNumber.city;
        if (mcNumber.state) brandingCompany.state = mcNumber.state;
        if (mcNumber.zip) brandingCompany.zip = mcNumber.zip;
        if (mcNumber.email) brandingCompany.email = mcNumber.email;
        if (mcNumber.companyName) brandingCompany.name = mcNumber.companyName;
        if (branding.hideCompanyName) brandingCompany.hideName = true;
      }
    }

    return brandingCompany;
  }
}
