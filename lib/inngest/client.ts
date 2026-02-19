/**
 * Inngest Client
 * 
 * Centralized Inngest client for background job processing.
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 3
 */

import { Inngest } from 'inngest';

// Define event types for type safety
export type InngestEvents = {
  // Settlement Events
  'settlement/generate-all': {
    data: Record<string, never>;
  };
  'settlement/generate-for-company': {
    data: {
      companyId: string;
      periodStart?: string;
      periodEnd?: string;
    };
  };
  'settlement/generate-for-driver': {
    data: {
      driverId: string;
      periodStart: string;
      periodEnd: string;
    };
  };
  
  // QuickBooks Events
  'invoice/approved': {
    data: {
      invoiceId: string;
      companyId: string;
    };
  };
  'quickbooks/sync-invoice': {
    data: {
      invoiceId: string;
      companyId: string;
    };
  };
  'quickbooks/sync-customer': {
    data: {
      customerId: string;
      companyId: string;
    };
  };
  
  // PDF Generation Events
  'pdf/generate-settlement': {
    data: {
      settlementId: string;
    };
  };
  'pdf/generate-invoice': {
    data: {
      invoiceId: string;
    };
  };
  
  // Notification Events
  'notification/send-email': {
    data: {
      to: string;
      subject: string;
      templateId: string;
      data: Record<string, unknown>;
    };
  };
  
  // IFTA Events
  'ifta/calculate-quarter': {
    data: {
      companyId: string;
      quarter: number;
      year: number;
    };
  };
  
  // Load Events
  'load/delivered': {
    data: {
      loadId: string;
      companyId: string;
    };
  };
  'load/status-changed': {
    data: {
      loadId: string;
      companyId: string;
      previousStatus: string;
      newStatus: string;
    };
  };

  // CRM Events
  'crm/sync-leads': {
    data: Record<string, never>;
  };
  'crm/check-follow-ups': {
    data: Record<string, never>;
  };
  'crm/auto-score-lead': {
    data: {
      leadId: string;
    };
  };

  // Campaign Events
  'campaign/execute': {
    data: {
      campaignId: string;
      senderId: string;
    };
  };

  // Automation Events
  'automation/lead-event': {
    data: {
      leadId: string;
      companyId: string;
      event: string;
      metadata?: Record<string, unknown>;
    };
  };
};

// Create the Inngest client
export const inngest = new Inngest({
  id: 'tms-trucking',
});

