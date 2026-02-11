/**
 * AI Safety Predictor Service
 * Predicts safety risks for drivers and trucks
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';

interface SafetyPredictionInput {
  driverId?: string;
  truckId?: string;
  companyId: string;
  mcNumberId?: string; // For isolation
}

interface SafetyRiskPrediction {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0-100, higher = more risk
  factors: string[];
  recommendations: string[];
  predictedIncidentTypes?: string[];
}

interface SafetyPredictionResult {
  driverId?: string;
  driverName?: string;
  truckId?: string;
  truckNumber?: string;
  prediction: SafetyRiskPrediction;
  historicalData: {
    incidents: number;
    violations: number;
    inspections: number;
    failedInspections: number;
  };
}

export class AISafetyPredictor extends AIService {
  /**
   * Predict safety risks
   */
  async predictSafetyRisk(input: SafetyPredictionInput): Promise<SafetyPredictionResult> {
    if (!input.driverId && !input.truckId) {
      throw new Error('Either driverId or truckId must be provided');
    }

    let driver = null;
    let truck = null;
    let historicalData = {
      incidents: 0,
      violations: 0,
      inspections: 0,
      failedInspections: 0,
    };

    if (input.driverId) {
      driver = await prisma.driver.findUnique({
        where: { id: input.driverId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          safetyIncidents: {
            orderBy: { date: 'desc' },
            take: 20,
          },
          hosViolations: {
            orderBy: { violationDate: 'desc' },
            take: 20,
          },
          roadsideInspections: {
            orderBy: { inspectionDate: 'desc' },
            take: 20,
          },
          mvrRecords: {
            orderBy: { pullDate: 'desc' },
            take: 5,
          },
          drugAlcoholTests: {
            orderBy: { testDate: 'desc' },
            take: 10,
          },
        },
      });

      if (driver) {
        historicalData = {
          incidents: (driver as any).safetyIncidents?.length || 0,
          violations: (driver as any).hosViolations?.length || 0,
          inspections: (driver as any).roadsideInspections?.length || 0,
          failedInspections: (driver as any).roadsideInspections?.filter((i: any) => i.outOfService || i.violationsFound).length || 0,
        };
      }
    }

    if (input.truckId) {
      truck = await prisma.truck.findUnique({
        where: { id: input.truckId },
        include: {
          safetyIncidents: {
            orderBy: { date: 'desc' },
            take: 20,
          },
          roadsideInspections: {
            orderBy: { inspectionDate: 'desc' },
            take: 20,
          },
          breakdowns: {
            orderBy: { reportedAt: 'desc' },
            take: 10,
          },
          maintenanceRecords: {
            where: {
              status: 'COMPLETED',
            },
            orderBy: { date: 'desc' },
            take: 10,
          },
          faultHistory: {
            where: {
              isActive: true,
              severity: { in: ['high', 'critical'] }
            },
            take: 10
          }
        },
      });

      if (truck) {
        historicalData = {
          incidents: truck.safetyIncidents?.length || 0,
          violations: 0,
          inspections: truck.roadsideInspections?.length || 0,
          failedInspections: truck.roadsideInspections?.filter((i: any) => i.outOfService || i.violationsFound).length || 0,
        };
      }
    }

    if (!driver && !truck) {
      throw new Error('Driver or truck not found');
    }

    // Build AI prompt
    const entityType = driver ? 'DRIVER' : 'TRUCK';
    const entityName = driver
      ? `${(driver as any).user?.firstName || ''} ${(driver as any).user?.lastName || ''}`.trim() || driver.driverNumber
      : truck?.truckNumber || '';

    const prompt = `Assess safety risk for a ${entityType.toLowerCase()} in a trucking company. Return JSON with risk assessment.

${entityType} DETAILS:
- ${entityType === 'DRIVER' ? 'Name' : 'Truck Number'}: ${entityName}
${driver ? `
- Driver Number: ${driver.driverNumber}
- Status: ${driver.status}
- Total Loads: ${driver.totalLoads || 0}
- Total Miles: ${driver.totalMiles?.toLocaleString() || 0}
- On-Time Percentage: ${driver.onTimePercentage || 100}%
` : ''}
${truck ? `
- Make/Model: ${truck.make} ${truck.model} ${truck.year}
- Mileage: ${truck.odometerReading?.toLocaleString() || 0} miles
- Last Maintenance: ${truck.lastMaintenance ? truck.lastMaintenance.toISOString().split('T')[0] : 'Never'}
` : ''}

SAFETY HISTORY:
- Incidents: ${historicalData.incidents}
- Violations: ${historicalData.violations}
- Inspections: ${historicalData.inspections}
- Failed Inspections: ${historicalData.failedInspections}

${driver ? `
RECENT INCIDENTS:
${((driver as any).safetyIncidents || []).slice(0, 5).map((inc: any, i: number) => `
Incident ${i + 1}:
- Type: ${inc.incidentType}
- Date: ${inc.date.toISOString().split('T')[0]}
- Severity: ${inc.severity}
- Description: ${inc.description.substring(0, 200)}
`).join('\n') || 'None'}

HOS VIOLATIONS:
${((driver as any).hosViolations || []).slice(0, 5).map((v: any, i: number) => `
Violation ${i + 1}:
- Type: ${v.violationType}
- Date: ${v.violationDate.toISOString().split('T')[0]}
- Hours Over: ${v.hoursExceeded || 'N/A'}
`).join('\n') || 'None'}

MVR RECORDS:
${((driver as any).mvrRecords || []).slice(0, 3).map((mvr: any, i: number) => `
MVR ${i + 1}:
- Pull Date: ${mvr.pullDate.toISOString().split('T')[0]}
- Violations: ${mvr.violations?.length || 0}
- State: ${mvr.state || 'N/A'}
`).join('\n') || 'None'}
` : ''}

${truck ? `
RECENT INCIDENTS:
${truck.safetyIncidents?.slice(0, 5).map((inc, i) => `
Incident ${i + 1}:
- Type: ${inc.incidentType}
- Date: ${inc.date.toISOString().split('T')[0]}
- Severity: ${inc.severity}
`).join('\n') || 'None'}

BREAKDOWNS:
${truck.breakdowns?.slice(0, 5).map((bd, i) => `
Breakdown ${i + 1}:
- Type: ${bd.breakdownType}
- Date: ${bd.reportedAt.toISOString().split('T')[0]}
- Priority: ${bd.priority}
`).join('\n') || 'None'}

ACTIVE CRITICAL/HIGH FAULTS:
${(truck as any).faultHistory?.map((f: any, i: number) => `
Fault ${i + 1}:
- Code: ${f.faultCode}
- Severity: ${f.severity}
- Description: ${f.description || 'Unknown'}
- Reported: ${f.createdAt.toISOString()}
`).join('\n') || 'None'}
` : ''}

Return JSON with:
- riskLevel: string (LOW, MEDIUM, HIGH, CRITICAL)
- score: number (0-100, higher = more risk)
- factors: array of strings (key risk factors identified)
- recommendations: array of strings (safety improvement recommendations)
- predictedIncidentTypes: array of strings (types of incidents most likely to occur)

Risk factors to consider:
1. Historical incident frequency and severity
2. Violation patterns (HOS, MVR, etc.)
3. Inspection failure rate
4. ${driver ? 'Driver experience and performance' : 'Truck age, mileage, and maintenance history'}
5. Recent trends (improving vs. deteriorating)
6. Compliance status
7. ACTIVE TELEMATICS FAULTS (Critical faults should heavily weigh toward HIGH or CRITICAL risk)`;

    const result = await this.callAI<{ prediction: SafetyRiskPrediction }>(
      prompt,
      {
        temperature: 0.2,
        maxTokens: 2000,
        systemPrompt: 'You are an expert in trucking safety risk assessment. Analyze safety data and return ONLY valid JSON with risk predictions.',
      }
    );

    return {
      driverId: driver?.id,
      driverName: driver ? `${(driver as any).user?.firstName || ''} ${(driver as any).user?.lastName || ''}`.trim() : undefined,
      truckId: truck?.id,
      truckNumber: truck?.truckNumber,
      prediction: result.data.prediction,
      historicalData,
    };
  }
}

