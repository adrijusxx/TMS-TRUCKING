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
import { syncCrmLeads } from './sync-crm-leads';
import { checkLeadFollowUps } from './check-lead-follow-ups';
import { checkLeadSLA } from './check-lead-sla';
import { autoScoreLead } from './auto-score-lead';
import { executeCampaign } from './execute-campaign';
import { processDripSteps } from './process-drip-steps';
import { processAutomation } from './process-automation';
import { generateLeadSummary } from './generate-lead-summary';
import { checkFleetDormancy } from './check-fleet-dormancy';
import { autoArchiveLeads } from './auto-archive-leads';
import { databaseKeepAlive } from './keep-alive';
import { processRecurringExpenses } from './recurring-expenses';
import { sendMissingReceiptAlerts } from './missing-receipt-alerts';
import { hourlyAutomation } from './hourly-automation';
import { dailyAutomation } from './daily-automation';
import { weeklyAutomation } from './weekly-automation';
import { samsaraFaultSync } from './samsara-faults';
import { checkTrialExpiration } from './check-trial-expiration';
import { dailyDigest } from './daily-digest';
import { mattermostBatchNotify } from './mattermost-batch';

export { syncCrmLeads } from './sync-crm-leads';
export { checkLeadFollowUps } from './check-lead-follow-ups';
export { checkLeadSLA } from './check-lead-sla';
export { autoScoreLead } from './auto-score-lead';
export { executeCampaign } from './execute-campaign';
export { processDripSteps } from './process-drip-steps';
export { processAutomation } from './process-automation';
export { generateLeadSummary } from './generate-lead-summary';
export { checkFleetDormancy } from './check-fleet-dormancy';
export { autoArchiveLeads } from './auto-archive-leads';
export { databaseKeepAlive } from './keep-alive';
export { processRecurringExpenses } from './recurring-expenses';
export { sendMissingReceiptAlerts } from './missing-receipt-alerts';
export { hourlyAutomation } from './hourly-automation';
export { dailyAutomation } from './daily-automation';
export { weeklyAutomation } from './weekly-automation';
export { samsaraFaultSync } from './samsara-faults';
export { checkTrialExpiration } from './check-trial-expiration';
export { dailyDigest } from './daily-digest';
export { mattermostBatchNotify } from './mattermost-batch';

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
  // CRM
  syncCrmLeads,
  checkLeadFollowUps,
  checkLeadSLA,
  autoScoreLead,
  // Campaigns
  executeCampaign,
  processDripSteps,
  // Automation
  processAutomation,
  // Lead AI Summary
  generateLeadSummary,
  // Fleet Monitoring
  checkFleetDormancy,
  // Lead Auto-Archival
  autoArchiveLeads,
  // Database Keep-Alive
  databaseKeepAlive,
  // Company Expenses Automation
  processRecurringExpenses,
  sendMissingReceiptAlerts,
  // Scheduled Automation (migrated from node-cron)
  hourlyAutomation,
  dailyAutomation,
  weeklyAutomation,
  samsaraFaultSync,
  // Subscription
  checkTrialExpiration,
  // Daily Digest
  dailyDigest,
  // Mattermost Batching
  mattermostBatchNotify,
];

