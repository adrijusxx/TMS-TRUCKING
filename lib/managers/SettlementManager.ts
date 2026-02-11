/**
 * SettlementManager
 * 
 * Handles automated settlement generation with STRICT driver pay hierarchy.
 * Refactored to delegate logic to specialized sub-modules to comply with 500-line law.
 */

import { SettlementOrchestrator } from './settlement/Orchestrator';
import { SettlementCalculationEngine } from './settlement/CalculationEngine';
import { SettlementWorkflowManager } from './settlement/WorkflowManager';
import { SettlementGenerationParams, SettlementCalculatedValues } from './settlement/types';

export class SettlementManager {
  private orchestrator: SettlementOrchestrator;
  private calculationEngine: SettlementCalculationEngine;
  private workflowManager: SettlementWorkflowManager;

  constructor() {
    this.orchestrator = new SettlementOrchestrator();
    this.calculationEngine = new SettlementCalculationEngine();
    this.workflowManager = new SettlementWorkflowManager();
  }

  /**
   * Auto-generate settlement for a driver with STRICT pay hierarchy
   */
  async generateSettlement(params: SettlementGenerationParams): Promise<any> {
    return this.orchestrator.generateSettlement(params);
  }

  /**
   * Recalculate an existing settlement
   */
  async recalculateSettlement(settlementId: string): Promise<any> {
    return this.orchestrator.recalculateSettlement(settlementId);
  }

  /**
   * Calculate settlement values without persisting (Preview/Draft Mode)
   */
  async calculateSettlementPreview(
    driverId: string,
    loads: any[],
    periodStart: Date,
    periodEnd: Date
  ): Promise<SettlementCalculatedValues> {
    return this.calculationEngine.calculateSettlementPreview(driverId, loads, periodStart, periodEnd);
  }

  /**
   * Submit settlement for approval
   */
  async submitForApproval(settlementId: string): Promise<any> {
    return this.workflowManager.submitForApproval(settlementId);
  }

  /**
   * Approve settlement
   */
  async approveSettlement(
    settlementId: string,
    approverId: string,
    notes?: string
  ): Promise<any> {
    return this.workflowManager.approveSettlement(settlementId, approverId, notes);
  }

  /**
   * Reject settlement
   */
  async rejectSettlement(
    settlementId: string,
    approverId: string,
    reason: string
  ): Promise<any> {
    return this.workflowManager.rejectSettlement(settlementId, approverId, reason);
  }

  /**
   * Mark settlement as paid
   */
  async processPayment(
    settlementId: string,
    paymentMethod: string,
    paymentReference?: string
  ): Promise<any> {
    return this.workflowManager.processPayment(settlementId, paymentMethod, paymentReference);
  }

  /**
   * Get settlements pending approval
   */
  async getPendingApprovals(companyId: string): Promise<any[]> {
    return this.workflowManager.getPendingApprovals(companyId);
  }

  /**
   * Get settlement breakdown
   */
  async getSettlementBreakdown(settlementId: string): Promise<any> {
    return this.workflowManager.getSettlementBreakdown(settlementId);
  }
}
