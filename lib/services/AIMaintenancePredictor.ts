/**
 * AI Maintenance Predictor Service
 * Predicts maintenance needs based on historical data and patterns
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';

interface MaintenancePredictionInput {
  truckId: string;
  companyId: string;
}

interface MaintenancePrediction {
  type: string;
  description: string;
  predictedDate: string;
  confidence: number;
  reasoning: string;
  estimatedCost?: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: {
    mileageBased?: boolean;
    timeBased?: boolean;
    usagePattern?: string;
    historicalFrequency?: number;
  };
}

interface MaintenancePredictionResult {
  truckId: string;
  truckNumber: string;
  currentMileage: number;
  predictions: MaintenancePrediction[];
  recommendations: string[];
}

export class AIMaintenancePredictor extends AIService {
  /**
   * Predict maintenance needs for a truck
   */
  async predictMaintenance(input: MaintenancePredictionInput): Promise<MaintenancePredictionResult> {
    // Fetch truck details
    const truck = await prisma.truck.findUnique({
      where: { id: input.truckId },
      include: {
        maintenanceRecords: {
          where: {
            status: 'COMPLETED',
          },
          orderBy: { date: 'desc' },
          take: 20,
        },
        fuelEntries: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        breakdowns: {
          orderBy: { reportedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!truck) {
      throw new Error('Truck not found');
    }

    // Calculate usage patterns
    const maintenanceRecords = truck.maintenanceRecords || [];
    const fuelEntries = truck.fuelEntries || [];
    const breakdowns = truck.breakdowns || [];

    const currentMileage = truck.odometerReading || 0;
    const lastMaintenance = truck.lastMaintenance;
    const milesSinceLastMaintenance = lastMaintenance && maintenanceRecords.length > 0
      ? currentMileage - (maintenanceRecords[0].odometer || 0)
      : 0;

    // Calculate average miles per month
    const oldestFuelEntry = fuelEntries[fuelEntries.length - 1];
    const newestFuelEntry = fuelEntries[0];
    let avgMilesPerMonth = 0;
    if (oldestFuelEntry && newestFuelEntry) {
      const daysDiff = Math.max(1, (newestFuelEntry.date.getTime() - oldestFuelEntry.date.getTime()) / (1000 * 60 * 60 * 24));
      const totalMiles = currentMileage - (oldestFuelEntry.odometer || 0);
      avgMilesPerMonth = (totalMiles / daysDiff) * 30;
    }

    // Build maintenance history summary
    const maintenanceByType: Record<string, any[]> = {};
    maintenanceRecords.forEach(record => {
      if (!maintenanceByType[record.type]) {
        maintenanceByType[record.type] = [];
      }
      maintenanceByType[record.type].push({
        date: record.date?.toISOString() || null,
        mileage: record.odometer,
        cost: record.cost,
      });
    });

    // Build AI prompt
    const prompt = `Predict maintenance needs for a truck. Return JSON with maintenance predictions.

TRUCK DETAILS:
- Truck Number: ${truck.truckNumber}
- Make/Model: ${truck.make} ${truck.model} ${truck.year}
- Current Mileage: ${currentMileage.toLocaleString()} miles
- Last Maintenance: ${lastMaintenance ? lastMaintenance.toISOString().split('T')[0] : 'Never'}
- Miles Since Last Maintenance: ${milesSinceLastMaintenance.toLocaleString()} miles
- Average Miles Per Month: ${avgMilesPerMonth.toFixed(0)} miles

MAINTENANCE HISTORY (Last 20 records):
${maintenanceRecords.map((rec, i) => `
Record ${i + 1}:
- Type: ${rec.type}
- Date: ${rec.date?.toISOString().split('T')[0] || 'N/A'}
- Mileage: ${rec.odometer.toLocaleString()} miles
- Cost: $${rec.cost.toFixed(2)}
- Description: ${rec.description}
`).join('\n')}

BREAKDOWN HISTORY (Last 10):
${breakdowns.length > 0 ? breakdowns.map((bd, i) => `
Breakdown ${i + 1}:
- Type: ${bd.breakdownType}
- Date: ${bd.reportedAt.toISOString().split('T')[0]}
- Description: ${bd.description}
`).join('\n') : 'No breakdowns recorded'}

MAINTENANCE PATTERNS BY TYPE:
${Object.entries(maintenanceByType).map(([type, records]) => `
${type}:
- Frequency: ${records.length} records
- Average Interval: ${records.length > 1 ? ((records[0].mileage - records[records.length - 1].mileage) / (records.length - 1)).toFixed(0) : 'N/A'} miles
- Last Service: ${records[0].date?.split('T')[0] || 'N/A'}
- Average Cost: $${(records.reduce((sum, r) => sum + (r.cost || 0), 0) / records.length).toFixed(2)}
`).join('\n')}

STANDARD MAINTENANCE INTERVALS:
- Oil Change: Every 10,000-15,000 miles or 3-6 months
- Tire Rotation: Every 5,000-8,000 miles
- Brake Service: Every 30,000-50,000 miles or as needed
- PMI (Preventive Maintenance Inspection): Every 10,000-15,000 miles
- Transmission Service: Every 30,000-60,000 miles
- Engine Service: Every 50,000-100,000 miles

Return JSON with:
- predictions: array of {
    type: string (OIL_CHANGE, TIRE_ROTATION, BRAKE_SERVICE, INSPECTION, REPAIR, PMI, ENGINE, TRANSMISSION, OTHER),
    description: string,
    predictedDate: string (ISO format, when maintenance is likely needed),
    confidence: number (0-100),
    reasoning: string,
    estimatedCost: number (optional),
    urgency: string (LOW, MEDIUM, HIGH, CRITICAL),
    factors: {mileageBased, timeBased, usagePattern, historicalFrequency}
  }
- recommendations: array of strings with maintenance recommendations

Consider:
1. Standard maintenance intervals based on mileage
2. Historical maintenance patterns for this truck
3. Time since last maintenance
4. Breakdown history (if frequent breakdowns, suggest more frequent maintenance)
5. Usage patterns (high mileage = more frequent maintenance)`;

    const result = await this.callAI<{ predictions: MaintenancePrediction[]; recommendations: string[] }>(
      prompt,
      {
        temperature: 0.2,
        maxTokens: 3000,
        systemPrompt: 'You are an expert in truck maintenance prediction. Analyze maintenance history and return ONLY valid JSON with predictions.',
      }
    );

    return {
      truckId: truck.id,
      truckNumber: truck.truckNumber,
      currentMileage,
      predictions: result.data.predictions || [],
      recommendations: result.data.recommendations || [],
    };
  }
}

