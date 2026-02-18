/**
 * AI Document Processor Service
 * Processes various document types: invoices, receipts, safety documents, etc.
 */

import { AIService } from './AIService';

interface DocumentProcessingInput {
  documentType: 'INVOICE' | 'RECEIPT' | 'SAFETY_DOCUMENT' | 'INSURANCE' | 'MAINTENANCE_RECORD' | 'POD' | 'BOL' | 'OTHER';
  text: string;
  fileName?: string;
}

interface PODExtractionResult {
  loadNumber?: string;
  deliveryDate?: string;
  recipientName?: string;
  isSigned?: boolean;
}

interface BOLExtractionResult {
  loadNumber?: string;
  pickupDate?: string;
  shipperName?: string;
  weight?: number;
  pieces?: number;
}

interface InvoiceExtractionResult {
  invoiceNumber?: string;
  vendor?: string;
  date?: string;
  dueDate?: string;
  lineItems?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  }>;
  subtotal?: number;
  tax?: number;
  total?: number;
  paymentTerms?: string;
  poNumber?: string;
}

interface ReceiptExtractionResult {
  vendor?: string;
  date?: string;
  items?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  }>;
  subtotal?: number;
  tax?: number;
  total?: number;
  paymentMethod?: string;
  receiptNumber?: string;
}

interface SafetyDocumentExtractionResult {
  documentType?: string; // CDL, MEDICAL_CARD, MVR, etc.
  driverName?: string;
  licenseNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  state?: string;
  restrictions?: string[];
  endorsements?: string[];
  violations?: Array<{
    date?: string;
    description?: string;
    points?: number;
  }>;
}

interface InsuranceDocumentExtractionResult {
  policyNumber?: string;
  insuranceCompany?: string;
  policyType?: string;
  effectiveDate?: string;
  expiryDate?: string;
  coverageAmount?: number;
  deductible?: number;
  vehicleInfo?: {
    vin?: string;
    make?: string;
    model?: string;
    year?: number;
  };
}

interface MaintenanceRecordExtractionResult {
  vendor?: string;
  date?: string;
  type?: string; // OIL_CHANGE, REPAIR, INSPECTION, etc.
  description?: string;
  cost?: number;
  mileage?: number;
  parts?: Array<{
    name: string;
    partNumber?: string;
    quantity?: number;
    cost?: number;
  }>;
  labor?: number;
  invoiceNumber?: string;
}

type DocumentExtractionResult =
  | BOLExtractionResult
  | PODExtractionResult
  | ReceiptExtractionResult
  | SafetyDocumentExtractionResult
  | InsuranceDocumentExtractionResult
  | MaintenanceRecordExtractionResult;

export class AIDocumentProcessor extends AIService {
  /**
   * Process a document file (PDF/image) with OCR and extract structured data.
   * Handles scanned documents automatically via GPT-4o vision fallback.
   */
  async processDocumentFromFile(
    buffer: Buffer,
    mimeType: string,
    documentType: DocumentProcessingInput['documentType'],
    fileName?: string
  ): Promise<DocumentExtractionResult> {
    const text = await this.extractTextWithOCR(buffer, mimeType);
    return this.processDocument({ documentType, text, fileName });
  }

  /**
   * Process a document and extract structured data
   */
  async processDocument(input: DocumentProcessingInput): Promise<DocumentExtractionResult> {
    const { documentType, text, fileName } = input;

    let prompt = '';
    let systemPrompt = '';

    switch (documentType) {
      case 'INVOICE':
        prompt = this.buildInvoicePrompt(text, fileName);
        systemPrompt = 'You are an expert at extracting data from invoices. Return ONLY valid JSON with invoice details.';
        break;
      case 'RECEIPT':
        prompt = this.buildReceiptPrompt(text, fileName);
        systemPrompt = 'You are an expert at extracting data from receipts. Return ONLY valid JSON with receipt details.';
        break;
      case 'SAFETY_DOCUMENT':
        prompt = this.buildSafetyDocumentPrompt(text, fileName);
        systemPrompt = 'You are an expert at extracting data from safety documents (CDL, medical cards, MVR, etc.). Return ONLY valid JSON with document details.';
        break;
      case 'INSURANCE':
        prompt = this.buildInsurancePrompt(text, fileName);
        systemPrompt = 'You are an expert at extracting data from insurance documents. Return ONLY valid JSON with insurance policy details.';
        break;
      case 'MAINTENANCE_RECORD':
        prompt = this.buildMaintenanceRecordPrompt(text, fileName);
        systemPrompt = 'You are an expert at extracting data from maintenance records and repair invoices. Return ONLY valid JSON with maintenance details.';
        break;
      case 'POD':
        prompt = this.buildPODPrompt(text, fileName);
        systemPrompt = 'You are an expert at extracting data from Proof of Delivery (POD) documents. Return ONLY valid JSON with POD details.';
        break;
      case 'BOL':
        prompt = this.buildBOLPrompt(text, fileName);
        systemPrompt = 'You are an expert at extracting data from Bill of Lading (BOL) documents. Return ONLY valid JSON with BOL details.';
        break;
      default:
        prompt = this.buildGenericPrompt(text, fileName);
        systemPrompt = 'Extract structured data from this document. Return ONLY valid JSON.';
    }

    const result = await this.callAI<DocumentExtractionResult>(
      prompt,
      {
        temperature: 0.1,
        maxTokens: 4000,
        systemPrompt,
      }
    );

    return result.data;
  }

  private buildInvoicePrompt(text: string, fileName?: string): string {
    return `Extract invoice data from this document. Return JSON with:

- invoiceNumber: string (invoice/account number)
- vendor: string (vendor/company name)
- date: string (invoice date, ISO format YYYY-MM-DD)
- dueDate: string (due date, ISO format)
- lineItems: array of {description, quantity, unitPrice, total}
- subtotal: number
- tax: number
- total: number
- paymentTerms: string (e.g., "Net 30", "Due on receipt")
- poNumber: string (purchase order number if present)

Document text:
${this.truncateText(text, 8000)}
${fileName ? `\nFile name: ${fileName}` : ''}

Return ONLY JSON:`;
  }

  private buildReceiptPrompt(text: string, fileName?: string): string {
    return `Extract receipt data from this document. Return JSON with:

- vendor: string (store/merchant name)
- date: string (receipt date, ISO format YYYY-MM-DD)
- items: array of {description, quantity, unitPrice, total}
- subtotal: number
- tax: number
- total: number
- paymentMethod: string (Cash, Credit Card, Debit, etc.)
- receiptNumber: string (receipt/transaction number)

Document text:
${this.truncateText(text, 6000)}
${fileName ? `\nFile name: ${fileName}` : ''}

Return ONLY JSON:`;
  }

  private buildSafetyDocumentPrompt(text: string, fileName?: string): string {
    return `Extract safety document data. This could be a CDL, medical card, MVR, or other safety document. Return JSON with:

- documentType: string (CDL, MEDICAL_CARD, MVR, DRUG_TEST, etc.)
- driverName: string (full name)
- licenseNumber: string (if applicable)
- issueDate: string (ISO format)
- expiryDate: string (ISO format)
- state: string (2-letter state code)
- restrictions: array of strings (license restrictions)
- endorsements: array of strings (license endorsements like H, N, T, etc.)
- violations: array of {date, description, points} (for MVR)

Document text:
${this.truncateText(text, 6000)}
${fileName ? `\nFile name: ${fileName}` : ''}

Return ONLY JSON:`;
  }

  private buildInsurancePrompt(text: string, fileName?: string): string {
    return `Extract insurance policy data. Return JSON with:

- policyNumber: string
- insuranceCompany: string (insurance company name)
- policyType: string (Liability, Cargo, Physical Damage, etc.)
- effectiveDate: string (ISO format)
- expiryDate: string (ISO format)
- coverageAmount: number (coverage limit)
- deductible: number
- vehicleInfo: {vin, make, model, year} (if applicable)

Document text:
${this.truncateText(text, 6000)}
${fileName ? `\nFile name: ${fileName}` : ''}

Return ONLY JSON:`;
  }

  private buildMaintenanceRecordPrompt(text: string, fileName?: string): string {
    return `Extract maintenance/repair record data. Return JSON with:

- vendor: string (repair shop/vendor name)
- date: string (service date, ISO format)
- type: string (OIL_CHANGE, REPAIR, INSPECTION, TIRE_ROTATION, BRAKE_SERVICE, etc.)
- description: string (work performed description)
- cost: number (total cost)
- mileage: number (odometer reading)
- parts: array of {name, partNumber, quantity, cost}
- labor: number (labor cost)
- invoiceNumber: string

Document text:
${this.truncateText(text, 6000)}
${fileName ? `\nFile name: ${fileName}` : ''}

Return ONLY JSON:`;
  }
  private buildPODPrompt(text: string, fileName?: string): string {
    return `Extract Proof of Delivery (POD) data. Return JSON with:
- loadNumber: string (The load ID or reference number)
- deliveryDate: string (ISO format)
- recipientName: string (Who signed for the delivery)
- isSigned: boolean (Check if a signature area contains marks)

Text:
${this.truncateText(text, 6000)}`;
  }

  private buildBOLPrompt(text: string, fileName?: string): string {
    return `Extract Bill of Lading (BOL) data. Return JSON with:
- loadNumber: string
- pickupDate: string (ISO format)
- shipperName: string
- weight: number
- pieces: number

Text:
${this.truncateText(text, 6000)}`;
  }

  private buildGenericPrompt(text: string, fileName?: string): string {
    return `Extract structured data from this document. Identify the document type and extract relevant fields.

Document text:
${this.truncateText(text, 6000)}
${fileName ? `\nFile name: ${fileName}` : ''}

Return JSON with extracted fields. Include a "documentType" field identifying what type of document this is.`;
  }

  /**
   * Auto-categorize and file document with entity linking
   */
  async categorizeAndFileDocument(
    documentText: string,
    companyId: string,
    documentType?: string
  ): Promise<{
    category: string;
    suggestedEntityType: string;
    suggestedEntityId?: string;
    confidence: number;
    extractedFinancialData?: {
      amount?: number;
      date?: string;
      vendor?: string;
    };
  }> {
    const { prisma } = await import('@/lib/prisma');

    // Fetch recent entities for context
    const [recentLoads, recentInvoices, recentDrivers, recentTrucks] = await Promise.all([
      prisma.load.findMany({
        where: { companyId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, loadNumber: true, customer: { select: { name: true } } },
      }),
      prisma.invoice.findMany({
        where: { customer: { companyId } },
        orderBy: { invoiceDate: 'desc' },
        take: 10,
        select: { id: true, invoiceNumber: true, customer: { select: { name: true } } },
      }),
      prisma.driver.findMany({
        where: { companyId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, driverNumber: true, user: { select: { firstName: true, lastName: true } } },
      }),
      prisma.truck.findMany({
        where: { companyId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, truckNumber: true },
      }),
    ]);

    const prompt = `Categorize and link this document to relevant entities.

DOCUMENT TEXT:
${this.truncateText(documentText, 3000)}

DOCUMENT TYPE: ${documentType || 'Unknown'}

AVAILABLE ENTITIES:
Recent Loads: ${JSON.stringify(recentLoads, null, 2)}
Recent Invoices: ${JSON.stringify(recentInvoices, null, 2)}
Recent Drivers: ${JSON.stringify(recentDrivers, null, 2)}
Recent Trucks: ${JSON.stringify(recentTrucks, null, 2)}

Return JSON with:
- category: string (e.g., 'INVOICE', 'RECEIPT', 'SAFETY_DOCUMENT', 'MAINTENANCE_RECORD', 'POD', 'BOL', 'OTHER')
- suggestedEntityType: string (e.g., 'LOAD', 'INVOICE', 'DRIVER', 'TRUCK', 'NONE')
- suggestedEntityId: string (optional, ID from available entities if match found)
- confidence: number (0-100)
- extractedFinancialData?: {
    amount?: number,
    date?: string,
    vendor?: string,
    loadNumber?: string
  }`;

    const result = await this.callAI<{
      category: string;
      suggestedEntityType: string;
      suggestedEntityId?: string;
      confidence: number;
      extractedFinancialData?: {
        amount?: number;
        date?: string;
        vendor?: string;
      };
    }>(
      prompt,
      {
        temperature: 0.2,
        maxTokens: 2000,
        systemPrompt: 'You are an expert in document categorization and entity linking. Return ONLY valid JSON.',
      }
    );

    return result.data;
  }
}

