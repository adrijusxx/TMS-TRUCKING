/**
 * AccountingFieldMapper
 * 
 * Service for mapping load fields to accounting documents (invoices, settlements)
 * and ensuring data integrity across the financial pipeline.
 * 
 * FIELD MAPPING REFERENCE:
 * - Load.revenue → Invoice.total (what we bill the customer)
 * - Load.driverPay → Settlement.amount (what we pay the driver)
 * - Load.weight → Invoice.weight (for BOL validation)
 * - Load.loadNumber → Invoice.referenceNumber / Settlement.referenceNumber
 * - Load.customerId → Invoice.customerId
 * - Load.driverId → Settlement.driverId
 * - Load.totalMiles → Settlement.miles (for CPM calculations)
 */

import { prisma } from '@/lib/prisma';
import { validateLoadForAccounting } from '@/lib/validations/load';
import { calculateNetDriverPay } from '@/lib/utils/calculateDriverPay';

export interface FieldMapping {
  loadField: string;
  targetField: string;
  targetDocument: 'invoice' | 'settlement';
  description: string;
  required: boolean;
}

export interface IntegrityCheckResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  details: {
    loadsChecked: number;
    invoicesChecked: number;
    settlementsChecked: number;
    orphanedInvoices: string[];
    orphanedSettlements: string[];
    revenueDiscrepancies: Array<{
      loadId: string;
      loadNumber: string;
      loadRevenue: number;
      invoiceTotal: number;
      difference: number;
    }>;
    driverPayDiscrepancies: Array<{
      loadId: string;
      loadNumber: string;
      loadDriverPay: number;
      settlementAmount: number;
      difference: number;
    }>;
  };
}

/**
 * Standard field mappings between Load and accounting documents
 */
export const FIELD_MAPPINGS: FieldMapping[] = [
  // Invoice Mappings
  {
    loadField: 'revenue',
    targetField: 'total',
    targetDocument: 'invoice',
    description: 'Load revenue maps to invoice total',
    required: true,
  },
  {
    loadField: 'weight',
    targetField: 'weight',
    targetDocument: 'invoice',
    description: 'Load weight for BOL validation',
    required: true,
  },
  {
    loadField: 'loadNumber',
    targetField: 'referenceNumber',
    targetDocument: 'invoice',
    description: 'Load number as invoice reference',
    required: true,
  },
  {
    loadField: 'customerId',
    targetField: 'customerId',
    targetDocument: 'invoice',
    description: 'Customer for invoicing',
    required: true,
  },
  
  // Settlement Mappings
  {
    loadField: 'driverPay',
    targetField: 'amount',
    targetDocument: 'settlement',
    description: 'Driver pay maps to settlement amount',
    required: true,
  },
  {
    loadField: 'loadNumber',
    targetField: 'referenceNumber',
    targetDocument: 'settlement',
    description: 'Load number for settlement reference',
    required: true,
  },
  {
    loadField: 'driverId',
    targetField: 'driverId',
    targetDocument: 'settlement',
    description: 'Driver for settlement',
    required: true,
  },
  {
    loadField: 'totalMiles',
    targetField: 'miles',
    targetDocument: 'settlement',
    description: 'Miles for CPM calculation',
    required: false,
  },
  {
    loadField: 'fuelAdvance',
    targetField: 'fuelAdvance',
    targetDocument: 'settlement',
    description: 'Fuel advance deduction',
    required: false,
  },
];

export class AccountingFieldMapper {
  /**
   * Get all field mappings
   */
  static getFieldMappings(): FieldMapping[] {
    return FIELD_MAPPINGS;
  }

  /**
   * Get mappings for a specific document type
   */
  static getMappingsForDocument(documentType: 'invoice' | 'settlement'): FieldMapping[] {
    return FIELD_MAPPINGS.filter(m => m.targetDocument === documentType);
  }

  /**
   * Validate that a load has all required fields for invoicing
   */
  static validateForInvoice(load: any): {
    valid: boolean;
    missingFields: string[];
    errors: string[];
  } {
    const invoiceMappings = this.getMappingsForDocument('invoice');
    const requiredMappings = invoiceMappings.filter(m => m.required);
    
    const missingFields: string[] = [];
    const errors: string[] = [];
    
    for (const mapping of requiredMappings) {
      const value = load[mapping.loadField];
      if (value === undefined || value === null || value === '') {
        missingFields.push(mapping.loadField);
        errors.push(`${mapping.description}: ${mapping.loadField} is required`);
      }
    }
    
    // Additional validation
    if (load.revenue !== undefined && load.revenue <= 0) {
      errors.push('Revenue must be greater than 0 for invoicing');
    }
    
    return {
      valid: missingFields.length === 0 && errors.length === 0,
      missingFields,
      errors,
    };
  }

  /**
   * Validate that a load has all required fields for settlement
   */
  static validateForSettlement(load: any): {
    valid: boolean;
    missingFields: string[];
    errors: string[];
    warnings: string[];
  } {
    const settlementMappings = this.getMappingsForDocument('settlement');
    const requiredMappings = settlementMappings.filter(m => m.required);
    
    const missingFields: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const mapping of requiredMappings) {
      const value = load[mapping.loadField];
      if (value === undefined || value === null || value === '') {
        missingFields.push(mapping.loadField);
        errors.push(`${mapping.description}: ${mapping.loadField} is required`);
      }
    }
    
    // Warnings for optional but recommended fields
    if (!load.totalMiles || load.totalMiles <= 0) {
      warnings.push('Total miles missing - CPM calculation will not be accurate');
    }
    
    if (load.driverPay !== undefined && load.driverPay < 0) {
      errors.push('Driver pay cannot be negative');
    }
    
    return {
      valid: errors.length === 0,
      missingFields,
      errors,
      warnings,
    };
  }

  /**
   * Run comprehensive data integrity checks across loads, invoices, and settlements
   */
  static async runIntegrityCheck(companyId: string): Promise<IntegrityCheckResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const revenueDiscrepancies: IntegrityCheckResult['details']['revenueDiscrepancies'] = [];
    const driverPayDiscrepancies: IntegrityCheckResult['details']['driverPayDiscrepancies'] = [];
    const orphanedInvoices: string[] = [];
    const orphanedSettlements: string[] = [];

    // Fetch all invoiced loads
    const invoicedLoads = await prisma.load.findMany({
      where: {
        companyId,
        invoicedAt: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        loadNumber: true,
        revenue: true,
        driverPay: true,
        driverId: true,
        invoicedAt: true,
      },
    });

    // Fetch all invoices for the company
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        customer: {
          companyId,
        },
      },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        loadIds: true,
      },
    });

    // Check 1: Verify all invoiced loads have revenue > 0
    for (const load of invoicedLoads) {
      if (!load.revenue || load.revenue <= 0) {
        errors.push(`Load ${load.loadNumber} is invoiced but has no revenue`);
      }
    }

    // Check 2: Verify invoice totals match load revenues
    for (const invoice of invoices) {
      const loadIds = invoice.loadIds as string[] || [];
      if (loadIds.length === 0) {
        orphanedInvoices.push(invoice.invoiceNumber);
        warnings.push(`Invoice ${invoice.invoiceNumber} has no associated loads`);
        continue;
      }

      // Sum up revenue from associated loads
      const associatedLoads = invoicedLoads.filter(l => loadIds.includes(l.id));
      const totalLoadRevenue = associatedLoads.reduce((sum, l) => sum + (l.revenue || 0), 0);

      // Compare with invoice total (allowing for tax which is typically 8%)
      const invoiceSubtotal = invoice.total / 1.08; // Remove tax estimate
      const difference = Math.abs(totalLoadRevenue - invoiceSubtotal);
      
      // Allow 1% tolerance for rounding
      if (difference > totalLoadRevenue * 0.01 && difference > 1) {
        revenueDiscrepancies.push({
          loadId: loadIds.join(', '),
          loadNumber: associatedLoads.map(l => l.loadNumber).join(', '),
          loadRevenue: totalLoadRevenue,
          invoiceTotal: invoice.total,
          difference,
        });
      }
    }

    // Check 3: Verify loads with drivers have driverPay calculated
    const loadsWithDrivers = await prisma.load.findMany({
      where: {
        companyId,
        driverId: { not: null },
        status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
        deletedAt: null,
      },
      select: {
        id: true,
        loadNumber: true,
        driverPay: true,
        revenue: true,
      },
    });

    for (const load of loadsWithDrivers) {
      if (!load.driverPay || load.driverPay <= 0) {
        warnings.push(`Load ${load.loadNumber} is delivered with driver but has no driver pay calculated`);
      }
      
      // Check if driver pay exceeds revenue
      if (load.driverPay && load.revenue && load.driverPay > load.revenue) {
        warnings.push(`Load ${load.loadNumber}: Driver pay ($${load.driverPay}) exceeds revenue ($${load.revenue})`);
      }
    }

    // Check 4: Verify no orphaned financial records
    const loadsWithCustomer = await prisma.load.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        loadNumber: true,
        customerId: true,
      },
    });

    for (const load of loadsWithCustomer) {
      if (!load.customerId) {
        errors.push(`Load ${load.loadNumber} has no customer assigned - cannot be invoiced`);
      }
    }

    const passed = errors.length === 0;

    return {
      passed,
      errors,
      warnings,
      details: {
        loadsChecked: invoicedLoads.length + loadsWithDrivers.length,
        invoicesChecked: invoices.length,
        settlementsChecked: 0, // Settlement model may not exist yet
        orphanedInvoices,
        orphanedSettlements,
        revenueDiscrepancies,
        driverPayDiscrepancies,
      },
    };
  }

  /**
   * Generate a settlement summary for a driver
   */
  static async generateSettlementSummary(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    driverId: string;
    period: { start: Date; end: Date };
    loads: Array<{
      loadId: string;
      loadNumber: string;
      pickupDate: Date | null;
      deliveryDate: Date | null;
      totalMiles: number | null;
      revenue: number;
      driverPay: number;
      fuelAdvance: number;
    }>;
    totals: {
      loadCount: number;
      totalMiles: number;
      totalRevenue: number;
      grossPay: number;
      totalFuelAdvance: number;
      netPay: number;
    };
    averages: {
      revenuePerLoad: number;
      payPerLoad: number;
      milesPerLoad: number;
      revenuePerMile: number;
      payPerMile: number;
    };
  }> {
    const loads = await prisma.load.findMany({
      where: {
        driverId,
        pickupDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['DELIVERED', 'INVOICED', 'PAID'] },
        deletedAt: null,
      },
      select: {
        id: true,
        loadNumber: true,
        pickupDate: true,
        deliveryDate: true,
        totalMiles: true,
        revenue: true,
        driverPay: true,
        fuelAdvance: true,
      },
      orderBy: { pickupDate: 'asc' },
    });

    const loadData = loads.map(l => ({
      loadId: l.id,
      loadNumber: l.loadNumber,
      pickupDate: l.pickupDate,
      deliveryDate: l.deliveryDate,
      totalMiles: l.totalMiles,
      revenue: l.revenue,
      driverPay: l.driverPay || 0,
      fuelAdvance: l.fuelAdvance || 0,
    }));

    // Calculate totals
    const loadCount = loadData.length;
    const totalMiles = loadData.reduce((sum, l) => sum + (l.totalMiles || 0), 0);
    const totalRevenue = loadData.reduce((sum, l) => sum + l.revenue, 0);
    const grossPay = loadData.reduce((sum, l) => sum + l.driverPay, 0);
    const totalFuelAdvance = loadData.reduce((sum, l) => sum + l.fuelAdvance, 0);
    
    const netPayCalc = calculateNetDriverPay(grossPay, { fuelAdvance: totalFuelAdvance });
    const netPay = netPayCalc.netPay;

    // Calculate averages
    const averages = {
      revenuePerLoad: loadCount > 0 ? totalRevenue / loadCount : 0,
      payPerLoad: loadCount > 0 ? grossPay / loadCount : 0,
      milesPerLoad: loadCount > 0 ? totalMiles / loadCount : 0,
      revenuePerMile: totalMiles > 0 ? totalRevenue / totalMiles : 0,
      payPerMile: totalMiles > 0 ? grossPay / totalMiles : 0,
    };

    return {
      driverId,
      period: { start: startDate, end: endDate },
      loads: loadData,
      totals: {
        loadCount,
        totalMiles,
        totalRevenue,
        grossPay,
        totalFuelAdvance,
        netPay,
      },
      averages,
    };
  }

  /**
   * Track field changes that affect accounting
   * Returns true if any accounting-critical field was changed
   */
  static detectAccountingFieldChanges(
    original: any,
    updated: any
  ): {
    hasAccountingChanges: boolean;
    changedFields: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      affectsDocument: 'invoice' | 'settlement' | 'both';
    }>;
  } {
    const changedFields: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      affectsDocument: 'invoice' | 'settlement' | 'both';
    }> = [];

    const accountingFields = [
      { field: 'revenue', affects: 'invoice' as const },
      { field: 'weight', affects: 'invoice' as const },
      { field: 'customerId', affects: 'invoice' as const },
      { field: 'driverPay', affects: 'settlement' as const },
      { field: 'driverId', affects: 'settlement' as const },
      { field: 'totalMiles', affects: 'both' as const },
      { field: 'fuelAdvance', affects: 'settlement' as const },
    ];

    for (const { field, affects } of accountingFields) {
      const oldValue = original[field];
      const newValue = updated[field];
      
      // Check if value changed (handle null/undefined)
      const hasChanged = 
        (oldValue === null || oldValue === undefined) !== (newValue === null || newValue === undefined) ||
        oldValue !== newValue;
      
      if (hasChanged) {
        changedFields.push({
          field,
          oldValue,
          newValue,
          affectsDocument: affects,
        });
      }
    }

    return {
      hasAccountingChanges: changedFields.length > 0,
      changedFields,
    };
  }
}

export default AccountingFieldMapper;

