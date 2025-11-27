/**
 * InvoiceManager
 * 
 * Handles invoice finalization with factoring logic and validation gates
 */
import { prisma } from '@/lib/prisma';

export interface InvoiceFinalizationResult {
  success: boolean;
  remitToAddress?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
    email?: string;
  };
  noticeOfAssignment?: string;
  error?: string;
}

export interface ReadyToBillResult {
  ready: boolean;
  reasons?: string[];
  missingPOD?: boolean;
  rateMismatch?: boolean;
  missingBOLWeight?: boolean;
}

export class InvoiceManager {
  /**
   * Finalize invoice with factoring logic
   * 
   * If Customer.IsFactored (factoringCompanyId is not null):
   * - Swap "Remit To" to Factoring Company Address
   * - Append "Notice of Assignment" text to PDF
   * 
   * If False:
   * - Use Standard Company Address
   */
  async finalizeInvoice(invoiceId: string): Promise<InvoiceFinalizationResult> {
    try {
      // Fetch invoice with customer and factoring company
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          customer: {
            include: {
              factoringCompany: {
                select: {
                  id: true,
                  name: true,
                  contactName: true,
                  contactEmail: true,
                  contactPhone: true,
                },
              },
            },
          },
        },
      });

      if (!invoice) {
        return {
          success: false,
          error: 'Invoice not found',
        };
      }

      // Check if customer is factored (has factoringCompanyId)
      const isFactored = invoice.customer.factoringCompanyId !== null;

      if (isFactored && invoice.customer.factoringCompany) {
        // FACTORED: Use Factoring Company Address
        const factoringCompany = invoice.customer.factoringCompany;
        
        // Fetch factoring company full details (address, etc.)
        // Note: FactoringCompany model may not have address fields
        // If not, we'll use contact info or company address as fallback
        const factoringCompanyFull = await prisma.factoringCompany.findUnique({
          where: { id: factoringCompany.id },
        });

        // Get company address for factoring company (if stored)
        // For now, use company's address or contact info
        const remitToAddress = {
          name: factoringCompany.name,
          address: factoringCompanyFull?.contactName 
            ? `${factoringCompanyFull.contactName}\n${factoringCompany.name}`
            : factoringCompany.name,
          city: '', // FactoringCompany may not have address fields
          state: '',
          zip: '',
          phone: factoringCompany.contactPhone || undefined,
          email: factoringCompany.contactEmail || undefined,
        };

        // Notice of Assignment text (standard factoring notice)
        const noticeOfAssignment = `NOTICE OF ASSIGNMENT

This invoice has been assigned to ${factoringCompany.name} for collection purposes.

All payments should be remitted directly to:
${factoringCompany.name}
${remitToAddress.address}
${remitToAddress.city ? `${remitToAddress.city}, ${remitToAddress.state} ${remitToAddress.zip}` : ''}
${remitToAddress.phone ? `Phone: ${remitToAddress.phone}` : ''}
${remitToAddress.email ? `Email: ${remitToAddress.email}` : ''}

Please make all payments payable to ${factoringCompany.name} and reference Invoice #${invoice.invoiceNumber}.

Any questions regarding this invoice should be directed to ${factoringCompany.name}.`;

        return {
          success: true,
          remitToAddress,
          noticeOfAssignment,
        };
      } else {
        // NOT FACTORED: Use Standard Company Address
        const company = await prisma.company.findUnique({
          where: { id: invoice.customer.companyId },
        });

        if (!company) {
          return {
            success: false,
            error: 'Company not found',
          };
        }

        const remitToAddress = {
          name: company.name,
          address: company.address || '',
          city: company.city || '',
          state: company.state || '',
          zip: company.zip || '',
          phone: company.phone || undefined,
          email: company.email || undefined,
        };

        return {
          success: true,
          remitToAddress,
          noticeOfAssignment: undefined, // No notice for non-factored invoices
        };
      }
    } catch (error: any) {
      console.error('Error finalizing invoice:', error);
      return {
        success: false,
        error: error.message || 'Failed to finalize invoice',
      };
    }
  }

  /**
   * Validation Gate: Check if load is ready to bill ("Clean Load" check)
   * 
   * Returns FALSE if:
   * - POD image is missing/null
   * - CarrierRate != CustomerRate (Allow override if brokerage split)
   * - BOL Weight is 0 or Null
   */
  async isReadyToBill(loadId: string, options?: {
    allowBrokerageSplit?: boolean; // Allow rate mismatch if brokerage split
  }): Promise<ReadyToBillResult> {
    const reasons: string[] = [];

    try {
      // Fetch load with all necessary data
      const load = await prisma.load.findUnique({
        where: { id: loadId },
        include: {
          documents: {
            where: {
              type: 'POD',
              deletedAt: null,
            },
          },
          customer: {
            select: {
              id: true,
              type: true, // Check if BROKER type (brokerage split)
            },
          },
        },
      });

      if (!load) {
        return {
          ready: false,
          reasons: ['Load not found'],
        };
      }

      // Check 1: POD image is missing/null
      const podDocuments = load.documents.filter(doc => doc.type === 'POD' && doc.fileUrl);
      if (podDocuments.length === 0) {
        reasons.push('POD (Proof of Delivery) image is missing');
      }

      // Check 2: CarrierRate != CustomerRate (Allow override if brokerage split)
      // CarrierRate = driverPay (what we pay the carrier)
      // CustomerRate = revenue (what customer pays us)
      const carrierRate = load.driverPay || 0;
      const customerRate = load.revenue || 0;

      // Check if brokerage split is allowed
      const isBrokerageSplit = options?.allowBrokerageSplit || load.customer.type === 'BROKER';
      
      if (carrierRate !== customerRate && !isBrokerageSplit) {
        reasons.push(`Rate mismatch: Carrier Rate ($${carrierRate.toFixed(2)}) does not match Customer Rate ($${customerRate.toFixed(2)}). Brokerage split override required.`);
      }

      // Check 3: BOL Weight is 0 or Null
      if (!load.weight || load.weight === 0) {
        reasons.push('BOL Weight is missing or zero');
      }

      return {
        ready: reasons.length === 0,
        reasons: reasons.length > 0 ? reasons : undefined,
        missingPOD: podDocuments.length === 0,
        rateMismatch: carrierRate !== customerRate && !isBrokerageSplit,
        missingBOLWeight: !load.weight || load.weight === 0,
      };
    } catch (error: any) {
      console.error('Error checking ready to bill:', error);
      return {
        ready: false,
        reasons: [error.message || 'Failed to validate load'],
      };
    }
  }

  /**
   * Check multiple loads for billing readiness
   */
  async areLoadsReadyToBill(
    loadIds: string[],
    options?: {
      allowBrokerageSplit?: boolean;
    }
  ): Promise<{
    allReady: boolean;
    results: Array<{
      loadId: string;
      ready: boolean;
      reasons?: string[];
    }>;
  }> {
    const results = await Promise.all(
      loadIds.map(async (loadId) => {
        const result = await this.isReadyToBill(loadId, options);
        return {
          loadId,
          ready: result.ready,
          reasons: result.reasons,
        };
      })
    );

    const allReady = results.every(r => r.ready);

    return {
      allReady,
      results,
    };
  }
}

