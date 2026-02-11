/**
 * InvoiceManager
 * 
 * Handles invoice finalization with factoring logic and validation gates
 * Includes accounting field validation and data consistency checks
 */
import { prisma } from '@/lib/prisma';
import { validateLoadForAccounting } from '@/lib/validations/load';
import { UsageManager } from '@/lib/managers/UsageManager';

/**
 * Load data snapshot for invoice audit trail
 */
export interface LoadDataSnapshot {
  loadId: string;
  loadNumber: string;
  revenue: number;
  weight: number | null;
  totalMiles: number | null;
  driverPay: number | null;
  customerId: string;
  customerName: string;
  snapshotAt: Date;
}

interface InvoiceFinalizationResult {
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

        // Get address from metadata if available
        const metadata = (factoringCompanyFull?.metadata as any) || {};

        const remitToAddress = {
          name: factoringCompany.name,
          address: metadata.address || factoringCompanyFull?.contactName || factoringCompany.name,
          city: metadata.city || '',
          state: metadata.state || '',
          zip: metadata.zip || '',
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
        missingPOD: false,
        rateMismatch: false,
        missingBOLWeight: false,
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

  /**
   * Create a snapshot of load data at invoice creation time
   * Used for audit trail and detecting data changes post-invoicing
   */
  async createLoadDataSnapshots(loadIds: string[]): Promise<LoadDataSnapshot[]> {
    const loads = await prisma.load.findMany({
      where: { id: { in: loadIds } },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return loads.map(load => ({
      loadId: load.id,
      loadNumber: load.loadNumber,
      revenue: load.revenue,
      weight: load.weight,
      totalMiles: load.totalMiles,
      driverPay: load.driverPay,
      customerId: load.customerId,
      customerName: load.customer.name,
      snapshotAt: new Date(),
    }));
  }

  /**
   * Check if load data has changed since invoicing
   * Compares current load data with stored snapshot
   */
  async checkDataConsistency(
    loadId: string,
    snapshot: LoadDataSnapshot
  ): Promise<{
    consistent: boolean;
    discrepancies: string[];
  }> {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!load) {
      return {
        consistent: false,
        discrepancies: ['Load not found'],
      };
    }

    const discrepancies: string[] = [];

    // Check revenue
    if (load.revenue !== snapshot.revenue) {
      discrepancies.push(
        `Revenue changed from $${snapshot.revenue.toFixed(2)} to $${load.revenue.toFixed(2)}`
      );
    }

    // Check weight
    if (load.weight !== snapshot.weight) {
      discrepancies.push(
        `Weight changed from ${snapshot.weight ?? 'null'} to ${load.weight ?? 'null'}`
      );
    }

    // Check total miles
    if (load.totalMiles !== snapshot.totalMiles) {
      discrepancies.push(
        `Total miles changed from ${snapshot.totalMiles ?? 'null'} to ${load.totalMiles ?? 'null'}`
      );
    }

    // Check driver pay
    if (load.driverPay !== snapshot.driverPay) {
      discrepancies.push(
        `Driver pay changed from $${snapshot.driverPay?.toFixed(2) ?? 'null'} to $${load.driverPay?.toFixed(2) ?? 'null'}`
      );
    }

    // Check customer
    if (load.customerId !== snapshot.customerId) {
      discrepancies.push(
        `Customer changed from ${snapshot.customerName} to ${load.customer.name}`
      );
    }

    return {
      consistent: discrepancies.length === 0,
      discrepancies,
    };
  }

  /**
   * Validate loads for accounting requirements before invoicing
   */
  async validateLoadsForInvoicing(loadIds: string[]): Promise<{
    allValid: boolean;
    results: Array<{
      loadId: string;
      loadNumber: string;
      canInvoice: boolean;
      errors: string[];
      warnings: string[];
    }>;
  }> {
    const loads = await prisma.load.findMany({
      where: { id: { in: loadIds } },
      select: {
        id: true,
        loadNumber: true,
        customerId: true,
        revenue: true,
        weight: true,
        driverId: true,
        totalMiles: true,
        driverPay: true,
        fuelAdvance: true,
      },
    });

    const results = loads.map(load => {
      const validation = validateLoadForAccounting(load);
      return {
        loadId: load.id,
        loadNumber: load.loadNumber,
        canInvoice: validation.canInvoice,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    });

    const allValid = results.every(r => r.canInvoice);

    return {
      allValid,
      results,
    };
  }
  /**
   * Generate an invoice for a specific set of loads
   * Centralizes the logic previously found in the API route
   */
  async generateInvoice(
    loadIds: string[],
    options?: {
      invoiceNumber?: string;
      dueDate?: Date;
      notes?: string;
    }
  ): Promise<{ success: boolean; invoice?: any; error?: string }> {
    try {
      // 1. Fetch loads with all necessary relations
      const loads = await prisma.load.findMany({
        where: { id: { in: loadIds } },
        include: {
          customer: {
            select: {
              id: true,
              paymentTerms: true,
              taxRate: true,
              isTaxExempt: true,
            },
          },
          dispatcher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          driver: {
            select: {
              id: true,
              driverNumber: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
          truck: {
            select: {
              id: true,
              truckNumber: true,
            },
          },
          mcNumber: {
            select: {
              number: true,
            },
          },
        },
      });

      if (loads.length === 0) {
        return { success: false, error: 'No loads found' };
      }

      // 2. Validate all loads belong to same company, customer, and MC Number
      const companyIds = new Set(loads.map(l => l.companyId));
      if (companyIds.size > 1) return { success: false, error: 'Loads must belong to the same company' };

      const customerIds = new Set(loads.map(l => l.customerId));
      if (customerIds.size > 1) return { success: false, error: 'Loads must belong to the same customer' };

      // Strict MC Number Check - All loads must be under the same MC
      const mcNumberIds = new Set(loads.map(l => l.mcNumberId).filter(Boolean)); // filter Boolean handles nulls/undefined if strict mode not fully enforced yet
      if (mcNumberIds.size > 1) return { success: false, error: 'Loads must belong to the same MC Number' };

      const load = loads[0]; // Representative load for customer/company info

      // 3. Calculate Totals
      // NOTE: Trucking B2B invoices (carrier ↔ broker) are not subject to sales tax.
      // If per-customer tax rules are needed in the future, implement a configurable tax rate.
      const subtotal = loads.reduce((sum, l) => sum + (l.revenue || 0), 0);

      // Calculate Tax based on Customer Settings
      let tax = 0;
      // @ts-ignore - Prisma types update may be pending
      if (!load.customer.isTaxExempt && load.customer.taxRate > 0) {
        // @ts-ignore
        tax = subtotal * (load.customer.taxRate / 100);
      }

      const total = subtotal + tax;

      // 4. Determine Invoice Number and Due Date
      const invoiceNumber = options?.invoiceNumber || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const dueDate = options?.dueDate || new Date(Date.now() + (load.customer.paymentTerms || 30) * 24 * 60 * 60 * 1000);

      // 5. Build Notes / Contact Info
      const contactInfo: string[] = [];
      const dispatchers = new Set(loads.filter(l => l.dispatcher).map(l => `${l.dispatcher!.firstName} ${l.dispatcher!.lastName} ${l.dispatcher!.phone ? `(${l.dispatcher!.phone})` : ''}`));
      const drivers = new Set(loads.filter(l => l.driver?.user).map(l => `${l.driver!.user!.firstName} ${l.driver!.user!.lastName} ${l.driver!.user!.phone ? `(${l.driver!.user!.phone})` : ''}`));
      const trucks = new Set(loads.filter(l => l.truck?.truckNumber).map(l => l.truck!.truckNumber));

      if (dispatchers.size) contactInfo.push(`Dispatcher(s): ${Array.from(dispatchers).join(', ')}`);
      if (drivers.size) contactInfo.push(`Driver(s): ${Array.from(drivers).join(', ')}`);
      if (trucks.size) contactInfo.push(`Truck(s): ${Array.from(trucks).join(', ')}`);

      const finalNotes = [
        options?.notes,
        contactInfo.length > 0 ? `\n\nContact Information:\n${contactInfo.join('\n')}` : ''
      ].filter(Boolean).join('');

      // 6. Create Invoice
      const invoice = await prisma.invoice.create({
        data: {
          companyId: load.companyId,
          customerId: load.customerId,
          invoiceNumber,
          invoiceDate: new Date(),
          dueDate,
          subtotal,
          tax,
          total,
          balance: total,
          status: 'DRAFT',
          notes: finalNotes || undefined,
          loadIds: loads.map(l => l.id),
          mcNumber: load.mcNumber?.number, // Legacy string field
          mcNumberId: load.mcNumberId,     // Foreign Key for Relation
        },
      });

      // 7. Update load statuses to INVOICED
      await prisma.load.updateMany({
        where: { id: { in: loadIds } },
        data: { status: 'INVOICED' },
      });

      // 8. Track usage
      try {
        const companyId = load.companyId;
        await UsageManager.trackUsage(companyId, 'INVOICES_GENERATED');
      } catch (usageError) {
        console.error('[InvoiceManager] Failed to track usage:', usageError);
      }

      return { success: true, invoice };

    } catch (error: any) {
      console.error('Error generating invoice:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Money Trace Audit: Ensure all finalized Rate Confirmations are either Invoiced or on Billing Hold.
   * Helps detect revenue leakage (loads that were delivered but never billed).
   */
  async checkInvoicingCompleteness(companyId: string, mcNumberId?: string): Promise<{
    orphanCount: number;
    orphanLoadNumbers: string[];
  }> {
    const loads = await prisma.load.findMany({
      where: {
        companyId,
        mcNumberId,
        deletedAt: null,
        status: { in: ['DELIVERED'] }, // Only focus on delivered loads
        isBillingHold: false,
        invoices: {
          none: {} // No invoice exists
        },
        rateConfirmation: {
          isNot: null // Has a rate confirmation
        }
      },
      select: {
        loadNumber: true
      }
    });

    return {
      orphanCount: loads.length,
      orphanLoadNumbers: loads.map(l => l.loadNumber)
    };
  }

  /**
   * Financial Parity Audit: Check for Invoiced loads that haven't been settled for the driver.
   * Ensures drivers are paid for the revenue the company has billed.
   */
  async checkSettlementParity(companyId: string, mcNumberId?: string): Promise<{
    unsettledCount: number;
    unsettledLoadNumbers: string[];
  }> {
    const loads = await prisma.load.findMany({
      where: {
        companyId,
        mcNumberId,
        deletedAt: null,
        invoices: {
          some: {
            status: { in: ['SENT', 'PAID', 'PARTIAL'] }
          }
        },
        driverId: { not: null },
        readyForSettlement: true,
      },
      select: {
        id: true,
        loadNumber: true
      }
    });

    // Filter out loads already in settlements
    const settledLoadIds = await prisma.settlement.findMany({
      where: { driver: { companyId } },
      select: { loadIds: true }
    });
    const allSettledIds = new Set(settledLoadIds.flatMap(s => s.loadIds));
    const unsettledLoads = loads.filter(l => !allSettledIds.has(l.id));

    return {
      unsettledCount: unsettledLoads.length,
      unsettledLoadNumbers: unsettledLoads.map(l => l.loadNumber)
    };
  }

  /**
   * Detect financial anomalies and revenue leaks for a load
   */
  async detectExpenseGaps(loadId: string): Promise<{
    hasAnomalies: boolean;
    anomalies: string[];
  }> {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        documents: { where: { deletedAt: null } },
        loadExpenses: true,
      }
    });

    if (!load) return { hasAnomalies: false, anomalies: [] };

    const anomalies: string[] = [];

    // 1. Check for missing documents on delivered loads
    if (load.status === 'DELIVERED') {
      const hasPOD = load.documents.some(d => d.type === 'POD');
      if (!hasPOD) {
        anomalies.push('Load is DELIVERED but missing Proof of Delivery (POD).');
      }
    }

    // 2. Check for missing fuel expenses on high mileage loads
    if (load.totalMiles && load.totalMiles > 300) {
      const hasFuelExpense = load.loadExpenses.some(e => ['FUEL_ADDITIVE', 'DEF'].includes(e.expenseType));
      if (!hasFuelExpense) {
        anomalies.push(`High mileage load (${load.totalMiles.toFixed(0)} mi) has zero registered fuel expenses.`);
      }
    }

    // 3. Check for ready-for-settlement but missing revenue
    if (load.readyForSettlement && (!load.revenue || load.revenue <= 0)) {
      anomalies.push('Load is marked for settlement but has zero revenue.');
    }

    return {
      hasAnomalies: anomalies.length > 0,
      anomalies
    };
  }
}

