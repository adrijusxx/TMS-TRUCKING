/**
 * LoadCostingManager - Facade
 * 
 * Re-routes calls to specialized sub-managers:
 * - LoadCostCalculator: Individual load/batch costs
 * - LoadProfitabilityAnalyzer: Analytics and summaries
 * 
 * Part of the "Split from LoadCostingManager" initiative for maintainability.
 */

import { LoadCostCalculator, LoadCost, CostBreakdown } from './costing/LoadCostCalculator';
import { LoadProfitabilityAnalyzer } from './costing/LoadProfitabilityAnalyzer';

export class LoadCostingManager {
  private calculator: LoadCostCalculator;
  private analyzer: LoadProfitabilityAnalyzer;

  constructor() {
    this.calculator = new LoadCostCalculator();
    this.analyzer = new LoadProfitabilityAnalyzer();
  }

  /**
   * Calculate total load cost
   */
  async calculateLoadCost(loadId: string): Promise<LoadCost> {
    return this.calculator.calculateLoadCost(loadId);
  }

  /**
   * Calculate load profitability
   */
  async calculateProfitability(loadId: string): Promise<number> {
    return this.calculator.calculateProfitability(loadId);
  }

  /**
   * Get detailed cost breakdown
   */
  async getCostBreakdown(loadId: string): Promise<CostBreakdown> {
    return this.calculator.getCostBreakdown(loadId);
  }

  /**
   * Get load margin percentage
   */
  async getLoadMargin(loadId: string): Promise<number> {
    return this.calculator.getLoadMargin(loadId);
  }

  /**
   * Calculate profitability for multiple loads
   */
  async calculateBatchProfitability(loadIds: string[]): Promise<LoadCost[]> {
    return this.calculator.calculateBatchProfitability(loadIds);
  }

  /**
   * Get profitability summary for a date range
   */
  async getProfitabilitySummary(
    mcWhere: Record<string, any>,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
    averageMargin: number;
    loadCount: number;
  }> {
    return this.analyzer.getProfitabilitySummary(mcWhere, startDate, endDate);
  }

  /**
   * Get most profitable loads
   */
  async getMostProfitableLoads(
    mcWhere: Record<string, any>,
    limit: number = 10
  ): Promise<CostBreakdown[]> {
    return this.analyzer.getMostProfitableLoads(mcWhere, limit);
  }

  /**
   * Get least profitable loads (potential issues)
   */
  async getLeastProfitableLoads(
    mcWhere: Record<string, any>,
    limit: number = 10
  ): Promise<CostBreakdown[]> {
    return this.analyzer.getLeastProfitableLoads(mcWhere, limit);
  }

  /**
   * Calculate projected profit based on fleet-wide averages
   */
  async calculateProjectedProfit(loadId: string): Promise<{
    projectedFuel: number;
    projectedMaintenance: number;
    projectedTotalCost: number;
    projectedNetProfit: number;
    projectedMargin: number;
  }> {
    return this.analyzer.calculateProjectedProfit(loadId);
  }
}
