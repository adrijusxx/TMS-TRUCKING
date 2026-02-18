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

// Load Automation Functions
export { autoInvoiceOnStatusChange } from './auto-invoice';
export { autoSettlementReadiness } from './auto-settlement-readiness';

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

import { autoInvoiceOnStatusChange } from './auto-invoice';
import { autoSettlementReadiness } from './auto-settlement-readiness';

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
  // Load Automation
  autoInvoiceOnStatusChange,
  autoSettlementReadiness,
];

