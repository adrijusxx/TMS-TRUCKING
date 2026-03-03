/**
 * Factoring Company API Integration
 * 
 * Handles integration with factoring companies (RTS, TAFS, etc.)
 * Supports both API integration and file export methods
 */

import { FactoringCompany, Invoice, Customer, Load, RateConfirmation } from '@prisma/client';
import { logger } from '@/lib/utils/logger';
import { InternalServerError } from '@/lib/errors';

type InvoiceWithRelations = Invoice & {
  customer?: Customer | null;
  load?: Load | null;
  rateConfirmation?: RateConfirmation | null;
};

interface ExportOptions {
  format: 'CSV' | 'EDI' | 'Excel' | 'JSON';
  invoices: InvoiceWithRelations[];
  factoringCompany: FactoringCompany;
}

interface FactoringSubmissionResult {
  success: boolean;
  submissionId?: string;
  error?: string;
  status?: string;
}

/**
 * Submit invoices to factoring company via API
 */
export async function submitInvoicesToFactor(
  factoringCompany: FactoringCompany,
  invoices: InvoiceWithRelations[]
): Promise<FactoringSubmissionResult> {
  try {
    logger.info('Submitting invoices to factoring company', {
      factoringCompany: factoringCompany.name,
      invoiceCount: invoices.length,
      apiProvider: factoringCompany.apiProvider,
    });

    // Direct API integration requires provider-specific client libraries (RTS, TAFS, etc.)
    // which are not yet integrated. Use file export (CSV/JSON) as the primary submission method.
    if (factoringCompany.apiProvider && factoringCompany.apiEndpoint && factoringCompany.apiKey) {
      logger.warn('Direct API submission not available — use file export instead', {
        provider: factoringCompany.apiProvider,
      });
    }

    // Generate CSV export as the default submission method
    const exportResult = generateCSVExport(invoices, factoringCompany);
    return {
      success: exportResult.success,
      submissionId: `export-${Date.now()}`,
      status: 'EXPORTED',
    };
  } catch (error) {
    logger.error('Error submitting invoices to factoring company', {
      error: error instanceof Error ? error.message : 'Unknown error',
      factoringCompany: factoringCompany.name,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate export file for factoring company
 */
export async function generateFactoringExport(
  options: ExportOptions
): Promise<{ success: boolean; filePath?: string; content?: string; error?: string }> {
  try {
    logger.info('Generating factoring export', {
      format: options.format,
      invoiceCount: options.invoices.length,
      factoringCompany: options.factoringCompany.name,
    });

    switch (options.format) {
      case 'CSV':
        return generateCSVExport(options.invoices, options.factoringCompany);
      case 'Excel':
        return generateExcelExport(options.invoices, options.factoringCompany);
      case 'EDI':
        return generateEDIExport(options.invoices, options.factoringCompany);
      case 'JSON':
        return generateJSONExport(options.invoices, options.factoringCompany);
      default:
        throw new InternalServerError(`Unsupported export format: ${options.format}`);
    }
  } catch (error) {
    logger.error('Error generating factoring export', {
      error: error instanceof Error ? error.message : 'Unknown error',
      format: options.format,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate CSV export
 */
function generateCSVExport(
  invoices: InvoiceWithRelations[],
  factoringCompany: FactoringCompany
): { success: boolean; filePath?: string; content?: string; error?: string } {
  try {
    // CSV Header
    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Due Date',
      'Customer Name',
      'Customer Number',
      'Amount',
      'Description',
      'Load Number',
      'Rate Confirmation Number',
    ];

    // CSV Rows
    const rows = invoices.map((invoice) => [
      invoice.invoiceNumber || '',
      invoice.invoiceDate?.toISOString().split('T')[0] || '',
      invoice.dueDate?.toISOString().split('T')[0] || '',
      invoice.customer?.name || '',
      invoice.customerId || '',
      (invoice.totalAmount || invoice.total || 0).toFixed(2),
      invoice.notes || '',
      invoice.load?.loadNumber || '',
      invoice.rateConfirmation?.rateConfNumber || '',
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `factoring-export-${factoringCompany.name}-${timestamp}.csv`;

    return {
      success: true,
      filePath: `/exports/${fileName}`,
      content: csvContent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate Excel export (placeholder - requires xlsx library)
 */
function generateExcelExport(
  invoices: InvoiceWithRelations[],
  factoringCompany: FactoringCompany
): { success: boolean; filePath?: string; content?: string; error?: string } {
  // Excel generation requires xlsx library — falls back to CSV
  logger.warn('Excel export falls back to CSV (xlsx library not installed)');
  return generateCSVExport(invoices, factoringCompany);
}

/**
 * Generate EDI export (placeholder - requires EDI library)
 */
function generateEDIExport(
  invoices: InvoiceWithRelations[],
  factoringCompany: FactoringCompany
): { success: boolean; filePath?: string; content?: string; error?: string } {
  // EDI format is provider-specific — requires factoring company spec sheet
  logger.warn('EDI export not available (provider spec not configured)');
  return {
    success: false,
    error: 'EDI export not yet implemented',
  };
}

/**
 * Generate JSON export
 */
function generateJSONExport(
  invoices: InvoiceWithRelations[],
  factoringCompany: FactoringCompany
): { success: boolean; filePath?: string; content?: string; error?: string } {
  try {
    const exportData = {
      factoringCompany: factoringCompany.name,
      exportDate: new Date().toISOString(),
      invoiceCount: invoices.length,
      invoices: invoices.map((invoice) => ({
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        totalAmount: invoice.totalAmount || invoice.total,
        customerId: invoice.customerId,
        loadId: invoice.loadId,
        notes: invoice.notes,
      })),
    };

    const content = JSON.stringify(exportData, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `factoring-export-${factoringCompany.name}-${timestamp}.json`;

    return {
      success: true,
      filePath: `/exports/${fileName}`,
      content,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check factoring status for invoices
 */
async function checkFactoringStatus(
  factoringCompany: FactoringCompany,
  invoiceIds: string[]
): Promise<{
  success: boolean;
  statuses?: Array<{ invoiceId: string; status: string; fundedAt?: Date; amount?: number }>;
  error?: string;
}> {
  try {
    // Status checking requires direct API integration with factoring provider
    logger.info('Checking factoring status (file-based — manual verification needed)', {
      factoringCompany: factoringCompany.name,
      invoiceCount: invoiceIds.length,
    });
    return {
      success: true,
      statuses: invoiceIds.map((id) => ({
        invoiceId: id,
        status: 'SUBMITTED',
      })),
    };
  } catch (error) {
    logger.error('Error checking factoring status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      factoringCompany: factoringCompany.name,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get factoring API client based on provider
 */
/**
 * Factoring provider API clients are not yet integrated.
 * Currently supports file-based export (CSV, JSON) for all providers.
 * Direct API integration (RTS, TAFS) requires provider SDK installation.
 */
function getFactoringApiClient(_factoringCompany: FactoringCompany) {
  return null;
}

