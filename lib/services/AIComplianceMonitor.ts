/**
 * Compliance Risk Monitor Service
 * Monitors CSA scores, IFTA compliance, DOT inspection risks, and document expiry
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';

interface ComplianceRisk {
  companyId: string;
  csaScore: {
    current: number | null;
    predicted: number | null;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskFactors: string[];
  };
  iftaCompliance: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    riskFactors: string[];
    recommendations: string[];
  };
  dotInspectionRisk: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    riskScore: number; // 0-100
    riskFactors: string[];
  };
  documentExpiryAlerts: Array<{
    documentType: string;
    entityId: string;
    entityName: string;
    expiryDate: string;
    daysUntilExpiry: number;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  overallComplianceRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
}

export class AIComplianceMonitor extends AIService {
  async getComplianceRisk(companyId: string): Promise<ComplianceRisk> {
    // Fetch safety data
    const [safetyIncidents, roadsideInspections, dvirs, csascores, drivers, trucks] = await Promise.all([
      prisma.safetyIncident.findMany({
        where: { companyId, deletedAt: null },
        orderBy: { date: 'desc' },
        take: 20,
        select: { date: true, incidentType: true, severity: true },
      }),
      prisma.roadsideInspection.findMany({
        where: { truck: { companyId } },
        orderBy: { inspectionDate: 'desc' },
        take: 20,
        select: { inspectionDate: true, violationsFound: true, outOfService: true },
      }),
      prisma.dVIR.findMany({
        where: { truck: { companyId } },
        orderBy: { inspectionDate: 'desc' },
        take: 30,
        select: { inspectionDate: true, defects: true, inspectionType: true },
      }),
      prisma.cSAScore.findMany({
        where: { companyId },
        orderBy: { scoreDate: 'desc' },
        take: 5,
        select: { score: true, percentile: true, scoreDate: true },
      }),
      prisma.driver.findMany({
        where: { companyId, isActive: true, deletedAt: null },
        include: {
          medicalCards: {
            select: { expirationDate: true },
            orderBy: { expirationDate: 'asc' },
            take: 1,
          },
          cdlRecord: {
            select: { expirationDate: true },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        take: 50,
      }),
      prisma.truck.findMany({
        where: { companyId, isActive: true, deletedAt: null },
        select: {
          id: true,
          truckNumber: true,
          registrationExpiry: true,
          inspectionExpiry: true,
        },
        take: 50,
      }),
    ]);

    const prompt = `Analyze compliance risk for a trucking company.

SAFETY INCIDENTS (${safetyIncidents.length} recent):
${JSON.stringify(safetyIncidents, null, 2)}

ROADSIDE INSPECTIONS (${roadsideInspections.length} recent):
${JSON.stringify(roadsideInspections, null, 2)}

DVIRS (${dvirs.length} recent):
${JSON.stringify(dvirs, null, 2)}

CSA SCORES (${csascores.length} records):
${JSON.stringify(csascores, null, 2)}

DRIVER DOCUMENTS:
- Medical Cards: ${drivers.filter(d => d.medicalCards.length > 0).length} drivers with active cards
- CDL Records: ${drivers.filter(d => d.cdlRecord).length} drivers with active CDLs

TRUCK DOCUMENTS:
- Registration Expiry: ${trucks.filter(t => t.registrationExpiry).length} trucks with registration
- Inspection Expiry: ${trucks.filter(t => t.inspectionExpiry).length} trucks with inspections

Return JSON with:
- companyId: string
- csaScore: {
    current: number | null,
    predicted: number | null,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    riskFactors: string[]
  }
- iftaCompliance: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    riskFactors: string[],
    recommendations: string[]
  }
- dotInspectionRisk: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    riskScore: number (0-100),
    riskFactors: string[]
  }
- documentExpiryAlerts: array of {
    documentType: string,
    entityId: string,
    entityName: string,
    expiryDate: string (ISO),
    daysUntilExpiry: number,
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }
- overallComplianceRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
- recommendations: string[]`;

    const result = await this.callAI<ComplianceRisk>(
      prompt,
      {
        temperature: 0.3,
        maxTokens: 3000,
        systemPrompt: 'You are an expert in trucking compliance and CSA score management. Return ONLY valid JSON.',
      }
    );

    // Add document expiry alerts from actual data
    const documentAlerts: ComplianceRisk['documentExpiryAlerts'] = [];
    const today = new Date();

    drivers.forEach(driver => {
      driver.medicalCards?.forEach((card: any) => {
        const daysUntil = Math.floor((new Date(card.expirationDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 90) {
          documentAlerts.push({
            documentType: 'MEDICAL_CARD',
            entityId: driver.id,
            entityName: `${driver.user?.firstName || ''} ${driver.user?.lastName || ''}`,
            expiryDate: card.expirationDate.toISOString(),
            daysUntilExpiry: daysUntil,
            urgency: daysUntil <= 30 ? 'CRITICAL' : daysUntil <= 60 ? 'HIGH' : 'MEDIUM',
          });
        }
      });
      if (driver.cdlRecord) {
        const cdl = driver.cdlRecord;
        const daysUntil = Math.floor((new Date(cdl.expirationDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 90) {
          documentAlerts.push({
            documentType: 'CDL',
            entityId: driver.id,
            entityName: `${driver.user?.firstName || ''} ${driver.user?.lastName || ''}`,
            expiryDate: cdl.expirationDate.toISOString(),
            daysUntilExpiry: daysUntil,
            urgency: daysUntil <= 30 ? 'CRITICAL' : daysUntil <= 60 ? 'HIGH' : 'MEDIUM',
          });
        }
      }
    });

    trucks.forEach(truck => {
      if (truck.registrationExpiry) {
        const daysUntil = Math.floor((new Date(truck.registrationExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 90) {
          documentAlerts.push({
            documentType: 'REGISTRATION',
            entityId: truck.id,
            entityName: truck.truckNumber,
            expiryDate: truck.registrationExpiry.toISOString(),
            daysUntilExpiry: daysUntil,
            urgency: daysUntil <= 30 ? 'CRITICAL' : daysUntil <= 60 ? 'HIGH' : 'MEDIUM',
          });
        }
      }
      if (truck.inspectionExpiry) {
        const daysUntil = Math.floor((new Date(truck.inspectionExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 90) {
          documentAlerts.push({
            documentType: 'INSPECTION',
            entityId: truck.id,
            entityName: truck.truckNumber,
            expiryDate: truck.inspectionExpiry.toISOString(),
            daysUntilExpiry: daysUntil,
            urgency: daysUntil <= 30 ? 'CRITICAL' : daysUntil <= 60 ? 'HIGH' : 'MEDIUM',
          });
        }
      }
    });

    return {
      ...result.data,
      companyId,
      documentExpiryAlerts: [...result.data.documentExpiryAlerts, ...documentAlerts],
    };
  }
}

