/**
 * Inngest Functions Index
 * 
 * Central export for all Inngest background functions.
 * Add new functions here to register them with the Inngest serve handler.
 */

// Settlement Functions
export {
  generateAllSettlements,
  generateCompanySettlements,
  generateDriverSettlement,
} from './generate-settlements';

// QuickBooks Sync Functions
export {
  syncInvoiceOnApproval,
  manualInvoiceSync,
  syncCustomer,
} from './sync-quickbooks';

// IFTA Functions
export {
  calculateQuarterlyIFTA,
  calculateLoadIFTA,
} from './calculate-ifta';

// Aggregate all functions for serve handler
import {
  generateAllSettlements,
  generateCompanySettlements,
  generateDriverSettlement,
} from './generate-settlements';

import {
  syncInvoiceOnApproval,
  manualInvoiceSync,
  syncCustomer,
} from './sync-quickbooks';

import {
  calculateQuarterlyIFTA,
  calculateLoadIFTA,
} from './calculate-ifta';

export const allFunctions = [
  // Settlements
  generateAllSettlements,
  generateCompanySettlements,
  generateDriverSettlement,
  // QuickBooks
  syncInvoiceOnApproval,
  manualInvoiceSync,
  syncCustomer,
  // IFTA
  calculateQuarterlyIFTA,
  calculateLoadIFTA,
];

