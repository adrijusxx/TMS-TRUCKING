/**
 * AI Anomaly Detector Service
 * Detects unusual patterns in fuel costs, delays, revenue, etc.
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';

interface AnomalyDetectionInput {
  companyId: string;
  type: 'FUEL_COST' | 'DELAY' | 'REVENUE' | 'MAINTENANCE_COST' | 'DRIVER_BEHAVIOR' | 'GENERAL';
  startDate?: Date;
  endDate?: Date;
  driverId?: string;
  truckId?: string;
  mcNumberId?: string | string[]; // Added MC isolation
}

interface Anomaly {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detectedValue: number;
  expectedValue: number;
  deviation: number; // percentage
  date: string;
  entityId?: string;
  entityName?: string;
  recommendations: string[];
}

interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  summary: {
    totalAnomalies: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
}

export class AIAnomalyDetector extends AIService {
  /**
   * Detect anomalies in operational data
   */
  async detectAnomalies(input: AnomalyDetectionInput): Promise<AnomalyDetectionResult> {
    const endDate = input.endDate || new Date();
    const startDate = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days

    let dataContext = '';

    switch (input.type) {
      case 'FUEL_COST':
        dataContext = await this.getFuelCostContext(input, startDate, endDate);
        break;
      case 'DELAY':
        dataContext = await this.getDelayContext(input, startDate, endDate);
        break;
      case 'REVENUE':
        dataContext = await this.getRevenueContext(input, startDate, endDate);
        break;
      case 'MAINTENANCE_COST':
        dataContext = await this.getMaintenanceCostContext(input, startDate, endDate);
        break;
      case 'DRIVER_BEHAVIOR':
        dataContext = await this.getDriverBehaviorContext(input, startDate, endDate);
        break;
      default:
        dataContext = await this.getGeneralContext(input, startDate, endDate);
    }

    const prompt = `Detect anomalies in trucking company operational data. Return JSON with detected anomalies.

ANALYSIS TYPE: ${input.type}
PERIOD: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}

DATA:
${dataContext}

Return JSON with:
- anomalies: array of {
    type: string (description of anomaly type),
    severity: string (LOW, MEDIUM, HIGH, CRITICAL),
    description: string,
    detectedValue: number,
    expectedValue: number,
    deviation: number (percentage deviation),
    date: string (ISO format),
    entityId: string (optional, ID of driver/truck/load),
    entityName: string (optional, name/number),
    recommendations: array of strings
  }
- summary: {
    totalAnomalies: number,
    criticalCount: number,
    highCount: number,
    mediumCount: number,
    lowCount: number
  }

Anomaly detection criteria:
- CRITICAL: Deviation > 50% or safety/regulatory issues
- HIGH: Deviation 30-50% or significant operational impact
- MEDIUM: Deviation 15-30% or moderate impact
- LOW: Deviation 5-15% or minor impact

Look for:
- Sudden spikes or drops
- Values outside normal ranges
- Unusual patterns or trends
- Statistical outliers`;

    const result = await this.callAI<AnomalyDetectionResult>(
      prompt,
      {
        temperature: 0.2,
        maxTokens: 3000,
        systemPrompt: 'You are an expert in detecting anomalies in operational data. Analyze data and return ONLY valid JSON with anomalies.',
      }
    );

    return result.data;
  }

  private async getFuelCostContext(input: AnomalyDetectionInput, startDate: Date, endDate: Date): Promise<string> {
    const fuelEntries = await prisma.fuelEntry.findMany({
      where: {
        truckId: input.truckId,
        date: { gte: startDate, lte: endDate },
        truck: {
          companyId: input.companyId,
          mcNumberId: input.mcNumberId ? (Array.isArray(input.mcNumberId) ? { in: input.mcNumberId } : input.mcNumberId) : undefined,
        },
      },
      orderBy: { date: 'desc' },
      take: 100,
      include: {
        truck: {
          select: { truckNumber: true },
        },
      },
    });

    const costsPerGallon = fuelEntries.map(e => e.costPerGallon);
    const avgCost = costsPerGallon.length > 0
      ? costsPerGallon.reduce((sum, c) => sum + c, 0) / costsPerGallon.length
      : 0;

    return `FUEL COST DATA:
- Total Entries: ${fuelEntries.length}
- Average Cost Per Gallon: $${avgCost.toFixed(2)}
- Min Cost: $${costsPerGallon.length > 0 ? Math.min(...costsPerGallon).toFixed(2) : 'N/A'}
- Max Cost: $${costsPerGallon.length > 0 ? Math.max(...costsPerGallon).toFixed(2) : 'N/A'}

Recent Entries:
${fuelEntries.slice(0, 20).map((e, i) => `
Entry ${i + 1}:
- Date: ${e.date.toISOString().split('T')[0]}
- Truck: ${e.truck?.truckNumber || 'N/A'}
- Cost/Gallon: $${e.costPerGallon.toFixed(2)}
- Gallons: ${e.gallons.toFixed(1)}
- Total Cost: $${e.totalCost.toFixed(2)}
- Location: ${e.location || 'N/A'}
`).join('\n')}`;
  }

  private async getDelayContext(input: AnomalyDetectionInput, startDate: Date, endDate: Date): Promise<string> {
    const loads = await prisma.load.findMany({
      where: {
        companyId: input.companyId,
        driverId: input.driverId,
        truckId: input.truckId,
        mcNumberId: input.mcNumberId ? (Array.isArray(input.mcNumberId) ? { in: input.mcNumberId } : input.mcNumberId) : undefined,
        deliveryDate: { gte: startDate, lte: endDate },
        status: { in: ['DELIVERED', 'PAID'] },
      },
      select: {
        id: true,
        loadNumber: true,
        pickupDate: true,
        deliveryDate: true,
        deliveryTimeStart: true,
        onTimeDelivery: true,
      },
      take: 100,
    });

    const delays = loads
      .filter(l => l.deliveryDate && l.deliveryTimeStart)
      .map(l => {
        const delayHours = (l.deliveryDate!.getTime() - l.deliveryTimeStart!.getTime()) / (1000 * 60 * 60);
        return { load: l, delayHours };
      });

    return `DELAY DATA:
- Total Loads: ${loads.length}
- On-Time Rate: ${loads.filter(l => l.onTimeDelivery).length / Math.max(loads.length, 1) * 100}%
- Average Delay: ${delays.length > 0 ? (delays.reduce((sum, d) => sum + d.delayHours, 0) / delays.length).toFixed(1) : 0} hours

Delayed Loads:
${delays.filter(d => d.delayHours > 0).slice(0, 20).map((d, i) => `
Load ${i + 1}:
- Load Number: ${d.load.loadNumber}
- Delay: ${d.delayHours.toFixed(1)} hours
- Delivery Date: ${d.load.deliveryDate?.toISOString().split('T')[0]}
`).join('\n')}`;
  }

  private async getRevenueContext(input: AnomalyDetectionInput, startDate: Date, endDate: Date): Promise<string> {
    const loads = await prisma.load.findMany({
      where: {
        companyId: input.companyId,
        driverId: input.driverId,
        truckId: input.truckId,
        createdAt: { gte: startDate, lte: endDate },
        revenue: { gt: 0 },
      },
      select: {
        id: true,
        loadNumber: true,
        revenue: true,
        totalMiles: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const revenues = loads.map(l => l.revenue);
    const avgRevenue = revenues.length > 0
      ? revenues.reduce((sum, r) => sum + r, 0) / revenues.length
      : 0;

    return `REVENUE DATA:
- Total Loads: ${loads.length}
- Average Revenue: $${avgRevenue.toFixed(2)}
- Total Revenue: $${revenues.reduce((sum, r) => sum + r, 0).toFixed(2)}

Recent Loads:
${loads.slice(0, 20).map((l, i) => `
Load ${i + 1}:
- Load Number: ${l.loadNumber}
- Revenue: $${l.revenue.toFixed(2)}
- Miles: ${l.totalMiles || 'N/A'}
- Date: ${l.createdAt.toISOString().split('T')[0]}
`).join('\n')}`;
  }

  private async getMaintenanceCostContext(input: AnomalyDetectionInput, startDate: Date, endDate: Date): Promise<string> {
    const records = await prisma.maintenanceRecord.findMany({
      where: {
        companyId: input.companyId,
        truckId: input.truckId,
        status: 'COMPLETED',
        date: { gte: startDate, lte: endDate },
      },
      include: {
        truck: {
          select: { truckNumber: true },
        },
      },
      take: 50,
    });

    const costs = records.map(r => r.cost);
    const avgCost = costs.length > 0
      ? costs.reduce((sum, c) => sum + c, 0) / costs.length
      : 0;

    return `MAINTENANCE COST DATA:
- Total Records: ${records.length}
- Average Cost: $${avgCost.toFixed(2)}
- Total Cost: $${costs.reduce((sum, c) => sum + c, 0).toFixed(2)}

Recent Records:
${records.slice(0, 20).map((r, i) => `
Record ${i + 1}:
- Truck: ${r.truck?.truckNumber || 'N/A'}
- Type: ${r.type}
- Cost: $${r.cost.toFixed(2)}
- Date: ${r.date?.toISOString().split('T')[0] || 'N/A'}
`).join('\n')}`;
  }

  private async getDriverBehaviorContext(input: AnomalyDetectionInput, startDate: Date, endDate: Date): Promise<string> {
    if (!input.driverId) {
      return 'Driver ID required for driver behavior analysis';
    }

    const driver = await prisma.driver.findUnique({
      where: { id: input.driverId },
      include: {
        hosViolations: {
          where: { violationDate: { gte: startDate, lte: endDate } },
        },
        safetyIncidents: {
          where: { date: { gte: startDate, lte: endDate } },
        },
        loads: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
          select: {
            onTimeDelivery: true,
          },
        },
      },
    });

    if (!driver) {
      return 'Driver not found';
    }

    return `DRIVER BEHAVIOR DATA:
- Driver: ${driver.driverNumber}
- HOS Violations: ${driver.hosViolations?.length || 0}
- Safety Incidents: ${driver.safetyIncidents?.length || 0}
- On-Time Rate: ${driver.loads?.filter(l => l.onTimeDelivery).length / Math.max(driver.loads?.length || 1, 1) * 100}%

Violations:
${driver.hosViolations?.slice(0, 10).map((v, i) => `
Violation ${i + 1}: ${v.violationType} on ${v.violationDate.toISOString().split('T')[0]}
`).join('\n') || 'None'}`;
  }

  private async getGeneralContext(input: AnomalyDetectionInput, startDate: Date, endDate: Date): Promise<string> {
    // Combine multiple data sources
    const fuelContext = await this.getFuelCostContext(input, startDate, endDate);
    const revenueContext = await this.getRevenueContext(input, startDate, endDate);
    const delayContext = await this.getDelayContext(input, startDate, endDate);

    return `${fuelContext}\n\n${revenueContext}\n\n${delayContext}`;
  }
}

